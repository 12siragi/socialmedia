from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Post
from .serializers import PostSerializer
from .permissions import IsAuthorOrReadOnly

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all().order_by("-created_at")
    serializer_class = PostSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]

    # 🔑 Automatically assign logged-in user as author
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    # 🔹 Custom action to like/unlike a post
    @action(detail=True, methods=["post"])
    def like(self, request, pk=None):
        post = self.get_object()
        user = request.user
        if user in post.likes.all():
            post.likes.remove(user)
            return Response({"status": "unliked"}, status=status.HTTP_200_OK)
        else:
            post.likes.add(user)
            return Response({"status": "liked"}, status=status.HTTP_200_OK)
