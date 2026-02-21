# likes/models.py
from django.db import models
from django.conf import settings


class Like(models.Model):
    """
    Records user likes on posts.
    
    OWNERSHIP:
    - Belongs to User (who liked)
    - Belongs to Post (what was liked)
    - CASCADE delete on both
    
    GROWTH ANALYSIS:
    - Grows FAST (most active table)
    - 1 user likes 10+ posts daily
    - 1M users = 10M+ likes/day
    - At scale: Billions of rows
    
    WHAT GROWS:
    - Like records (millions → billions)
    - Write operations (high frequency)
    - Database size (needs partitioning at scale)
    
    WHAT MUST BE FAST:
    - Toggle like (2 queries with signals)
    - Check if liked (0 queries with prefetch)
    - Count likes (0 queries with precomputed counter)
    
    PRECOMPUTED:
    - Post.likes_count (updated by signals)
    - Unique constraint enforced by DB
    
    INDEXES:
    - (user, post) → "Has user liked post?" O(log n)
    - (post, created_at) → "Recent likes for post" O(log n)
    - user → "All posts user liked" O(log n)
    - post → "All users who liked" O(log n)
    
    CRITICAL OPTIMIZATION:
    - unique_together prevents duplicate likes at DB level
    - Signals auto-update Post.likes_count
    - Indexes make all queries O(log n) instead of O(n)
    """

    # ─── Relationships ────────────────────────────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # Delete likes when user deleted
        related_name='likes',
        db_index=True,
        help_text="User who liked the post"
    )

    post = models.ForeignKey(
        'post.Post',
        on_delete=models.CASCADE,  # Delete likes when post deleted
        related_name='likes',
        db_index=True,
        help_text="Post that was liked"
    )

    # ─── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When the like was created"
    )

    # ─── Meta ─────────────────────────────────────────────────────────
    class Meta:
        # ✅ CRITICAL: Prevents duplicate likes at database level
        # User can only like a post once
        unique_together = ('user', 'post')
        
        # Default ordering: newest first
        ordering = ['-created_at']

        indexes = [
            # Check if user liked post: O(log n)
            models.Index(
                fields=['user', 'post'],
                name='idx_like_user_post'
            ),
            # Get recent likes for post: O(log n)
            models.Index(
                fields=['post', '-created_at'],
                name='idx_like_post_date'
            ),
            # Get all likes by user: O(log n)
            models.Index(
                fields=['user', '-created_at'],
                name='idx_like_user_date'
            ),
            # Analytics: likes over time
            models.Index(
                fields=['-created_at'],
                name='idx_like_date'
            ),
        ]

        verbose_name = "Like"
        verbose_name_plural = "Likes"

    # ─── String Representation ────────────────────────────────────────
    def __str__(self):
        return f"{self.user.full_name} ❤️ Post {self.post_id}"