# comment/apps.py
from django.apps import AppConfig


class CommentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'comment'
    verbose_name = 'Post Comments'

    def ready(self):
        """
        Import signals when app is ready.
        
        CRITICAL: Signals must be imported for auto-updates to work.
        """
        import comment.signals