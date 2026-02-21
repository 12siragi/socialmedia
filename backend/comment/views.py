# comment/views.py
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from post.models import Post
from .models import Comment
from .serializers import (
    CommentSerializer,
    CreateCommentSerializer,
    UpdateCommentSerializer
)


class CommentViewSet(viewsets.ViewSet):
    """
    ViewSet for comment operations.
    
    Endpoints:
    - GET    /api/comment/posts/:post_id/comments/     → List comments
    - POST   /api/comment/posts/:post_id/comments/     → Create comment
    - GET    /api/comment/comments/:id/                → Get comment
    - PUT    /api/comment/comments/:id/                → Update comment
    - DELETE /api/comment/comments/:id/                → Delete comment
    - GET    /api/comment/comments/:id/replies/        → Get all replies
    - GET    /api/comment/my/                          → My comments
    """
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get', 'post'], url_path='post/(?P<post_id>[^/.]+)/comments')
    def post_comments(self, request, post_id=None):
        """
        GET  /api/comment/posts/:post_id/comments/
        POST /api/comment/posts/:post_id/comments/
        
        List or create comments for a post.
        
        OPTIMIZATION:
        - GET: prefetch authors (1 query)
        - POST: signal updates counter (2 queries total)
        """
        post = get_object_or_404(Post, id=post_id, is_active=True)

        # ─── GET: List comments ───────────────────────────────────────
        if request.method == 'GET':
            # Get top-level comments only (no replies)
            comments = Comment.objects.filter(
                post=post,
                parent=None,
                is_active=True
            ).select_related(
                'author'
            ).prefetch_related(
                'replies__author'  # Prefetch first-level replies
            ).order_by('created_at')

            serializer = CommentSerializer(
                comments,
                many=True,
                context={'request': request}
            )

            return Response({
                'count': comments.count(),
                'comments': serializer.data
            })

        # ─── POST: Create comment ─────────────────────────────────────
        if request.method == 'POST':
            serializer = CreateCommentSerializer(
                data=request.data,
                context={'request': request, 'post': post}
            )

            if serializer.is_valid():
                comment = serializer.save()

                # Return full comment details
                detail_serializer = CommentSerializer(
                    comment,
                    context={'request': request}
                )

                return Response(
                    detail_serializer.data,
                    status=status.HTTP_201_CREATED
                )

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['get'], url_path='comments/(?P<comment_id>[^/.]+)')
    def comment_detail(self, request, comment_id=None):
        """
        GET /api/comment/comments/:id/
        
        Get single comment with all its replies.
        """
        comment = get_object_or_404(
            Comment.objects.select_related('author').prefetch_related('replies__author'),
            id=comment_id,
            is_active=True
        )

        serializer = CommentSerializer(
            comment,
            context={'request': request}
        )

        return Response(serializer.data)

    @action(detail=False, methods=['put'], url_path='comments/(?P<comment_id>[^/.]+)/update')
    def update_comment(self, request, comment_id=None):
        """
        PUT /api/comment/comments/:id/update/
        
        Update comment (author only).
        """
        comment = get_object_or_404(
            Comment,
            id=comment_id,
            is_active=True
        )

        # Permission check
        if comment.author != request.user:
            return Response(
                {'detail': 'You do not have permission to edit this comment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UpdateCommentSerializer(
            comment,
            data=request.data,
            context={'request': request},
            partial=True
        )

        if serializer.is_valid():
            comment = serializer.save()
            detail_serializer = CommentSerializer(
                comment,
                context={'request': request}
            )
            return Response(detail_serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['delete'], url_path='comments/(?P<comment_id>[^/.]+)/delete')
    def delete_comment(self, request, comment_id=None):
        """
        DELETE /api/comment/comments/:id/delete/
        
        Soft delete comment (author only).
        """
        comment = get_object_or_404(
            Comment,
            id=comment_id,
            is_active=True
        )

        # Permission check
        if comment.author != request.user:
            return Response(
                {'detail': 'You do not have permission to delete this comment.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        comment.soft_delete()

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'], url_path='comments/(?P<comment_id>[^/.]+)/replies')
    def comment_replies(self, request, comment_id=None):
        """
        GET /api/comment/comments/:id/replies/
        
        Get all replies for a comment (paginated).
        """
        comment = get_object_or_404(Comment, id=comment_id, is_active=True)

        replies = comment.replies.filter(
            is_active=True
        ).select_related('author').order_by('created_at')

        serializer = CommentSerializer(
            replies,
            many=True,
            context={'request': request}
        )

        return Response({
            'count': replies.count(),
            'replies': serializer.data
        })

    @action(detail=False, methods=['get'], url_path='my')
    def my_comments(self, request):
        """
        GET /api/comment/my/
        
        Get all comments by current user.
        """
        comments = Comment.objects.filter(
            author=request.user,
            is_active=True
        ).select_related(
            'post',
            'post__author'
        ).order_by('-created_at')

        serializer = CommentSerializer(
            comments,
            many=True,
            context={'request': request}
        )

        return Response({
            'count': comments.count(),
            'comments': serializer.data
        })