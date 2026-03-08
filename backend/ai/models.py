# ai/models.py
from django.db import models
from django.conf import settings

SUPPORTED_LANGUAGES = [
    ('en', 'English'),
    ('ar', 'Arabic'),
    ('fr', 'French'),
    ('es', 'Spanish'),
    ('de', 'German'),
    ('tr', 'Turkish'),
    ('ur', 'Urdu'),
    ('zh', 'Chinese'),
    ('hi', 'Hindi'),
    ('ru', 'Russian'),
]


class TranslationPreference(models.Model):
    """
    Stores per-user, per-conversation translation toggle.
    is_enabled=True  + target_language='ar' -> translate all messages to Arabic
    is_enabled=False -> no translation for this user in this conversation
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='translation_preferences'
    )
    conversation = models.ForeignKey(
        'chat.Conversation',
        on_delete=models.CASCADE,
        related_name='translation_preferences'
    )
    is_enabled = models.BooleanField(default=False)
    target_language = models.CharField(
        max_length=10,
        null=True,
        blank=True,
        help_text="Language the user wants messages translated TO e.g. 'ar', 'fr'"
    )

    class Meta:
        unique_together = ('user', 'conversation')
        indexes = [
            models.Index(fields=['user', 'conversation'], name='idx_user_conv_pref'),
        ]

    def __str__(self):
        return (
            f"TranslationPreference("
            f"user={self.user.email}, "
            f"conv={self.conversation_id}, "
            f"enabled={self.is_enabled}, "
            f"target={self.target_language})"
        )


class Translation(models.Model):
    """
    Stores translated versions of chat messages.
    One message can have many translations (one per language).
    Original message content is always preserved in chat.Message.
    """
    message_id = models.IntegerField(
        db_index=True,
        help_text="ID of the chat.Message this translation belongs to"
    )
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requested_translations',
    )
    source_language = models.CharField(
        max_length=10,
        default='en',
        help_text="Language of the original message e.g. en, ar"
    )
    target_language = models.CharField(
        max_length=10,
        db_index=True,
        help_text="Language this was translated to e.g. ar, en"
    )
    original_content = models.TextField(
        help_text="Original message content (copy for reference)"
    )
    translated_content = models.TextField(
        blank=True,
        null=True,
        help_text="Translated message content"
    )
    is_failed = models.BooleanField(
        default=False,
        help_text="True if translation failed - frontend falls back to original"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('message_id', 'target_language')
        indexes = [
            models.Index(fields=['message_id', 'target_language'], name='idx_translation_msg_lang'),
            models.Index(fields=['message_id'],                     name='idx_translation_msg'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Translation(msg={self.message_id}, {self.source_language}->{self.target_language})"

    @property
    def is_complete(self):
        return bool(self.translated_content) and not self.is_failed

    @property
    def display_content(self):
        if self.is_complete:
            return self.translated_content
        return self.original_content


class MessageAudio(models.Model):
    """
    Stores on-demand TTS audio for a message.

    Truth checks:
      audio_generated=True  → audio_url is valid, receiver can play
      audio_failed=True     → Coqui failed, show error in UI
      spoke_translation=True → audio was generated from translated_content

    Created only when receiver clicks play — not auto-generated.
    One record per message (shared if multiple receivers request same message).
    """
    message = models.OneToOneField(
        'chat.Message',
        on_delete=models.CASCADE,
        related_name='audio',
    )
    audio_url          = models.URLField(blank=True, null=True)
    audio_generated    = models.BooleanField(default=False)
    audio_failed       = models.BooleanField(default=False)
    spoke_translation  = models.BooleanField(
        default=False,
        help_text="True if audio was generated from translated content"
    )
    created_at         = models.DateTimeField(auto_now_add=True)
    updated_at         = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['message'], name='idx_audio_message'),
        ]

    def __str__(self):
        return (
            f"MessageAudio(msg={self.message_id}, "
            f"generated={self.audio_generated})"
        )

    @property
    def can_play(self):
        return self.audio_generated and bool(self.audio_url)