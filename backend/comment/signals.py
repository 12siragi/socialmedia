# comment/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from .models import Comment


@receiver(post_save, sender=Comment)
def increment_comments_count(sender, instance, created, **kwargs):
    """
    Auto-increment comments_count when comment is created.
    
    RULE: Only count top-level comments (not replies)
    - parent = NULL → increment counter
    - parent = ID → don't increment (it's a reply)
    
    WHY: Post shows "42 comments" (top-level only)
         Replies are nested under their parent
    
    OPTIMIZATION:
    - Uses F() expression for atomic update
    - No race conditions
    - Single UPDATE query
    """
    if created and not instance.parent_id:
        # Only increment for top-level comments
        from post.models import Post
        Post.objects.filter(pk=instance.post_id).update(
            comments_count=models.F('comments_count') + 1
        )


@receiver(post_delete, sender=Comment)
def decrement_comments_count(sender, instance, **kwargs):
    """
    Auto-decrement comments_count when comment is deleted.
    
    RULE: Only decrement for top-level comments
    - Replies don't affect counter
    
    NOTE: When parent deleted, CASCADE deletes replies
          But replies don't decrement counter (correct behavior)
    
    OPTIMIZATION:
    - Uses F() expression for atomic update
    - Safe even if post is being deleted
    """
    if not instance.parent_id:
        # Only decrement for top-level comments
        from post.models import Post
        Post.objects.filter(pk=instance.post_id).update(
            comments_count=models.F('comments_count') - 1
        )


# Optional: Signal for soft delete
@receiver(models.signals.pre_save, sender=Comment)
def handle_soft_delete_counter(sender, instance, **kwargs):
    """
    Update counter when comment is soft deleted (is_active changed).
    
    OPTIONAL: Only needed if you want counter to reflect soft deletes.
    
    If you want comments_count to only show active comments,
    uncomment this. Otherwise, counter shows total ever created.
    """
    # Uncomment if you want counter to reflect soft deletes
    # if instance.pk:  # Only for existing comments
    #     try:
    #         old = Comment.objects.get(pk=instance.pk)
    #         if old.is_active and not instance.is_active and not instance.parent_id:
    #             # Top-level comment being soft deleted
    #             from posts.models import Post
    #             Post.objects.filter(pk=instance.post_id).update(
    #                 comments_count=models.F('comments_count') - 1
    #             )
    #         elif not old.is_active and instance.is_active and not instance.parent_id:
    #             # Top-level comment being restored
    #             from posts.models import Post
    #             Post.objects.filter(pk=instance.post_id).update(
    #                 comments_count=models.F('comments_count') + 1
    #             )
    #     except Comment.DoesNotExist:
    #         pass
    pass