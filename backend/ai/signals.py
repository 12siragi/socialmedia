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

    LOGIC:
      For each participant:
        1. Check TranslationPreference.is_enabled=True + target_language set
        2. Translate message to their chosen target_language
        3. Save Translation + broadcast via WebSocket
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
    sender_lang     = 'en'  # default source; autodetect can be added later

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

    # Snapshot enabled prefs with target_language set
    user_ids = [p['user_id'] for p in participants_snapshot]
    prefs_snapshot = {
        pref['user_id']: _normalize_lang(pref['target_language'])
        for pref in TranslationPreference.objects.filter(
            conversation_id=conversation_id,
            user_id__in=user_ids,
            is_enabled=True,
            target_language__isnull=False,
        ).values('user_id', 'target_language')
    }

    def _broadcast_translations():
        try:
            import asyncio
            from channels.layers import get_channel_layer

            channel_layer = get_channel_layer()
            room_group    = f"chat_{conversation_id}"

            for p in participants_snapshot:
                user_id = p['user_id']

                target_lang = prefs_snapshot.get(user_id)
                if not target_lang:
                    logger.info(
                        f"Translation skipped: not enabled or no target_language "
                        f"for user={user_id} conv={conversation_id}"
                    )
                    continue

                translated = _translate_safe(content, sender_lang, target_lang)
                if not translated:
                    logger.warning(
                        f"Translation returned empty for msg={message_id} user={user_id}"
                    )
                    continue
                # Always save + broadcast even if text looks unchanged
                # (short words may legitimately be same in target language)

                _save_translation(
                    message_id=message_id,
                    requested_by_id=user_id,
                    source_language=sender_lang,
                    target_language=target_lang,
                    original_content=content,
                    translated_content=translated,
                )

                # Use a fresh event loop to avoid blocking Daphne's event loop
                loop = asyncio.new_event_loop()
                try:
                    loop.run_until_complete(channel_layer.group_send(
                        room_group,
                        {
                            'type':               'chat.translation.ready',
                            'message_id':         message_id,
                            'translated_content': translated,
                            'target_language':    target_lang,
                            'for_user_id':        user_id,
                        }
                    ))
                finally:
                    loop.close()
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
    try:
        from ai.models import Translation
        obj, created = Translation.objects.update_or_create(
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
        logger.info(f"Translation saved: id={obj.id} created={created}")
    except Exception as e:
        logger.error(f"_save_translation error: {e}", exc_info=True)