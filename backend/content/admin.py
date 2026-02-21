# content/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import PostMedia


@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    """
    Django admin for PostMedia.
    
    FEATURES:
    - Preview images in list
    - Filter by type and date
    - Search by post
    - Optimized queries
    """
    
    list_display = [
        'id',
        'media_preview',
        'post_link',
        'media_type',
        'order',
        'file_size_display',
        'dimensions',
        'created_at',
    ]
    
    list_filter = [
        'media_type',
        'created_at',
    ]
    
    search_fields = [
        'post__id',
        'post__author__email',
        'post__content',
    ]
    
    readonly_fields = [
        'media_preview_large',
        'file_size',
        'width',
        'height',
        'created_at',
    ]
    
    ordering = ['-created_at']
    
    list_per_page = 50

    def get_queryset(self, request):
        """
        Optimize admin queries.
        
        OPTIMIZATION: Avoid N+1 queries in admin list view.
        """
        return super().get_queryset(request).select_related(
            'post',
            'post__author'
        )

    def media_preview(self, obj):
        """Show small thumbnail in list view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;" />',
                obj.image.url
            )
        elif obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-width: 50px; max-height: 50px;" />',
                obj.thumbnail.url
            )
        elif obj.video:
            return "🎥 Video"
        return "-"
    media_preview.short_description = "Preview"

    def media_preview_large(self, obj):
        """Show large preview in detail view."""
        if obj.image:
            return format_html(
                '<img src="{}" style="max-width: 400px;" />',
                obj.image.url
            )
        elif obj.thumbnail:
            return format_html(
                '<img src="{}" style="max-width: 400px;" /><br>'
                '<video src="{}" controls style="max-width: 400px;"></video>',
                obj.thumbnail.url,
                obj.video.url if obj.video else ''
            )
        elif obj.video:
            return format_html(
                '<video src="{}" controls style="max-width: 400px;"></video>',
                obj.video.url
            )
        return "-"
    media_preview_large.short_description = "Media Preview"

    def post_link(self, obj):
        """Link to parent post."""
        return format_html(
            '<a href="/admin/posts/post/{}/change/">Post #{}</a>',
            obj.post_id,
            obj.post_id
        )
    post_link.short_description = "Post"

    def file_size_display(self, obj):
        """Show file size in MB."""
        if obj.file_size:
            return f"{obj.file_size_mb} MB"
        return "-"
    file_size_display.short_description = "File Size"

    def dimensions(self, obj):
        """Show width × height."""
        if obj.width and obj.height:
            return f"{obj.width} × {obj.height}"
        return "-"
    dimensions.short_description = "Dimensions"