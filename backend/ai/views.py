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