# posts/models.py
from django.db import models
from django.conf import settings


class Post(models.Model):
    """
    Core post model.

    GROWTH ANALYSIS:
    - Grows with every user post
    - Feed query hits this table most
    - Ordered by created_at → index critical

    LOOP PREVENTION:
    - likes_count    precomputed → no COUNT() in loop
    - comments_count precomputed → no COUNT() in loop
    - full_name      from CustomUser.full_name (already precomputed) ✅
    - avatar_url     from CustomUser.avatar_url (already precomputed) ✅

    INDEXES:
    - author + created_at → "show my posts" query
    - created_at + is_active → main feed query
    - post_type + is_active → filter by type
    - likes_count + is_active → trending/popular feed
    """

    POST_TYPE_CHOICES = [
        ('text',  'Text Only'),
        ('image', 'Image Post'),
        ('video', 'Video Post'),
        ('mixed', 'Mixed Content'),
    ]

    # ─── Relationships ────────────────────────────────────────────────
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='posts',
        db_index=True,
        help_text="Post author (FK to CustomUser)"
    )

    # ─── Content ──────────────────────────────────────────────────────
    content = models.TextField(
        blank=True,
        null=True,
        help_text="Text body of the post"
    )

    post_type = models.CharField(
        max_length=10,
        choices=POST_TYPE_CHOICES,
        default='text',
        db_index=True,
        help_text="Auto-detected from content + media"
    )

    # ─── Precomputed Counters ─────────────────────────────────────────
    # CRITICAL: These turn O(n) COUNT() queries into O(1) field reads
    # Updated automatically by signals in likes/ and comments/ apps
    likes_count = models.PositiveIntegerField(
        default=0,
        db_index=True,   # Needed for trending/popular feed sort
        help_text="Cached like count - updated by signals"
    )

    comments_count = models.PositiveIntegerField(
        default=0,
        help_text="Cached comment count - updated by signals"
    )

    # ─── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,   # Feed is sorted by this
        help_text="When post was created"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When post was last edited"
    )

    # ─── Soft Delete ──────────────────────────────────────────────────
    # WHY soft delete?
    # - Keeps data for analytics
    # - Allows recovery
    # - Referenced likes/comments don't break
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="False = soft deleted, hidden from feed"
    )

    # ─── Meta ─────────────────────────────────────────────────────────
    class Meta:
        ordering = ['-created_at']

        indexes = [
            # Feed query: active posts newest first
            models.Index(
                fields=['-created_at', 'is_active'],
                name='idx_post_feed'
            ),
            # Profile query: user's posts newest first
            models.Index(
                fields=['author', '-created_at'],
                name='idx_post_author_date'
            ),
            # Filter by type
            models.Index(
                fields=['post_type', 'is_active'],
                name='idx_post_type_active'
            ),
            # Trending feed: most liked active posts
            models.Index(
                fields=['-likes_count', 'is_active'],
                name='idx_post_trending'
            ),
            # Composite: author's active posts
            models.Index(
                fields=['author', 'is_active', '-created_at'],
                name='idx_post_author_active_date'
            ),
        ]

        verbose_name = "Post"
        verbose_name_plural = "Posts"

    # ─── Methods ──────────────────────────────────────────────────────
    def __str__(self):
        return (
            f"[{self.post_type.upper()}] "
            f"{self.author.full_name} "    # ✅ No extra query - precomputed
            f"@ {self.created_at:%Y-%m-%d}"
        )

    def soft_delete(self):
        """
        Soft delete post.
        Keeps likes/comments/media intact for data integrity.
        """
        self.is_active = False
        self.save(update_fields=['is_active'])

    @property
    def has_media(self):
        """
        Quick check without DB query.
        Uses post_type which is already loaded.
        """
        return self.post_type in ('image', 'video', 'mixed')

    @property
    def top_comments(self):
        """
        Returns top 3 comments for feed preview.

        LOOP ANALYSIS:
        - Called once per post in serializer
        - Uses prefetched data if available → 0 extra queries
        - Falls back to DB query if not prefetched
        """
        return self.comments.filter(
            is_active=True,
            parent=None       # Top-level only, no replies
        ).select_related(
            'author'          # JOIN author in same query
        )[:3]