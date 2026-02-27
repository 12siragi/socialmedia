# posts/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Post
from .serializers import (
    PostListSerializer,
    PostDetailSerializer,
    CreatePostSerializer,
    UpdatePostSerializer
)


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Post CRUD operations.

    Endpoints:
    - GET    /api/posts/                    → list()      → Feed
    - POST   /api/posts/                    → create()    → Create post
    - GET    /api/posts/:id/               → retrieve()  → Single post
    - PUT    /api/posts/:id/               → update()    → Update post
    - DELETE /api/posts/:id/               → destroy()   → Delete post
    - GET    /api/posts/my/                → my_posts()  → Current user's posts
    - GET    /api/posts/user/:user_id/     → user_posts() → User's posts
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Optimized queryset for all actions.
        select_related + prefetch_related keeps query count to 4-5
        regardless of how many posts are returned.
        """
        return Post.objects.select_related(
            'author'
        ).prefetch_related(
            'media',
            'likes',
            'bookmarks',
            'comments__author'
        ).filter(
            is_active=True
        )

    def get_serializer_class(self):
        if self.action == 'create':
            return CreatePostSerializer
        elif self.action in ['update', 'partial_update']:
            return UpdatePostSerializer
        return PostListSerializer  # list, retrieve, my_posts, user_posts

    def _get_serializer_with_context(self, instance, many=False):
        """
        ✅ Helper: always use get_serializer() so DRF injects the full
        request context automatically. Avoids the bug where manually
        passing context={'request': request} could miss other context keys.
        """
        # Temporarily override action to 'list' so get_serializer_class
        # returns PostListSerializer (not CreatePostSerializer)
        original_action = self.action
        self.action = 'list'
        serializer = self.get_serializer(instance, many=many)
        self.action = original_action
        return serializer

    def list(self, request, *args, **kwargs):
        """GET /api/posts/ — Feed, newest first"""
        queryset = self.get_queryset().order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        """GET /api/posts/:id/ — Single post"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """POST /api/posts/ — Create post with optional media"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Reload with full prefetch so media/likes/bookmarks are available
        post = self.get_queryset().get(id=post.id)

        # ✅ FIXED: use get_serializer() via helper so request context
        # is injected automatically — no more missing URLs on new posts
        response_serializer = self._get_serializer_with_context(post)
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        """PUT /api/posts/:id/ — Update post content (author only)"""
        instance = self.get_object()

        if instance.author != request.user:
            return Response(
                {'detail': 'You do not have permission to modify this post.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        post = serializer.save()

        # Reload with full prefetch
        post = self.get_queryset().get(id=post.id)

        # ✅ FIXED: consistent context via helper
        response_serializer = self._get_serializer_with_context(post)
        return Response(response_serializer.data)

    def destroy(self, request, *args, **kwargs):
        """DELETE /api/posts/:id/ — Soft delete (author only)"""
        instance = self.get_object()

        if instance.author != request.user:
            return Response(
                {'detail': 'You do not have permission to delete this post.'},
                status=status.HTTP_403_FORBIDDEN
            )

        instance.soft_delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    # ═══════════════════════════════════════════════════════════════════
    # CUSTOM ACTIONS
    # ═══════════════════════════════════════════════════════════════════

    @action(detail=False, methods=['get'], url_path='my')
    def my_posts(self, request):
        """GET /api/posts/my/ — Current user's posts"""
        queryset = self.get_queryset().filter(
            author=request.user
        ).order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_posts(self, request, user_id=None):
        """GET /api/posts/user/:user_id/ — Specific user's posts"""
        queryset = self.get_queryset().filter(
            author_id=user_id
        ).order_by('-created_at')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='user/(?P<user_id>[^/.]+)')
    def user_posts(self, request, user_id=None):
        """
        GET /api/posts/user/:user_id/
        
        Get posts by specific user
        """
        queryset = self.get_queryset().filter(
            author_id=user_id
        ).order_by('-created_at')
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)