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
    GET  /ai/translation-preference/<conversation_id>/
         → returns current toggle state for this user + conversation

    POST /ai/translation-preference/<conversation_id>/
         → set is_enabled = True / False
         Body: { "is_enabled": true }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        from chat.models import Conversation
        conversation = get_object_or_404(Conversation, id=conversation_id)

        # Verify user is a participant
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You are not a participant of this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pref, _ = TranslationPreference.objects.get_or_create(
            user=request.user,
            conversation=conversation,
            defaults={'is_enabled': True},
        )
        serializer = TranslationPreferenceSerializer(pref)
        return Response(serializer.data)

    def post(self, request, conversation_id):
        from chat.models import Conversation
        conversation = get_object_or_404(Conversation, id=conversation_id)

        # Verify user is a participant
        if not conversation.participants.filter(id=request.user.id).exists():
            return Response(
                {"detail": "You are not a participant of this conversation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        pref, _ = TranslationPreference.objects.get_or_create(
            user=request.user,
            conversation=conversation,
            defaults={'is_enabled': True},
        )

        serializer = TranslationPreferenceSerializer(pref, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(
                f"TranslationPreference updated: user={request.user.id} "
                f"conv={conversation_id} enabled={pref.is_enabled}"
            )
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)