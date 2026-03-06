# ai/signals.py
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db import transaction

logger = logging.getLogger(__name__)

# =============================================================================
# FIX 1: Use transaction.on_commit() so the broadcast only fires AFTER the
#         Message row is fully committed to the DB. Without this, the WS event
#         arrives at the frontend before the message exists, causing silent drops.
#
# FIX 2: Treat None / '' / 'en' all as English so the language comparison
#         works correctly. Previously None defaulted to 'en' for sender but
#         a receiver with None would also be 'en', causing the same-language
#         skip to fire even when languages are genuinely different.
#
# FIX 3: Log the skip reason so you can see exactly why translation is skipped.
# =============================================================================

def _normalize_lang(lang):
    """Treat None, '', 'en' all as 'en'. Lowercase for safe comparison."""
    if not lang:
        return 'en'
    return lang.strip().lower()


@receiver(post_save, sender='chat.Message')
def translate_message_on_save(sender, instance, created, **kwargs):
    """
    Fires after every Message save.
    Uses transaction.on_commit so the WS broadcast only fires after the
    DB transaction is fully committed — preventing race conditions where
    the receiver gets the WS event before the message exists in the DB.
    """
    if not created:
        return
    if not instance.content or not instance.content.strip():
        return
    if instance.is_deleted:
        return

    # Capture all values NOW (before the lambda closes over a stale instance)
    message_id = instance.id
    conversation_id = instance.conversation_id
    sender_id = instance.sender_id
    content = instance.content
    sender_lang = _normalize_lang(getattr(instance.sender, 'preferred_language', None))

    def _broadcast_translations():
        """Runs after DB commit — safe to broadcast over WebSocket now."""
        try:
            from asgiref.sync import async_to_sync
            from channels.layers import get_channel_layer
            from chat.models import ConversationParticipant

            participants = ConversationParticipant.objects.filter(
                conversation_id=conversation_id
            ).exclude(
                user_id=sender_id
            ).select_related('user')

            if not participants.exists():
                logger.info(f"Translation skipped: no other participants in conv={conversation_id}")
                return

            channel_layer = get_channel_layer()
            room_group = f"chat_{conversation_id}"

            for participant in participants:
                receiver_lang = _normalize_lang(
                    getattr(participant.user, 'preferred_language', None)
                )

                # FIX 2: Log the skip so you can debug language mismatches
                if sender_lang == receiver_lang:
                    logger.info(
                        f"Translation skipped: same language ({sender_lang}) "
                        f"for msg={message_id} user={participant.user_id}. "
                        f"Set different preferred_language on sender/receiver to enable translation."
                    )
                    continue

                translated = _translate_safe(content, sender_lang, receiver_lang)
                if not translated or translated == content:
                    logger.info(f"Translation skipped: no change for msg={message_id}")
                    continue

                _save_translation(
                    message_id=message_id,
                    requested_by=participant.user,
                    source_language=sender_lang,
                    target_language=receiver_lang,
                    original_content=content,
                    translated_content=translated,
                )

                # FIX 1: This now runs post-commit, so the message exists in DB
                async_to_sync(channel_layer.group_send)(
                    room_group,
                    {
                        'type': 'chat.translation.ready',
                        'message_id': message_id,
                        'translated_content': translated,
                        'target_language': receiver_lang,
                        'for_user_id': participant.user_id,
                    }
                )
                logger.info(
                    f"✅ Translation broadcast: msg={message_id} "
                    f"{sender_lang}→{receiver_lang} for user={participant.user_id}"
                )

        except Exception as e:
            logger.error(f"Translation broadcast failed for message {message_id}: {e}", exc_info=True)

    # FIX 1: Defer broadcast until AFTER the transaction commits
    transaction.on_commit(_broadcast_translations)


def _translate_safe(content: str, source_lang: str, target_lang: str) -> str:
    try:
        from ai.services.translation import translate
        return translate(content, source_lang, target_lang)
    except Exception as e:
        logger.error(f"_translate_safe error: {e}")
        return content


def _save_translation(message_id, requested_by, source_language,
                       target_language, original_content, translated_content):
    try:
        from ai.models import Translation
        obj, created = Translation.objects.update_or_create(
            message_id=message_id,
            target_language=target_language,
            defaults={
                'requested_by': requested_by,
                'source_language': source_language,
                'original_content': original_content,
                'translated_content': translated_content,
                'is_failed': False,
            }
        )
        logger.info(f"Translation saved: id={obj.id} created={created}")
    except Exception as e:
        logger.error(f"_save_translation error: {e}", exc_info=True)