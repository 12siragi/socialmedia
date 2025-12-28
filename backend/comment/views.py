# comment/views.py
from rest_framework.viewsets import ModelViewSet
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Comment
from .serializers import CommentSerializer
from post.models import Post
from rest_framework import status

class CommentViewSet(ModelViewSet):
    http_method_names = ["get", "post", "put", "delete"]
    serializer_class = CommentSerializer
    lookup_field = "pk"

    def get_queryset(self):
        post_pk = self.kwargs.get("post_pk")
        return Comment.objects.filter(post_id=post_pk)

    def perform_create(self, serializer):
        post_pk = self.kwargs.get("post_pk")
        post = get_object_or_404(Post, pk=post_pk)
        serializer.save(author=self.request.user, post=post)

    # ✅ Custom like/unlike action
    @action(detail=True, methods=["post"])
    def like(self, request, post_pk=None, pk=None):
        """
        Toggle like/unlike for a comment.
        Returns:
        {
            "liked": True/False,
            "likes_count": int
        }
        """
        comment = self.get_object()
        user = request.user

        if user in comment.liked_by.all():
            # User already liked → unlike
            comment.liked_by.remove(user)
            comment.likes_count = comment.liked_by.count()
            comment.save()
            return Response({"liked": False, "likes_count": comment.likes_count})
        else:
            # Like
            comment.liked_by.add(user)
            comment.likes_count = comment.liked_by.count()
            comment.save()
            return Response({"liked": True, "likes_count": comment.likes_count})
