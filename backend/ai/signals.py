# ai/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

logger = logging.getLogger(__name__)


def _normalize_lang(lang):
    """Treat None, '', 'en' all as 'en'. Lowercase for safe comparison."""
    if not lang:
        return 'en'
    return lang.strip().lower()


@receiver(post_save, sender='chat.Message')
def translate_message_on_save(sender, instance, created, **kwargs):
    if not created:
        return
    if not instance.content or not instance.content.strip():
        return
    if instance.is_deleted:
        return

    message_id = instance.id
    conversation_id = instance.conversation_id
    sender_id = instance.sender_id
    content = instance.content
    sender_lang = _normalize_lang(getattr(instance.sender, 'preferred_language', None))

    # Snapshot participants BEFORE on_commit — safe sync DB context
    from chat.models import ConversationParticipant
    from ai.models import TranslationPreference  # ✅ FIX 1: import added

    participants_snapshot = list(
        ConversationParticipant.objects
        .filter(conversation_id=conversation_id)
        .exclude(user_id=sender_id)
        .values('user_id', 'user__preferred_language')
    )

    # Snapshot translation preferences BEFORE on_commit too
    enabled_user_ids = set(
        TranslationPreference.objects
        .filter(
            conversation_id=conversation_id,
            user_id__in=[p['user_id'] for p in participants_snapshot],
            is_enabled=True
        )
        .values_list('user_id', flat=True)
    )

    def _broadcast_translations():
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer

            if not participants_snapshot:
                logger.info(f"Translation skipped: no other participants in conv={conversation_id}")
                return

            channel_layer = get_channel_layer()
            room_group = f"chat_{conversation_id}"

            for p in participants_snapshot:
                user_id = p['user_id']

                # ✅ FIX 2: Check TranslationPreference using pre-snapshotted set
                if user_id not in enabled_user_ids:
                    logger.info(f"Translation skipped: disabled for user={user_id} in conv={conversation_id}")
                    continue

                receiver_lang = _normalize_lang(p['user__preferred_language'])

                if sender_lang == 'en' and receiver_lang == 'en':
                    logger.warning(
                        f"Translation skipped: both users have no preferred_language set "
                        f"(defaulting to 'en') for msg={message_id} user={user_id}. "
                        f"Set preferred_language on sender/receiver to enable translation."
                    )
                    continue

                if sender_lang == receiver_lang:
                    logger.info(
                        f"Translation skipped: same language ({sender_lang}) "
                        f"for msg={message_id} user={user_id}."
                    )
                    continue

                translated = _translate_safe(content, sender_lang, receiver_lang)
                if not translated or translated == content:
                    logger.info(f"Translation skipped: no change for msg={message_id}")
                    continue

                _save_translation(
                    message_id=message_id,
                    requested_by_id=user_id,
                    source_language=sender_lang,
                    target_language=receiver_lang,
                    original_content=content,
                    translated_content=translated,
                )

                async_to_sync(channel_layer.group_send)(
                    room_group,
                    {
                        'type': 'chat.translation.ready',
                        'message_id': message_id,
                        'translated_content': translated,
                        'target_language': receiver_lang,
                        'for_user_id': user_id,
                    }
                )
                logger.info(
                    f"✅ Translation broadcast: msg={message_id} "
                    f"{sender_lang}→{receiver_lang} for user={user_id}"
                )

        except Exception as e:
            logger.error(f"Translation broadcast failed for message {message_id}: {e}", exc_info=True)

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
                'requested_by_id': requested_by_id,
                'source_language': source_language,
                'original_content': original_content,
                'translated_content': translated_content,
                'is_failed': False,
            }
        )
        logger.info(f"Translation saved: id={obj.id} created={created}")
    except Exception as e:
        logger.error(f"_save_translation error: {e}", exc_info=True)