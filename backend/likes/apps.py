# likes/apps.py
from django.apps import AppConfig


class LikesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'likes'
    verbose_name = 'Post Likes'

    def ready(self):
        """
        Import signals when app is ready.
        
        CRITICAL: Signals must be imported for auto-updates to work.
        Without this, likes_count won't update automatically.
        """
        import likes.signals