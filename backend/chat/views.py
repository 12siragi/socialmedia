# chat/views.py
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.pagination import CursorPagination
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone

from .models import Conversation, ConversationParticipant, Message, MessageRead
from .serializers import (
    ConversationSerializer,
    CreateConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
)

logger = logging.getLogger(__name__)


# ─── Pagination ──────────────────────────────────────────────────────────────

class MessageCursorPagination(CursorPagination):
    """
    Cursor-based pagination for messages.
    Returns messages newest-first, stable across inserts.
    """
    page_size          = 30
    ordering           = '-created_at'
    cursor_query_param = 'cursor'


# ─── Conversations ────────────────────────────────────────────────────────────

class ConversationListView(APIView):
    """
    GET  /chat/conversations/
         → list all conversations for the requesting user

    POST /chat/conversations/
         → create a new DM or group conversation
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = (
            Conversation.objects
            .filter(participants=request.user)
            .prefetch_related(
                'participants',
                Prefetch(
                    'memberships',
                    queryset=ConversationParticipant.objects.select_related('user'),
                ),
            )
            .order_by('-updated_at')
        )
        serializer = ConversationSerializer(
            conversations, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data            = serializer.validated_data
        participant_ids = data['participant_ids']
        is_group        = data['is_group']
        name            = data.get('name', '').strip()

        with transaction.atomic():
            # For DMs — return existing conversation if one already exists
            if not is_group:
                other_id = participant_ids[0]
                existing = (
                    Conversation.objects
                    .filter(is_group=False, participants=request.user)
                    .filter(participants__id=other_id)
                    .first()
                )
                if existing:
                    return Response(
                        ConversationSerializer(existing, context={'request': request}).data,
                        status=status.HTTP_200_OK,
                    )

            conversation = Conversation.objects.create(
                name=name,
                is_group=is_group,
            )

            # Add requesting user + all participants
            all_ids = list(set(participant_ids + [request.user.id]))
            ConversationParticipant.objects.bulk_create([
                ConversationParticipant(conversation=conversation, user_id=uid)
                for uid in all_ids
            ])

        logger.info(
            f"Conversation created: id={conversation.id} "
            f"is_group={is_group} by user={request.user.id}"
        )
        return Response(
            ConversationSerializer(conversation, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ConversationDetailView(APIView):
    """
    GET /chat/conversations/<conversation_id>/
        → retrieve a single conversation
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, conversation_id):
        conversation = get_object_or_404(
            Conversation.objects.prefetch_related('participants', 'memberships'),
            id=conversation_id,
            participants=request.user,
        )
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)


# ─── Messages ─────────────────────────────────────────────────────────────────

class MessageListView(APIView):
    """
    GET  /chat/conversations/<conversation_id>/messages/
         → paginated message list, newest first
         → each message includes translation for requesting user if available

    POST /chat/conversations/<conversation_id>/messages/
         → send a new message
         → signal auto-triggers translation after save
    """
    permission_classes = [IsAuthenticated]

    def _get_conversation(self, request, conversation_id):
        """Get conversation and verify user is a participant."""
        return get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=request.user,
        )

    def get(self, request, conversation_id):
        conversation = self._get_conversation(request, conversation_id)

        messages = (
            Message.objects
            .filter(conversation=conversation)
            .select_related('sender', 'reply_to__sender')
            .prefetch_related(
                Prefetch(
                    'read_by',
                    queryset=MessageRead.objects.select_related('user'),
                )
            )
            .order_by('-created_at')
        )

        paginator = MessageCursorPagination()
        page = paginator.paginate_queryset(messages, request)
        serializer = MessageSerializer(page, many=True, context={'request': request})
        return paginator.get_paginated_response(serializer.data)

    def post(self, request, conversation_id):
        conversation = self._get_conversation(request, conversation_id)

        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        message = serializer.save(
            conversation=conversation,
            sender=request.user,
        )

        # Signal (signals.py) fires automatically after save —
        # translation is triggered there via transaction.on_commit

        logger.info(
            f"Message created: id={message.id} "
            f"conv={conversation_id} user={request.user.id}"
        )
        return Response(
            MessageSerializer(message, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageDeleteView(APIView):
    """
    DELETE /chat/conversations/<conversation_id>/messages/<message_id>/
           → soft delete (only sender can delete their own message)
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, conversation_id, message_id):
        message = get_object_or_404(
            Message,
            id=message_id,
            conversation_id=conversation_id,
            sender=request.user,
        )
        message.soft_delete()
        logger.info(f"Message soft deleted: id={message_id} by user={request.user.id}")
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageReadView(APIView):
    """
    POST /chat/conversations/<conversation_id>/messages/read/
         Body: { "message_ids": [1, 2, 3] }
         → mark messages as read by the requesting user
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=request.user,
        )

        message_ids = request.data.get('message_ids', [])
        if not message_ids or not isinstance(message_ids, list):
            return Response(
                {"detail": "message_ids must be a non-empty list."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only mark messages the user did NOT send
        valid_ids = (
            Message.objects
            .filter(
                id__in=message_ids,
                conversation_id=conversation_id,
            )
            .exclude(sender=request.user)
            .values_list('id', flat=True)
        )

        reads = [
            MessageRead(message_id=mid, user=request.user)
            for mid in valid_ids
        ]
        MessageRead.objects.bulk_create(reads, ignore_conflicts=True)

        # Update last_read_at on membership
        ConversationParticipant.objects.filter(
            conversation_id=conversation_id,
            user=request.user,
        ).update(last_read_at=timezone.now())

        return Response({"marked_read": len(reads)})