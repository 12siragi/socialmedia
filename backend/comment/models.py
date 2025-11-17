from django.db import models
from django.conf import settings

class Comment(models.Model):
    content = models.TextField()
    post = models.ForeignKey("post.Post", on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comments")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    def __str__(self):
        return f"{self.author.username}: {self.content[:30]}"
