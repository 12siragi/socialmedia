# ai/models.py
from django.db import models
from django.conf import settings

# =============================================================================
# TRUTH LAYER 1: Translation model state
#
# Translation exists?        True/False
# Translation is complete?   True if translated_content is not empty
# Translation failed?        True if is_failed = True
#
# OWNERSHIP:
#   Message owns content (original)
#   Translation owns translated_content (belongs to Message + language)
#
# INVARIANT:
#   One Translation per (message, target_language) → unique_together
#   Original message is NEVER modified
# =============================================================================

class Translation(models.Model):
    """
    Stores translated versions of chat messages.

    One message can have many translations (one per language).
    Original message content is always preserved in chat.Message.
    """

    # Link to chat.Message without importing chat app directly
    # Uses string reference to avoid circular imports
    message_id = models.IntegerField(
        db_index=True,
        help_text="ID of the chat.Message this translation belongs to"
    )

    # Who requested this translation
    requested_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='requested_translations',
    )

    # Language fields
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

    # Content
    original_content = models.TextField(
        help_text="Original message content (copy for reference)"
    )
    translated_content = models.TextField(
        blank=True,
        null=True,
        help_text="Translated message content"
    )

    # State truths
    is_failed = models.BooleanField(
        default=False,
        help_text="True if translation failed — frontend falls back to original"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # INVARIANT: one translation per message per language
        unique_together = ('message_id', 'target_language')
        indexes = [
            models.Index(fields=['message_id', 'target_language'], name='idx_translation_msg_lang'),
            models.Index(fields=['message_id'],                     name='idx_translation_msg'),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"Translation(msg={self.message_id}, {self.source_language}→{self.target_language})"

    @property
    def is_complete(self):
        """True if translation exists and succeeded."""
        return bool(self.translated_content) and not self.is_failed

    @property
    def display_content(self):
        """
        TRUTH GATE:
        is_complete = True  → return translated_content
        is_complete = False → return original_content (fallback)
        INVARIANT: never returns None
        """
        if self.is_complete:
            return self.translated_content
        return self.original_content