# content/models.py
from cloudinary_storage.storage import MediaCloudinaryStorage
from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
import os


# ===================================================================================
# CLOUDINARY STORAGE BACKENDS
# ===================================================================================

class VideoCloudinaryStorage(MediaCloudinaryStorage):
    """
    Custom Cloudinary storage for video files.
    Cloudinary requires resource_type='video' for video uploads.
    Without this, it throws 'Invalid image file' error.
    """
    def _upload(self, name, content):
        import cloudinary.uploader
        options = {
            'resource_type': 'video',
            'public_id': name.rsplit('.', 1)[0],  # strip extension
        }
        return cloudinary.uploader.upload(content, **options)


# ===================================================================================
# UPLOAD PATH HELPERS
# ===================================================================================

def post_image_path(instance, filename):
    return f"posts/images/user_{instance.post.author_id}/{filename}"


def post_video_path(instance, filename):
    return f"posts/videos/user_{instance.post.author_id}/{filename}"


def video_thumbnail_path(instance, filename):
    return f"posts/thumbnails/user_{instance.post.author_id}/{filename}"


# ===================================================================================
# POST MEDIA MODEL
# ===================================================================================

class PostMedia(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
    ]

    IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp']
    VIDEO_EXTENSIONS = ['mp4', 'mov', 'avi', 'mkv', 'webm']

    post = models.ForeignKey(
        'post.Post',
        on_delete=models.CASCADE,
        related_name='media',
        db_index=True,
        help_text="Parent post"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPE_CHOICES,
        db_index=True,
        help_text="Image or video (auto-detected on upload)"
    )

    image = models.ImageField(
        upload_to=post_image_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),  # images → default Cloudinary
        validators=[FileExtensionValidator(allowed_extensions=IMAGE_EXTENSIONS)],
        help_text="Image file (JPG, PNG, GIF, WEBP)"
    )

    video = models.FileField(
        upload_to=post_video_path,
        blank=True,
        null=True,
        storage=VideoCloudinaryStorage(),  # videos → resource_type=video
        validators=[FileExtensionValidator(allowed_extensions=VIDEO_EXTENSIONS)],
        help_text="Video file (MP4, MOV, AVI, MKV, WEBM)"
    )

    thumbnail = models.ImageField(
        upload_to=video_thumbnail_path,
        blank=True,
        null=True,
        storage=MediaCloudinaryStorage(),
        help_text="Auto-generated thumbnail for videos (optional)"
    )

    order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        help_text="Display order (0=first, 1=second, etc.)"
    )

    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes (auto-calculated)"
    )

    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['post', 'order'],               name='idx_media_post_order'),
            models.Index(fields=['post', 'media_type'],          name='idx_media_post_type'),
            models.Index(fields=['media_type', 'created_at'],    name='idx_media_type_date'),
            models.Index(fields=['post', 'media_type', 'order'], name='idx_media_post_type_order'),
        ]
        verbose_name = "Post Media"
        verbose_name_plural = "Post Media"

    def __str__(self):
        return f"Post {self.post_id} - {self.media_type.upper()} #{self.order}"

    def clean(self):
        has_image = bool(self.image)
        has_video = bool(self.video)

        if has_image and has_video:
            raise ValidationError("Cannot have both image and video.")
        if not has_image and not has_video:
            raise ValidationError("Must have either image or video.")
        if has_image and self.media_type != 'image':
            raise ValidationError("media_type must be 'image' when image is set.")
        if has_video and self.media_type != 'video':
            raise ValidationError("media_type must be 'video' when video is set.")

    def save(self, *args, **kwargs):
        if self.image and not self.file_size:
            self.file_size = self.image.size
            try:
                from PIL import Image
                img = Image.open(self.image)
                self.width, self.height = img.size
            except Exception:
                pass

        if self.video and not self.file_size:
            self.file_size = self.video.size

        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def filename(self):
        if self.image:
            return os.path.basename(self.image.name)
        if self.video:
            return os.path.basename(self.video.name)
        return None

    @property
    def file_url(self):
        if self.image:
            return self.image.url
        if self.video:
            return self.video.url
        return None

    @property
    def file_size_mb(self):
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0

    @property
    def aspect_ratio(self):
        if self.width and self.height:
            return round(self.width / self.height, 2)
        return None

    def delete_files(self):
        if self.image:
            self.image.delete(save=False)
        if self.video:
            self.video.delete(save=False)
        if self.thumbnail:
            self.thumbnail.delete(save=False)

    def delete(self, *args, **kwargs):
        self.delete_files()
        super().delete(*args, **kwargs)