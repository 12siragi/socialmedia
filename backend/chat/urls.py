# chat/urls.py
from django.urls import path
from .views import (
    ConversationListView,
    ConversationDetailView,
    MessageListView,
    MessageDeleteView,
    MessageReadView,
)

app_name = 'chat'

urlpatterns = [
    # Conversations
    # GET  /chat/conversations/          → list all conversations for user
    # POST /chat/conversations/          → create new DM or group
    path(
        'conversations/',
        ConversationListView.as_view(),
        name='conversation-list',
    ),

    # GET  /chat/conversations/<id>/     → retrieve single conversation
    path(
        'conversations/<int:conversation_id>/',
        ConversationDetailView.as_view(),
        name='conversation-detail',
    ),

    # Messages
    # GET  /chat/conversations/<id>/messages/       → paginated messages with translations
    # POST /chat/conversations/<id>/messages/       → send new message
    path(
        'conversations/<int:conversation_id>/messages/',
        MessageListView.as_view(),
        name='message-list',
    ),

    # DELETE /chat/conversations/<id>/messages/<id>/  → soft delete own message
    path(
        'conversations/<int:conversation_id>/messages/<int:message_id>/',
        MessageDeleteView.as_view(),
        name='message-detail',
    ),

    # POST /chat/conversations/<id>/messages/read/  → mark messages as read
    path(
        'conversations/<int:conversation_id>/messages/read/',
        MessageReadView.as_view(),
        name='message-read',
    ),
]