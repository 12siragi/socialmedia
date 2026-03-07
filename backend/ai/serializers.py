# ai/serializers.py
from rest_framework import serializers
from .models import Translation, TranslationPreference, SUPPORTED_LANGUAGES


class TranslationSerializer(serializers.ModelSerializer):
    is_complete = serializers.BooleanField(read_only=True)

    class Meta:
        model = Translation
        fields = [
            'id', 'message_id', 'source_language', 'target_language',
            'translated_content', 'is_complete', 'is_failed', 'created_at',
        ]
        read_only_fields = fields


class TranslationPreferenceSerializer(serializers.ModelSerializer):
    """
    WRITE: is_enabled + target_language are writable.
    READ:  returns full state so frontend knows toggle + chosen language.
    """
    class Meta:
        model = TranslationPreference
        fields = ['id', 'conversation', 'is_enabled', 'target_language']
        read_only_fields = ['id', 'conversation']

    def validate_target_language(self, value):
        if value is None:
            return value
        supported = [code for code, _ in SUPPORTED_LANGUAGES]
        if value.strip().lower() not in supported:
            raise serializers.ValidationError(
                f"Unsupported language. Choose from: {supported}"
            )
        return value.strip().lower()

    def validate(self, data):
        is_enabled = data.get('is_enabled', getattr(self.instance, 'is_enabled', False))
        target_language = data.get(
            'target_language',
            getattr(self.instance, 'target_language', None)
        )
        if is_enabled and not target_language:
            raise serializers.ValidationError(
                "target_language is required when enabling translation."
            )
        return data