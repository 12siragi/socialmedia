# comment/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """
    Django admin for Comment model.
    """

    list_display = [
        'id',
        'content_preview',
        'author_link',
        'post_link',
        'parent_link',
        'depth',
        'is_active',
        'created_at',
    ]

    list_filter = [
        'is_active',
        'depth',
        'created_at',
    ]

    search_fields = [
        'content',
        'author__email',
        'author__first_name',
        'author__last_name',
        'post__content',
    ]

    readonly_fields = [
        'depth',
        'created_at',
        'updated_at',
    ]

    ordering = ['-created_at']

    list_per_page = 100

    def get_queryset(self, request):
        """Optimize queries."""
        return super().get_queryset(request).select_related(
            'author',
            'post',
            'post__author',
            'parent'
        )

    def content_preview(self, obj):
        """Show content preview."""
        if not obj.is_active:
            return format_html('<span style="color: #999;">[deleted]</span>')
        return obj.content[:100] + ('...' if len(obj.content) > 100 else '')
    content_preview.short_description = "Content"

    def author_link(self, obj):
        """Link to author."""
        return format_html(
            '<a href="/admin/authentication/customuser/{}/change/">{}</a>',
            obj.author.id,
            obj.author.full_name
        )
    author_link.short_description = "Author"

    def post_link(self, obj):
        """Link to post."""
        return format_html(
            '<a href="/admin/posts/post/{}/change/">Post #{}</a>',
            obj.post.id,
            obj.post.id
        )
    post_link.short_description = "Post"

    def parent_link(self, obj):
        """Link to parent comment."""
        if obj.parent:
            return format_html(
                '<a href="/admin/comment/comment/{}/change/">Comment #{}</a>',
                obj.parent.id,
                obj.parent.id
            )
        return "-"
    parent_link.short_description = "Parent"