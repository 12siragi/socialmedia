# chat/models.py
from django.db import models
from django.conf import settings
from cloudinary_storage.storage import MediaCloudinaryStorage


def message_media_path(instance, filename):
    return f"messages/user_{instance.sender_id}/{filename}"


class Conversation(models.Model):
    """
    Supports both DM (2 participants) and group chats (3+).
    """
    name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Group name (null for DMs)"
    )
    is_group = models.BooleanField(default=False)
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations',
        through='ConversationParticipant',
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_conversations',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # Updated on new message

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['-updated_at'], name='idx_conv_updated'),
            models.Index(fields=['is_group'],    name='idx_conv_is_group'),
        ]

    def __str__(self):
        if self.is_group:
            return f"Group: {self.name}"
        return f"DM: {self.id}"

    @classmethod
    def get_or_create_dm(cls, user1, user2):
        """Get existing DM or create new one between two users."""
        # Find existing DM between these two users
        conv = cls.objects.filter(
            is_group=False,
            participants=user1
        ).filter(
            participants=user2
        ).first()

        if conv:
            return conv, False

        # Create new DM
        conv = cls.objects.create(is_group=False, created_by=user1)
        ConversationParticipant.objects.create(conversation=conv, user=user1)
        ConversationParticipant.objects.create(conversation=conv, user=user2)
        return conv, True


class ConversationParticipant(models.Model):
    """Through model for Conversation <-> User with extra fields."""
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships'
    )
    # Track last seen for unread count
    last_read_at = models.DateTimeField(null=True, blank=True)
    joined_at = models.DateTimeField(auto_now_add=True)
    is_admin = models.BooleanField(default=False)  # For group chats

    class Meta:
        unique_together = ('conversation', 'user')
        indexes = [
            models.Index(fields=['conversation', 'user'], name='idx_participant_conv_user'),
        ]

    def __str__(self):
        return f"{self.user.email} in conversation {self.conversation_id}"


class Message(models.Model):
    """A single message in a conversation."""

    MESSAGE_TYPE_CHOICES = [
        ('text',  'Text'),
        ('image', 'Image'),
        ('video', 'Video'),
        ('file',  'File'),
    ]

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages',
        db_index=True,
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        db_index=True,
    )
    content = models.TextField(blank=True, null=True)
    message_type = models.CharField(
        max_length=10,
        choices=MESSAGE_TYPE_CHOICES,
        default='text',
        db_index=True,
    )

    # Media attachment (optional)
    media = models.FileField(
        upload_to=message_media_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),
    )

    # Reply threading
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies',
    )

    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at'], name='idx_msg_conv_time'),
            models.Index(fields=['conversation', 'is_deleted'], name='idx_msg_conv_deleted'),
            models.Index(fields=['sender', 'created_at'],       name='idx_msg_sender_time'),
        ]

    def __str__(self):
        return f"Message {self.id} from {self.sender.email}"

    def soft_delete(self):
        from django.utils import timezone
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.content = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'content'])


class MessageRead(models.Model):
    """Tracks read receipts per user per message."""
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='read_by',
        db_index=True,
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='read_messages',
        db_index=True,
    )
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message', 'user')
        indexes = [
            models.Index(fields=['message', 'user'], name='idx_read_msg_user'),
        ]

    def __str__(self):
        return f"{self.user.email} read message {self.message_id}"