# bookmarks/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Bookmark


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    """
    Django admin for Bookmark model.
    
    FEATURES:
    - View user and post info
    - Filter by date
    - Search by user/post
    - Optimized queries
    """
    
    list_display = [
        'id',
        'user_link',
        'post_link',
        'post_preview',
        'created_at',
    ]
    
    list_filter = [
        'created_at',
    ]
    
    search_fields = [
        'user__email',
        'user__first_name',
        'user__last_name',
        'post__id',
        'post__content',
    ]
    
    readonly_fields = ['created_at']
    
    ordering = ['-created_at']
    
    list_per_page = 100

    def get_queryset(self, request):
        """
        Optimize admin queries.
        
        OPTIMIZATION: Avoid N+1 queries in list view.
        """
        return super().get_queryset(request).select_related(
            'user',
            'post',
            'post__author'
        )

    def user_link(self, obj):
        """Link to user in admin."""
        return format_html(
            '<a href="/admin/authentication/customuser/{}/change/">{}</a>',
            obj.user.id,
            obj.user.full_name
        )
    user_link.short_description = "User"

    def post_link(self, obj):
        """Link to post in admin."""
        return format_html(
            '<a href="/admin/posts/post/{}/change/">Post #{}</a>',
            obj.post.id,
            obj.post.id
        )
    post_link.short_description = "Post"

    def post_preview(self, obj):
        """Show post content preview."""
        if obj.post.content:
            preview = obj.post.content[:100]
            if len(obj.post.content) > 100:
                preview += "..."
            return preview
        return f"[{obj.post.post_type} post]"
    post_preview.short_description = "Content"