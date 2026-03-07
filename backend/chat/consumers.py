# messaging/consumers.py
import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()
logger = logging.getLogger(__name__)


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time chat.

    Events handled:
    - chat.message        → new message sent
    - chat.typing         → user is typing (not saved to DB)
    - chat.read           → user read messages
    - chat.message.delete → message deleted
    """

    async def connect(self):
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f"chat_{self.conversation_id}"
        self.user = self.scope.get('user')

        # Reject unauthenticated connections
        if not self.user or not self.user.is_authenticated:
            await self.close(code=4001)
            return

        # Reject if user is not a participant
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close(code=4003)
            return

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        # Notify others user is online
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'user.online',
                'user_id': self.user.id,
                'full_name': self.user.full_name,
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            # Notify others user went offline
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'user.offline',
                    'user_id': self.user.id,
                }
            )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            await self.send_error("Invalid JSON")
            return

        event_type = data.get('type')

        if event_type == 'chat.message':
            await self.handle_message(data)
        elif event_type == 'chat.typing':
            await self.handle_typing(data)
        elif event_type == 'chat.read':
            await self.handle_read(data)
        elif event_type == 'chat.message.delete':
            await self.handle_delete(data)
        else:
            await self.send_error(f"Unknown event type: {event_type}")

    # ─── Handlers ────────────────────────────────────────────────────

    async def handle_message(self, data):
        content = data.get('content', '').strip()
        reply_to_id = data.get('reply_to')

        if not content:
            await self.send_error("Empty message")
            return

        # Save to DB
        message = await self.save_message(content, reply_to_id)
        if not message:
            await self.send_error("Failed to save message")
            return

        # Update conversation updated_at
        await self.touch_conversation()

        # Broadcast to group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.message',
                'message': {
                    'id': message['id'],
                    'conversation': int(self.conversation_id),
                    'sender': message['sender'],
                    'content': message['content'],
                    'message_type': message['message_type'],
                    'reply_to': reply_to_id,
                    'created_at': message['created_at'],
                    'read_by': [],
                }
            }
        )

    async def handle_typing(self, data):
        is_typing = data.get('is_typing', False)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.typing',
                'user_id': self.user.id,
                'full_name': self.user.full_name,
                'is_typing': is_typing,
            }
        )

    async def handle_read(self, data):
        message_ids = data.get('message_ids', [])
        if not message_ids:
            await self.send_error("message_ids is required")  # FIX: client feedback
            return

        await self.mark_messages_read(message_ids)
        await self.update_last_read()

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.read',
                'user_id': self.user.id,
                'message_ids': message_ids,
            }
        )

    async def handle_delete(self, data):
        message_id = data.get('message_id')
        if not message_id:
            await self.send_error("message_id is required")  # FIX: client feedback
            return

        success = await self.delete_message(message_id)
        if not success:
            await self.send_error("Cannot delete this message")
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat.message.delete',
                'message_id': message_id,
                'deleted_by': self.user.id,
            }
        )

    # ─── Group event handlers (broadcast to WebSocket) ───────────────

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat.message',
            'message': event['message'],
        }))

    async def chat_typing(self, event):
        # Don't send typing back to the sender
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'chat.typing',
                'user_id': event['user_id'],
                'full_name': event['full_name'],
                'is_typing': event['is_typing'],
            }))

    async def chat_read(self, event):
        # FIX: Don't echo back to the sender — they already know they read it
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'chat.read',
                'user_id': event['user_id'],
                'message_ids': event['message_ids'],
            }))

    async def chat_message_delete(self, event):
        await self.send(text_data=json.dumps({
            'type': 'chat.message.delete',
            'message_id': event['message_id'],
            'deleted_by': event['deleted_by'],
        }))

    async def user_online(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user.online',
            'user_id': event['user_id'],
            'full_name': event['full_name'],
        }))

    async def user_offline(self, event):
        await self.send(text_data=json.dumps({
            'type': 'user.offline',
            'user_id': event['user_id'],
        }))

    async def chat_translation_ready(self, event):
        """
        Receives translated message from ai/signals.py.
        Delivers to the correct user only.

        Step 1 — for_user_id missing → log error and return
        Step 2 — for_user_id != self.user.id → not for this connection, ignore
        Step 3 — for_user_id == self.user.id → send to this connection
        """
        for_user_id = event.get('for_user_id')
        if for_user_id is None:
            logger.error(
                f"chat_translation_ready received with missing for_user_id. "
                f"Full event: {event}"
            )
            return

        # Only deliver to the intended receiver
        # FIX: cast both to str to handle int vs UUID type mismatch
        if str(for_user_id) != str(self.user.id):
            return

        await self.send(text_data=json.dumps({
            'type': 'chat.translation.ready',
            'message_id': event['message_id'],
            'translated_content': event['translated_content'],
            'target_language': event['target_language'],
        }))

    # ─── DB helpers (sync_to_async) ──────────────────────────────────

    @database_sync_to_async
    def check_participant(self):
        from .models import ConversationParticipant
        return ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).exists()

    @database_sync_to_async
    def save_message(self, content, reply_to_id=None):
        from .models import Message
        try:
            msg = Message.objects.create(
                conversation_id=self.conversation_id,
                sender=self.user,
                content=content,
                message_type='text',
                reply_to_id=reply_to_id,
            )
            # FIX: safe avatar URL resolution — avoids AttributeError
            avatar_url = getattr(self.user, 'avatar_url_cached', '') or ''
            if getattr(self.user, 'avatar', None):
                try:
                    avatar_url = self.user.avatar.url
                except Exception:
                    pass

            return {
                'id': msg.id,
                'content': msg.content,
                'message_type': msg.message_type,
                'created_at': msg.created_at.isoformat(),
                'sender': {
                    'id': self.user.id,
                    'full_name': self.user.full_name,
                    'avatar_url': avatar_url,
                }
            }
        except Exception as e:
            logger.error(
                f"save_message failed for user={self.user.id} "
                f"conv={self.conversation_id}: {e}",
                exc_info=True
            )
            return None

    @database_sync_to_async
    def touch_conversation(self):
        from .models import Conversation
        Conversation.objects.filter(id=self.conversation_id).update(updated_at=timezone.now())

    @database_sync_to_async
    def mark_messages_read(self, message_ids):
        from .models import MessageRead
        # FIX: use message_id directly — avoids fetching full Message objects
        reads = [
            MessageRead(message_id=mid, user=self.user)
            for mid in message_ids
        ]
        MessageRead.objects.bulk_create(reads, ignore_conflicts=True)

    @database_sync_to_async
    def update_last_read(self):
        from .models import ConversationParticipant
        ConversationParticipant.objects.filter(
            conversation_id=self.conversation_id,
            user=self.user
        ).update(last_read_at=timezone.now())

    @database_sync_to_async
    def delete_message(self, message_id):
        from .models import Message
        try:
            msg = Message.objects.get(id=message_id, sender=self.user)
            msg.soft_delete()
            return True
        except Message.DoesNotExist:
            return False
        except Exception as e:
            # FIX: log unexpected errors instead of swallowing them silently
            logger.error(
                f"delete_message failed: msg={message_id} user={self.user.id}: {e}",
                exc_info=True
            )
            return False

    async def send_error(self, message):
        await self.send(text_data=json.dumps({
            'type': 'error',
            'message': message,
        }))