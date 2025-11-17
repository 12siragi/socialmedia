from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework import status
from .models import Comment
from .serializers import CommentSerializer
from django.shortcuts import get_object_or_404
from post.models import Post

class CommentViewSet(ModelViewSet):
    http_method_names = ["get", "post", "put", "delete"]
    serializer_class = CommentSerializer

    def get_queryset(self):
        post_pk = self.kwargs.get("post_pk")
        return Comment.objects.filter(post_id=post_pk)

    def perform_create(self, serializer):
        post_pk = self.kwargs.get("post_pk")
        post = get_object_or_404(Post, pk=post_pk)
        serializer.save(author=self.request.user, post=post)
