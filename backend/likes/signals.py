# likes/signals.py
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from .models import Like


@receiver(post_save, sender=Like)
def increment_likes_count(sender, instance, created, **kwargs):
    """
    Auto-increment likes_count when like is created.
    
    OPTIMIZATION:
    - Uses F() expression for atomic update
    - No race conditions
    - Single UPDATE query
    - No need to load post into memory
    
    PERFORMANCE:
    - Before: post.likes_count = post.likes.count(); post.save()
              2 queries (SELECT COUNT + UPDATE)
    - After: F('likes_count') + 1
             1 query (atomic UPDATE)
    
    WHY SIGNALS:
    - Automatic (can't forget to update counter)
    - Atomic (no race conditions)
    - Centralized (one place to maintain)
    """
    if created:
        from post.models import Post
        Post.objects.filter(pk=instance.post_id).update(
            likes_count=models.F('likes_count') + 1
        )


@receiver(post_delete, sender=Like)
def decrement_likes_count(sender, instance, **kwargs):
    """
    Auto-decrement likes_count when like is deleted (unliked).
    
    OPTIMIZATION:
    - Uses F() expression for atomic update
    - Handles race conditions properly
    - Single UPDATE query
    
    EDGE CASE:
    - If post is being deleted, likes cascade delete
    - This signal still fires but update is safe (post gone)
    - F() expression won't error on non-existent post
    """
    from post.models import Post
    Post.objects.filter(pk=instance.post_id).update(
        likes_count=models.F('likes_count') - 1
    )