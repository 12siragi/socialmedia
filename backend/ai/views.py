# ai/views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import TranslationPreference
from .serializers import TranslationPreferenceSerializer

logger = logging.getLogger(__name__)


class TranslationPreferenceView(APIView):
    """
    GET  /api/ai/translation-preference/<conversation_id>/
         Returns current toggle state for this user + conversation.

    POST /api/ai/translation-preference/<conversation_id>/
         Body: { "is_enabled": true, "target_language": "ar" }
         or:   { "is_enabled": false }
    """
    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, conversation_id):
        from chat.models import Conversation
        conversation = get_object_or_404(Conversation, id=conversation_id)
        if not conversation.participants.filter(id=request.user.id).exists():
            return None, Response(
                {"detail": "You are not a participant of this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )
        return conversation, None

    def get(self, request, conversation_id):
        conversation, err = self._get_conversation(request, conversation_id)
        if err:
            return err

        pref, _ = TranslationPreference.objects.get_or_create(
            user=request.user,
            conversation=conversation,
            defaults={'is_enabled': False, 'target_language': None},
        )
        return Response(TranslationPreferenceSerializer(pref).data)

    def post(self, request, conversation_id):
        conversation, err = self._get_conversation(request, conversation_id)
        if err:
            return err

        # Log incoming payload for debugging
        logger.info(
            f"TranslationPreference POST: user={request.user.id} "
            f"conv={conversation_id} data={request.data}"
        )

        pref, _ = TranslationPreference.objects.get_or_create(
            user=request.user,
            conversation=conversation,
            defaults={'is_enabled': False, 'target_language': None},
        )

        serializer = TranslationPreferenceSerializer(
            pref, data=request.data, partial=True
        )
        if serializer.is_valid():
            instance = serializer.save()
            logger.info(
                f"TranslationPreference saved: user={request.user.id} "
                f"conv={conversation_id} "
                f"enabled={instance.is_enabled} "
                f"target={instance.target_language}"
            )
            return Response(TranslationPreferenceSerializer(instance).data)

        logger.error(
            f"TranslationPreference invalid: user={request.user.id} "
            f"conv={conversation_id} errors={serializer.errors}"
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class MessageAudioView(APIView):
    """
    POST /api/ai/audio/<message_id>/

    Truth checks (in order):
      1. Message exists                    → 404 if not
      2. Requester is a participant        → 403 if not
      3. Requester is NOT the sender       → 403 (audio for receivers only)
      4. Audio already generated           → return cached audio_url immediately
      5. Coqui available                   → 503 if not
      6. Get text to speak:
           translation enabled + exists    → use translated_content
           else                            → use original message content
      7. Generate audio → save → return url
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, message_id):
        from chat.models import Message, ConversationParticipant
        from ai.models import MessageAudio, Translation, TranslationPreference
        from ai.services.coqui_tts import generate_audio, is_available

        # 1. Message exists
        try:
            message = Message.objects.select_related('sender').get(
                id=message_id,
                is_deleted=False,
            )
        except Message.DoesNotExist:
            return Response({"error": "Message not found"}, status=status.HTTP_404_NOT_FOUND)

        # 2. Requester is a participant
        is_participant = ConversationParticipant.objects.filter(
            conversation_id=message.conversation_id,
            user=request.user,
        ).exists()
        if not is_participant:
            return Response({"error": "Not a participant"}, status=status.HTTP_403_FORBIDDEN)

        # 3. Receivers only — sender cannot request audio of own message
        if message.sender_id == request.user.id:
            return Response(
                {"error": "Cannot generate audio for your own message"},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 4. Return cached audio if already generated
        try:
            existing = message.audio
            if existing.can_play:
                return Response({
                    "audio_url":       existing.audio_url,
                    "audio_generated": True,
                    "cached":          True,
                })
        except MessageAudio.DoesNotExist:
            pass

        # 5. Coqui availability check
        if not is_available():
            return Response(
                {"error": "TTS engine unavailable, try again shortly"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        # 6. Decide what text to speak
        #    Translation enabled + translation exists → speak translated content
        #    Otherwise → speak original content
        text_to_speak = message.content  # default

        pref = TranslationPreference.objects.filter(
            user=request.user,
            conversation_id=message.conversation_id,
            is_enabled=True,
            target_language__isnull=False,
        ).first()

        spoke_translation = False
        if pref:
            translation = Translation.objects.filter(
                message_id=message_id,
                target_language=pref.target_language,
                is_failed=False,
            ).exclude(translated_content__isnull=True).first()

            if translation and translation.translated_content:
                text_to_speak     = translation.translated_content
                spoke_translation = True

        # 7. Generate audio
        try:
            audio_url = generate_audio(text_to_speak, message_id)

            audio_record, _ = MessageAudio.objects.update_or_create(
                message=message,
                defaults={
                    "audio_url":         audio_url,
                    "audio_generated":   True,
                    "audio_failed":      False,
                    "spoke_translation": spoke_translation,
                }
            )

            logger.info(
                f"Audio generated: msg={message_id} "
                f"user={request.user.id} "
                f"translation={spoke_translation}"
            )

            return Response({
                "audio_url":         audio_url,
                "audio_generated":   True,
                "spoke_translation": spoke_translation,
                "cached":            False,
            })

        except Exception as e:
            logger.error(f"Audio generation failed: msg={message_id} error={e}")
            MessageAudio.objects.update_or_create(
                message=message,
                defaults={
                    "audio_generated": False,
                    "audio_failed":    True,
                }
            )
            return Response(
                {"error": "Audio generation failed"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )