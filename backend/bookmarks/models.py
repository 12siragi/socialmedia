# bookmarks/models.py
from django.db import models
from django.conf import settings


class Bookmark(models.Model):
    """
    User's saved posts for later reading.
    
    OWNERSHIP:
    - Belongs to User (who saved)
    - Belongs to Post (what was saved)
    - CASCADE delete on both
    
    GROWTH ANALYSIS:
    - Grows slower than Likes
    - 1 user saves 10-50 posts avg
    - 1M users = 20M bookmarks
    
    WHAT GROWS:
    - Bookmark records (millions)
    - User's collections (50-100 per user)
    
    WHAT MUST BE FAST:
    - Toggle bookmark (1 query)
    - Check if bookmarked (0 queries with prefetch)
    - My bookmarks list (1 query with JOIN)
    
    PRECOMPUTED:
    - Nothing needed (no counters)
    
    INDEXES:
    - (user, post) → "Has user bookmarked?" O(log n)
    - (user, created_at) → "Recent bookmarks" O(log n)
    - post → "Who bookmarked this" O(log n)
    
    NO SIGNALS NEEDED:
    - Bookmarks are private (no public counter)
    - Unlike likes, we don't show "42 saves"
    """

    # ─── Relationships ────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # Delete bookmarks when user deleted
        related_name='bookmarks',
        db_index=True,
        help_text="User who bookmarked the post"
    )

    post = models.ForeignKey(
        'post.Post',
        on_delete=models.CASCADE,  # Delete bookmarks when post deleted
        related_name='bookmarks',
        db_index=True,
        help_text="Post that was bookmarked"
    )

    # ─── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the bookmark was created"
    )

    # ─── Meta ─────────────────────────────────────────────────────────
    class Meta:
        # ✅ CRITICAL: Prevents duplicate bookmarks at database level
        # User can only bookmark a post once
        unique_together = ('user', 'post')
        
        # Default ordering: most recent first
        ordering = ['-created_at']

        indexes = [
            # Check if user bookmarked post: O(log n)
            models.Index(
                fields=['user', 'post'],
                name='idx_bookmark_user_post'
            ),
            # Get user's recent bookmarks: O(log n)
            models.Index(
                fields=['user', '-created_at'],
                name='idx_bookmark_user_date'
            ),
            # Get all bookmarks for post (analytics): O(log n)
            models.Index(
                fields=['post', '-created_at'],
                name='idx_bookmark_post_date'
            ),
        ]

        verbose_name = "Bookmark"
        verbose_name_plural = "Bookmarks"

    # ─── String Representation ────────────────────────────────────────
    def __str__(self):
        return f"{self.user.full_name} 🔖 Post {self.post_id}"