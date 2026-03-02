# backend/urls.py - OPTIMIZED

from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.http import JsonResponse
from django.views.decorators.cache import cache_page

# OPTIMIZATION: Cache the home view for 1 hour
@cache_page(60 * 60)
def home(request):
    """
    API health check endpoint.
    
    OPTIMIZATION: Cached for 1 hour (static response)
    """
    return JsonResponse({
        "status": "ok",
        "message": "SocialMedia API is running",
        "version": "1.0.0",
        "endpoints": {
            "auth": "/api/auth/",
            "post": "/api/post/",
            "comments": "/api/comment/",
            "admin": "/admin/",
            "docs": "/api/docs/",  # If you add API documentation
        }
    })
        
urlpatterns = [
    # Health check
    path("", home, name="home"),
    
    # Admin
    path("admin/", admin.site.urls),
    
    # API endpoints
    path("api/auth/", include("accounts.urls")),
    path("api/posts/", include("post.urls")),
    path('api/likes/', include('likes.urls')),
    path("api/comment/", include("comment.urls")),
    path('api/bookmarks/', include('bookmarks.urls')),
]

# Serve media files in development only
if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )