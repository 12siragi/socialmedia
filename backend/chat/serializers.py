# chat/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, ConversationParticipant, Message, MessageRead

User = get_user_model()


class ParticipantUserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'full_name', 'first_name', 'last_name',
            'avatar_url', 'preferred_language',
        ]

    def get_avatar_url(self, obj):
        if getattr(obj, 'avatar', None):
            try:
                return obj.avatar.url  # Cloudinary full URL
            except Exception:
                pass
        return getattr(obj, 'avatar_url_cached', '') or ''


class MessageReadSerializer(serializers.ModelSerializer):
    user = ParticipantUserSerializer(read_only=True)

    class Meta:
        model = MessageRead
        fields = ['user', 'read_at']


class MessageSerializer(serializers.ModelSerializer):
    sender              = ParticipantUserSerializer(read_only=True)
    read_by             = MessageReadSerializer(many=True, read_only=True)
    media_url           = serializers.SerializerMethodField()
    reply_to_preview    = serializers.SerializerMethodField()
    translation         = serializers.SerializerMethodField()  # ← from ai app

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content',
            'translation',           # embedded translation for requesting user
            'message_type', 'media_url', 'reply_to',
            'reply_to_preview', 'is_deleted', 'read_by',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'sender', 'created_at', 'updated_at', 'is_deleted']

    def get_media_url(self, obj):
        if getattr(obj, 'media', None):
            try:
                return obj.media.url  # Cloudinary full URL
            except Exception:
                pass
        return None

    def get_reply_to_preview(self, obj):
        if not obj.reply_to:
            return None
        return {
            'id': obj.reply_to.id,
            'sender': obj.reply_to.sender.full_name,
            'content': (
                obj.reply_to.content
                if not obj.reply_to.is_deleted
                else 'Deleted message'
            ),
        }

    def get_translation(self, obj):
        """
        Returns the Translation record for the requesting user's language.

        GATES:
          - no request in context       → return None
          - user has no preferred_language or it's 'en' → return None
          - no Translation record exists yet → return None
            (WebSocket will push chat.translation.ready when ready)
          - translation failed          → return None (frontend uses original)
          - translation complete        → return serialized Translation
        """
        request = self.context.get('request')
        if not request:
            return None

        lang = getattr(request.user, 'preferred_language', None)
        if not lang or lang.strip().lower() == 'en':
            return None

        # Import here to avoid circular imports between chat ↔ ai
        from ai.models import Translation
        from ai.serializers import TranslationSerializer

        translation = Translation.objects.filter(
            message_id=obj.id,
            target_language=lang.strip().lower(),
        ).first()

        if not translation or not translation.is_complete:
            return None

        return TranslationSerializer(translation).data


class SendMessageSerializer(serializers.ModelSerializer):
    media = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = Message
        fields = ['content', 'message_type', 'media', 'reply_to']

    def validate(self, data):
        content = data.get('content', '').strip() if data.get('content') else ''
        media = data.get('media')
        if not content and not media:
            raise serializers.ValidationError("Message must have content or media.")
        return data


class ConversationSerializer(serializers.ModelSerializer):
    participants        = ParticipantUserSerializer(many=True, read_only=True)
    last_message        = serializers.SerializerMethodField()
    unread_count        = serializers.SerializerMethodField()
    translation_enabled = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'name', 'is_group', 'participants',
            'last_message', 'unread_count',
            'translation_enabled',
            'created_at', 'updated_at',
        ]

    def get_last_message(self, obj):
        last = (
            obj.messages
            .filter(is_deleted=False)
            .select_related('sender')   # avoid N+1 on sender
            .order_by('-created_at')
            .first()
        )
        if not last:
            return None
        return {
            'id': last.id,
            'sender': last.sender.full_name,
            'content': last.content,
            'message_type': last.message_type,
            'created_at': last.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        user = request.user
        membership = obj.memberships.filter(user=user).first()
        if not membership or not membership.last_read_at:
            return obj.messages.filter(is_deleted=False).exclude(sender=user).count()
        return obj.messages.filter(
            is_deleted=False,
            created_at__gt=membership.last_read_at,
        ).exclude(sender=user).count()

    def get_translation_enabled(self, obj):
        """
        Returns whether translation is ON for the requesting user
        in this conversation. Defaults to True (translation ON).
        """
        request = self.context.get('request')
        if not request:
            return True
        from ai.models import TranslationPreference
        pref = TranslationPreference.objects.filter(
            user=request.user,
            conversation=obj,
        ).first()
        return pref.is_enabled if pref else True  # default ON


class CreateConversationSerializer(serializers.Serializer):
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
    )
    name     = serializers.CharField(required=False, allow_blank=True)
    is_group = serializers.BooleanField(default=False)

    def validate_participant_ids(self, value):
        existing = set(
            User.objects.filter(id__in=value).values_list('id', flat=True)
        )
        missing = set(value) - existing
        if missing:
            raise serializers.ValidationError(f"Users not found: {missing}")
        return value

    def validate(self, data):
        is_group        = data.get('is_group', False)
        participant_ids = data.get('participant_ids', [])

        if is_group and not data.get('name', '').strip():
            raise serializers.ValidationError("Group conversations require a name.")

        if not is_group and len(participant_ids) != 1:
            raise serializers.ValidationError("DMs require exactly 1 other participant.")

        return data