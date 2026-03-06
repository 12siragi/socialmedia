# ai/apps.py
from django.apps import AppConfig


class AiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'ai'
    verbose_name = 'AI Services'

    def ready(self):
        """
        Connect signals when app loads.
        TRUTH CONNECTION: app ready = True → signals active
        """
        import ai.signals  # noqa — registers all signal handlers