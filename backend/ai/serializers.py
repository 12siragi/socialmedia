# ai/serializers.py
from rest_framework import serializers
from .models import Translation, TranslationPreference


class TranslationSerializer(serializers.ModelSerializer):
    """
    Read-only serializer for a translated message.
    Used by chat.MessageSerializer to embed translation for the requesting user.
    """
    is_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = Translation
        fields = [
            'id',
            'message_id',
            'source_language',
            'target_language',
            'translated_content',
            'is_complete',
            'is_failed',
            'created_at',
        ]
        read_only_fields = fields


class TranslationPreferenceSerializer(serializers.ModelSerializer):
    """
    Read/write serializer for toggling translation on/off
    per user per conversation.

    WRITE: only is_enabled is writable — user + conversation
           are set from request context in the view, never from client input.
    READ:  returns full state so frontend knows current toggle.
    """
    class Meta:
        model = TranslationPreference
        fields = [
            'id',
            'conversation',
            'is_enabled',
        ]
        read_only_fields = ['id', 'conversation']

    def validate_is_enabled(self, value):
        if not isinstance(value, bool):
            raise serializers.ValidationError("is_enabled must be a boolean.")
        return value