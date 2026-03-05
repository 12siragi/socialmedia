# messaging/views.py
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Conversation, ConversationParticipant, Message, MessageRead
from .serializers import (
    ConversationSerializer,
    CreateConversationSerializer,
    MessageSerializer,
    SendMessageSerializer,
)

User = get_user_model()


class ConversationListView(APIView):
    """
    GET  /api/messages/conversations/  → list user's conversations
    POST /api/messages/conversations/  → create DM or group
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = Conversation.objects.filter(
            participants=request.user
        ).prefetch_related(
            'participants',
            'memberships',
            'messages',
        ).order_by('-updated_at')

        serializer = ConversationSerializer(
            conversations, many=True, context={'request': request}
        )
        return Response(serializer.data)

    def post(self, request):
        serializer = CreateConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        participant_ids = data['participant_ids']
        is_group = data.get('is_group', False)
        name = data.get('name', '')

        # Fetch other participants
        other_users = User.objects.filter(id__in=participant_ids)
        if other_users.count() != len(participant_ids):
            return Response(
                {'detail': 'One or more users not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not is_group:
            # DM — get or create
            other_user = other_users.first()
            conversation, created = Conversation.get_or_create_dm(request.user, other_user)
        else:
            # Group — always create new
            conversation = Conversation.objects.create(
                name=name,
                is_group=True,
                created_by=request.user
            )
            # Add creator + participants
            ConversationParticipant.objects.create(
                conversation=conversation, user=request.user, is_admin=True
            )
            for user in other_users:
                ConversationParticipant.objects.create(
                    conversation=conversation, user=user
                )

        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(APIView):
    """
    GET    /api/messages/conversations/<id>/  → get conversation
    DELETE /api/messages/conversations/<id>/  → leave conversation
    """
    permission_classes = [IsAuthenticated]

    def get_conversation(self, conversation_id, user):
        return get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=user
        )

    def get(self, request, conversation_id):
        conversation = self.get_conversation(conversation_id, request.user)
        serializer = ConversationSerializer(conversation, context={'request': request})
        return Response(serializer.data)

    def delete(self, request, conversation_id):
        conversation = self.get_conversation(conversation_id, request.user)
        ConversationParticipant.objects.filter(
            conversation=conversation, user=request.user
        ).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageListView(APIView):
    """
    GET  /api/messages/conversations/<id>/messages/  → list messages
    POST /api/messages/conversations/<id>/messages/  → send message
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_conversation(self, conversation_id, user):
        return get_object_or_404(
            Conversation,
            id=conversation_id,
            participants=user
        )

    def get(self, request, conversation_id):
        conversation = self.get_conversation(conversation_id, request.user)

        # Cursor-based pagination via `before` query param
        before_id = request.query_params.get('before')
        messages = conversation.messages.filter(
            is_deleted=False
        ).select_related(
            'sender', 'reply_to__sender'
        ).prefetch_related('read_by__user')

        if before_id:
            messages = messages.filter(id__lt=before_id)

        messages = messages.order_by('-created_at')[:50]
        messages = list(reversed(messages))  # Return oldest first

        # Mark as read — update last_read_at
        ConversationParticipant.objects.filter(
            conversation=conversation,
            user=request.user
        ).update(last_read_at=messages[-1].created_at if messages else None)

        serializer = MessageSerializer(messages, many=True, context={'request': request})
        return Response({
            'results': serializer.data,
            'has_more': len(messages) == 50,
        })

    def post(self, request, conversation_id):
        conversation = self.get_conversation(conversation_id, request.user)

        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        content = data.get('content', '')
        media = data.get('media')
        reply_to = data.get('reply_to')

        # Determine message type
        if media:
            content_type = getattr(media, 'content_type', '')
            if content_type.startswith('image/'):
                msg_type = 'image'
            elif content_type.startswith('video/'):
                msg_type = 'video'
            else:
                msg_type = 'file'
        else:
            msg_type = 'text'

        message = Message.objects.create(
            conversation=conversation,
            sender=request.user,
            content=content,
            message_type=msg_type,
            media=media,
            reply_to=reply_to,
        )

        # Update conversation timestamp
        from django.utils import timezone
        conversation.updated_at = timezone.now()
        conversation.save(update_fields=['updated_at'])

        serializer = MessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class MessageDeleteView(APIView):
    """
    DELETE /api/messages/messages/<id>/  → soft delete message
    """
    permission_classes = [IsAuthenticated]

    def delete(self, request, message_id):
        message = get_object_or_404(Message, id=message_id, sender=request.user)
        message.soft_delete()
        return Response({'detail': 'Message deleted.'}, status=status.HTTP_200_OK)