from django.db import models
from django.conf import settings
from post.models import Post

class Comment(models.Model):
    content = models.TextField()
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ✅ Like system
    likes_count = models.PositiveIntegerField(default=0)
    liked_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name="liked_comments", blank=True)

    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"
