# ai/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

logger = logging.getLogger(__name__)


def _normalize_lang(lang):
    if not lang:
        return 'en'
    return lang.strip().lower()


@receiver(post_save, sender='chat.Message')
def translate_message_on_save(sender, instance, created, **kwargs):
    """
    Fires after every Message save.

    OPTIMIZED LOGIC:
      1. Group users by target_language
      2. Translate ONCE per language (not once per user)
      3. Broadcast to all users needing that language
    """
    if not created:
        return
    if not instance.content or not instance.content.strip():
        return
    if instance.is_deleted:
        return

    message_id      = instance.id
    conversation_id = instance.conversation_id
    sender_id       = instance.sender_id
    content         = instance.content
    sender_lang     = 'en'

    from chat.models import ConversationParticipant
    from ai.models import TranslationPreference

    participants_snapshot = list(
        ConversationParticipant.objects
        .filter(conversation_id=conversation_id)
        .exclude(user_id=sender_id)
        .values('user_id')
    )

    if not participants_snapshot:
        return

    user_ids = [p['user_id'] for p in participants_snapshot]

    # Snapshot enabled prefs with target_language set
    prefs_snapshot = {
        pref['user_id']: _normalize_lang(pref['target_language'])
        for pref in TranslationPreference.objects.filter(
            conversation_id=conversation_id,
            user_id__in=user_ids,
            is_enabled=True,
            target_language__isnull=False,
        ).values('user_id', 'target_language')
    }

    if not prefs_snapshot:
        return

    # Group users by language → translate once per language
    language_map = {}
    for user_id, lang in prefs_snapshot.items():
        language_map.setdefault(lang, []).append(user_id)

    def _broadcast_translations():
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            room_group    = f"chat_{conversation_id}"

            for target_lang, user_list in language_map.items():

                # Translate ONCE per language
                translated = _translate_safe(content, sender_lang, target_lang)
                if not translated:
                    logger.warning(
                        f"Translation returned empty for msg={message_id} "
                        f"lang={target_lang}"
                    )
                    continue

                # Save ONCE per language (shared record)
                _save_translation(
                    message_id=message_id,
                    requested_by_id=user_list[0],
                    source_language=sender_lang,
                    target_language=target_lang,
                    original_content=content,
                    translated_content=translated,
                )

                # Broadcast to EACH user who needs this language
                for user_id in user_list:
                    async_to_sync(channel_layer.group_send)(
                        room_group,
                        {
                            'type':               'chat_translation_ready',
                            'message_id':         message_id,
                            'translated_content': translated,
                            'target_language':    target_lang,
                            'for_user_id':        user_id,
                        }
                    )
                    logger.info(
                        f"Translation broadcast: msg={message_id} "
                        f"{sender_lang}->{target_lang} for user={user_id}"
                    )

        except Exception as e:
            logger.error(
                f"Translation broadcast failed for msg={message_id}: {e}",
                exc_info=True
            )

    transaction.on_commit(_broadcast_translations)


def _translate_safe(content: str, source_lang: str, target_lang: str) -> str:
    try:
        from ai.services.translation import translate
        return translate(content, source_lang, target_lang)
    except Exception as e:
        logger.error(f"_translate_safe error: {e}")
        return content


def _save_translation(message_id, requested_by_id, source_language,
                      target_language, original_content, translated_content):
    """
    1 message + 1 language = 1 translation record.
    Uses get_or_create so no overwrites between users requesting same language.
    """
    try:
        from ai.models import Translation

        obj, created = Translation.objects.get_or_create(
            message_id=message_id,
            target_language=target_language,
            defaults={
                'requested_by_id':    requested_by_id,
                'source_language':    source_language,
                'original_content':   original_content,
                'translated_content': translated_content,
                'is_failed':          False,
            }
        )

        # If record existed but was incomplete (e.g. previous failure), update it
        if not created and not obj.translated_content:
            obj.translated_content = translated_content
            obj.is_failed = False
            obj.save(update_fields=['translated_content', 'is_failed'])

        logger.info(f"Translation saved: id={obj.id} created={created}")

    except Exception as e:
        logger.error(f"_save_translation error: {e}", exc_info=True)