# content/models.py
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import os


# ===================================================================================
# UPLOAD PATH HELPERS
# ===================================================================================

def post_image_path(instance, filename):
    """
    Organize images by user for easy management/deletion.
    
    Structure: posts/images/user_123/filename.jpg
    
    BENEFITS:
    - Easy to find/delete user's media
    - Prevents name collisions across users
    - Efficient storage cleanup
    
    GROWTH: Scales to millions of files with user-based sharding
    """
    return f"posts/images/user_{instance.post.author_id}/{filename}"


def post_video_path(instance, filename):
    """
    Organize videos by user.
    
    Structure: posts/videos/user_123/video.mp4
    
    WHY SEPARATE:
    - Videos are LARGE files (100MB+)
    - May need different storage backend (S3 vs local)
    - Easier to apply video-specific processing (transcoding)
    """
    return f"posts/videos/user_{instance.post.author_id}/{filename}"


def video_thumbnail_path(instance, filename):
    """
    Store video thumbnails for fast feed loading.
    
    Structure: posts/thumbnails/user_123/thumb.jpg
    
    WHY THUMBNAILS:
    - Feed loads thumbnails only (fast)
    - Actual video loads on click (saves bandwidth)
    - Thumbnail: 50KB, Video: 50MB → 1000x smaller
    """
    return f"posts/thumbnails/user_{instance.post.author_id}/{filename}"


# ===================================================================================
# POST MEDIA MODEL
# ===================================================================================

class PostMedia(models.Model):
    """
    Stores images and videos for posts.
    
    OWNERSHIP:
    - Belongs to Post (CASCADE delete)
    - Indirectly owned by User through Post
    
    GROWTH ANALYSIS:
    - 1 post = 1-10 media (avg 3)
    - 1M posts = 3M media records
    - Storage: 3M × 2MB avg = 6TB
    
    WHAT GROWS:
    - PostMedia rows (millions)
    - File storage (TB scale)
    - Database queries (without prefetch)
    
    WHAT MUST BE FAST:
    - Feed loading (prefetch_related)
    - Image URLs (precomputed in serializer)
    - First media preview (order field)
    
    PRECOMPUTED:
    - media_type → no content_type checks in loops
    - order → no Python sorting
    - file_size → no file I/O for analytics
    
    INDEXES:
    - (post, order) → Get media for post in order
    - (post, media_type) → Filter images/videos
    - (media_type, created_at) → Analytics queries
    """

    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    # Allowed file extensions
    IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm']

    # ─── Relationships ────────────────────────────────────────────────
    post = models.ForeignKey(
        'post.Post',
        on_delete=models.CASCADE,  # Delete media when post deleted
        related_name='media',
        db_index=True,
        help_text="Parent post"
    )

    # ─── Media Type (Precomputed) ─────────────────────────────────────
    # OPTIMIZATION: Store type to avoid checking file extension in loops
    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPE_CHOICES,
        db_index=True,
        help_text="Image or video (auto-detected on upload)"
    )

    # ─── Files ────────────────────────────────────────────────────────
    image = models.ImageField(
        upload_to=post_image_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(), 
        validators=[
            FileExtensionValidator(allowed_extensions=IMAGE_EXTENSIONS)
        ],
        help_text="Image file (JPG, PNG, GIF, WEBP)"
    )

    video = models.FileField(
        upload_to=post_video_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),
        validators=[
            FileExtensionValidator(allowed_extensions=VIDEO_EXTENSIONS)
        ],
        help_text="Video file (MP4, MOV, AVI, MKV, WEBM)"
    )

    # Video thumbnail for feed preview
    # OPTIMIZATION: Thumbnails load in feed, videos load on click
    thumbnail = models.ImageField(
        upload_to=video_thumbnail_path,
        blank=True,
        null=True,
        help_text="Auto-generated thumbnail for videos (optional)"
    )

    # ─── Ordering (Precomputed) ───────────────────────────────────────
    # OPTIMIZATION: Store order instead of using timestamps
    # Allows manual reordering without changing created_at
    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Display order (0=first, 1=second, etc.)"
    )

    # ─── Metadata (Precomputed) ───────────────────────────────────────
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes (auto-calculated)"
    )

    # Optional: Width/height for images (for aspect ratio)
    width = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Image/video width in pixels"
    )

    height = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Image/video height in pixels"
    )

    # ─── Timestamps ───────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When media was uploaded"
    )

    # ─── Meta ─────────────────────────────────────────────────────────
    class Meta:
        ordering = ['order', 'id']  # Order first, ID for stability

        indexes = [
            # Get all media for a post in order
            models.Index(
                fields=['post', 'order'],
                name='idx_media_post_order'
            ),
            # Filter by type (e.g., only images)
            models.Index(
                fields=['post', 'media_type'],
                name='idx_media_post_type'
            ),
            # Analytics: media uploads over time
            models.Index(
                fields=['media_type', 'created_at'],
                name='idx_media_type_date'
            ),
            # Composite: post's images in order
            models.Index(
                fields=['post', 'media_type', 'order'],
                name='idx_media_post_type_order'
            ),
        ]

        verbose_name = "Post Media"
        verbose_name_plural = "Post Media"

    # ─── String Representation ────────────────────────────────────────
    def __str__(self):
        return f"Post {self.post_id} - {self.media_type.upper()} #{self.order}"

    # ─── Validation ───────────────────────────────────────────────────
    def clean(self):
        """
        Validate that exactly one of image/video is set.
        Validate media_type matches file.
        """
        has_image = bool(self.image)
        has_video = bool(self.video)

        # Must have exactly one file type
        if has_image and has_video:
            raise ValidationError(
                "Cannot have both image and video. Create separate media records."
            )

        if not has_image and not has_video:
            raise ValidationError(
                "Must have either image or video."
            )

        # Validate media_type matches file
        if has_image and self.media_type != 'image':
            raise ValidationError(
                "media_type must be 'image' when image is set."
            )

        if has_video and self.media_type != 'video':
            raise ValidationError(
                "media_type must be 'video' when video is set."
            )

    def save(self, *args, **kwargs):
        """
        Auto-calculate metadata before saving.
        
        PRECOMPUTES:
        - file_size (avoids file I/O later)
        - width/height (for aspect ratio calculations)
        """
        # Calculate file size
        if self.image and not self.file_size:
            self.file_size = self.image.size
            # Get image dimensions
            try:
                from PIL import Image
                img = Image.open(self.image)
                self.width, self.height = img.size
            except Exception:
                pass  # Fallback if PIL not available

        if self.video and not self.file_size:
            self.file_size = self.video.size

        # Run validation
        self.full_clean()
        
        super().save(*args, **kwargs)

    # ─── Properties ───────────────────────────────────────────────────
    @property
    def filename(self):
        """Get original filename without path."""
        if self.image:
            return os.path.basename(self.image.name)
        if self.video:
            return os.path.basename(self.video.name)
        return None

    @property
    def file_url(self):
        """
        Returns the actual file URL (image or video).
        
        OPTIMIZATION: Used in serializers to avoid if/else logic.
        """
        if self.image:
            return self.image.url
        if self.video:
            return self.video.url
        return None

    @property
    def file_size_mb(self):
        """Convert bytes to MB for display."""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0

    @property
    def aspect_ratio(self):
        """Calculate aspect ratio for responsive layouts."""
        if self.width and self.height:
            return round(self.width / self.height, 2)
        return None

    # ─── File Management ──────────────────────────────────────────────
    def delete_files(self):
        """
        Delete physical files from storage.
        
        IMPORTANT: Call before deleting record to avoid orphaned files.
        
        STORAGE CLEANUP:
        - Deletes image/video file
        - Deletes thumbnail
        - Frees up disk space
        """
        if self.image:
            self.image.delete(save=False)
        if self.video:
            self.video.delete(save=False)
        if self.thumbnail:
            self.thumbnail.delete(save=False)

    def delete(self, *args, **kwargs):
        """
        Override delete to clean up files automatically.
        
        GROWTH MANAGEMENT:
        - Prevents orphaned files (wasted storage)
        - Critical at scale (TB of storage)
        """
        self.delete_files()
        super().delete(*args, **kwargs)