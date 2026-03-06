# ai/urls.py
from django.urls import path
from .views import TranslateView

urlpatterns = [
    path('translate/', TranslateView.as_view(), name='ai-translate'),
]
