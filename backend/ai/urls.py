# ai/urls.py
from django.urls import path
from .views import TranslationPreferenceView, MessageAudioView

app_name = 'ai'

urlpatterns = [
    # GET  /ai/translation-preference/<conversation_id>/  → get toggle state
    # POST /ai/translation-preference/<conversation_id>/  → set toggle state
    path(
        'translation-preference/<int:conversation_id>/',
        TranslationPreferenceView.as_view(),
        name='translation-preference',
    ),
    path(
     # On-demand TTS audio generation
    # POST /api/ai/audio/<message_id>/
        'audio/<int:message_id>/',
        MessageAudioView.as_view(),
        name='message-audio',
    ),
]