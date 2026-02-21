# likes/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Like


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    """
    Django admin for Like model.
    
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
        content_preview = obj.post.content[:50] if obj.post.content else "No content"
        return format_html(
            '<a href="/admin/posts/post/{}/change/">Post #{} - {}</a>',
            obj.post.id,
            obj.post.id,
            content_preview
        )
    post_link.short_description = "Post"