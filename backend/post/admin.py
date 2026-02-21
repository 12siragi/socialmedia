# posts/admin.py
from django.contrib import admin
from .models import Post


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = [
        'id', 'author', 'post_type', 'likes_count',
        'comments_count', 'is_active', 'created_at'
    ]
    list_filter = ['post_type', 'is_active', 'created_at']
    search_fields = ['author__email', 'content']
    readonly_fields = ['likes_count', 'comments_count', 'created_at', 'updated_at']
    ordering = ['-created_at']

    def get_queryset(self, request):
        """Optimize admin queries."""
        return super().get_queryset(request).select_related('author')