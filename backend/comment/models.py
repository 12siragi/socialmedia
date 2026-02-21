# comment/models.py
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError


class Comment(models.Model):
    """
    User comments on posts with support for nested replies.
    
    OWNERSHIP:
    - Belongs to User (author)
    - Belongs to Post
    - Can have parent Comment (for replies)
    
    GROWTH ANALYSIS:
    - Grows fast (4-5 comments per post avg)
    - Replies multiply growth (2x total comments)
    - 1M posts = 4M top-level + 8M replies = 12M total
    
    WHAT GROWS:
    - Comment records (millions → tens of millions)
    - Nested replies (tree structure)
    - Text content (storage)
    
    WHAT MUST BE FAST:
    - Create comment (2 queries with signal)
    - Count comments (0 queries - precomputed)
    - Load comments + authors (1 query with prefetch)
    - Load replies (1 query with prefetch)
    
    PRECOMPUTED:
    - Post.comments_count (updated by signals)
    - is_active (soft delete, preserves threads)
    
    INDEXES:
    - (post, parent, created_at) → Get top-level comments
    - (parent, is_active) → Get replies for comment
    - (author, created_at) → Get user's comments
    - (post, is_active, created_at) → Active comments for post
    
    TREE STRUCTURE:
    - parent = NULL → Top-level comment
    - parent = ID → Reply to that comment
    - Max depth: 5 levels (prevent infinite nesting)
    """

    # ─── Relationships ────────────────────────────────────────────────
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,  # Delete comments when user deleted
        related_name='comments',
        db_index=True,
        help_text="User who wrote the comment"
    )

    post = models.ForeignKey(
        'post.Post',
        on_delete=models.CASCADE,  # Delete comments when post deleted
        related_name='comments',
        db_index=True,
        help_text="Post being commented on"
    )

    # ─── Tree Structure ───────────────────────────────────────────────
    # Self-referential FK for nested replies
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,  # Delete replies when parent deleted
        null=True,
        blank=True,
        related_name='replies',
        db_index=True,
        help_text="Parent comment (NULL for top-level comments)"
    )

    # ─── Content ──────────────────────────────────────────────────────
    content = models.TextField(
        help_text="Comment text content"
    )

    # ─── Metadata ─────────────────────────────────────────────────────
    # Depth in tree (0=top-level, 1=reply, 2=reply to reply)
    depth = models.PositiveIntegerField(
        default=0,
        help_text="Nesting depth (0=top-level, 1=reply, etc.)"
    )

    # ─── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="When comment was created"
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When comment was last edited"
    )

    # ─── Soft Delete ──────────────────────────────────────────────────
    # WHY soft delete:
    # - Preserves conversation threads
    # - Shows "[deleted]" instead of breaking flow
    # - Replies still make sense
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        help_text="False = soft deleted, shows '[deleted]' in UI"
    )

    # ─── Meta ─────────────────────────────────────────────────────────
    class Meta:
        ordering = ['created_at']  # Chronological order

        indexes = [
            # Get top-level comments for post
            models.Index(
                fields=['post', 'created_at'],
                name='idx_comment_post_date'
            ),
            # Get replies for comment
            models.Index(
                fields=['parent', 'is_active', 'created_at'],
                name='idx_comment_replies'
            ),
            # Get user's comments
            models.Index(
                fields=['author', '-created_at'],
                name='idx_comment_author_date'
            ),
            # Get active comments for post
            models.Index(
                fields=['post', 'is_active', 'created_at'],
                name='idx_comment_post_active'
            ),
            # Composite: post's top-level active comments
            models.Index(
                fields=['post', 'parent', 'is_active', 'created_at'],
                name='idx_comment_post_toplevel'
            ),
        ]

        verbose_name = "Comment"
        verbose_name_plural = "Comments"

    # ─── String Representation ────────────────────────────────────────
    def __str__(self):
        preview = self.content[:50] if self.content else ""
        if self.is_reply:
            return f"Reply by {self.author.full_name}: {preview}"
        return f"Comment by {self.author.full_name}: {preview}"

    # ─── Validation ───────────────────────────────────────────────────
    def clean(self):
        """
        Validate comment before saving.
        
        VALIDATIONS:
        - Content not empty
        - Reply depth not too deep (max 5 levels)
        - Parent comment belongs to same post
        """
        # Content validation
        if not self.content or not self.content.strip():
            raise ValidationError("Comment content cannot be empty.")

        # Depth validation (prevent infinite nesting)
        if self.parent:
            if self.parent.depth >= 5:
                raise ValidationError(
                    "Maximum reply depth (5 levels) exceeded. "
                    "Please reply to a higher-level comment."
                )

            # Parent must be on same post
            if self.parent.post_id != self.post_id:
                raise ValidationError(
                    "Parent comment must be on the same post."
                )

    def save(self, *args, **kwargs):
        """
        Auto-calculate depth before saving.
        
        OPTIMIZATION:
        - Precomputes depth (avoids recursive queries)
        - Makes rendering easier (know depth without traversal)
        """
        # Calculate depth from parent
        if self.parent:
            self.depth = self.parent.depth + 1
        else:
            self.depth = 0

        # Run validation
        self.full_clean()

        super().save(*args, **kwargs)

    # ─── Properties ───────────────────────────────────────────────────
    @property
    def is_reply(self):
        """Check if this is a reply to another comment."""
        return self.parent_id is not None

    @property
    def is_edited(self):
        """Check if comment was edited after creation."""
        # Allow 1 minute grace period for typo fixes
        from datetime import timedelta
        grace_period = timedelta(minutes=1)
        return (self.updated_at - self.created_at) > grace_period

    @property
    def replies_count(self):
        """
        Count active replies.
        
        NOTE: This does a COUNT query. Use prefetch for efficiency.
        """
        return self.replies.filter(is_active=True).count()

    # ─── Methods ──────────────────────────────────────────────────────
    def soft_delete(self):
        """
        Soft delete comment.
        
        PRESERVES:
        - Comment structure (replies still visible)
        - Thread continuity
        
        UI SHOWS:
        - "[deleted]" instead of content
        - Still shows reply count
        """
        self.is_active = False
        self.save(update_fields=['is_active'])

    def get_all_replies(self):
        """
        Get all replies recursively (entire subtree).
        
        WARNING: Can be expensive for deep threads.
        Use with caution or implement pagination.
        """
        replies = []
        for reply in self.replies.filter(is_active=True):
            replies.append(reply)
            replies.extend(reply.get_all_replies())
        return replies