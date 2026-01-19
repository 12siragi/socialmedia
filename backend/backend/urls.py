from django.contrib import admin
from django.conf import settings
from django.conf.urls.static import static
from django.urls import path, include
from django.http import JsonResponse

# Define home FIRST
def home(request):
    return JsonResponse({
        "status": "ok",
        "message": "SocialMedia API is running",
        "endpoints": [
            "/api/auth/",
            "/api/post/",
            "/api/comment/",
            "/admin/"
        ]
    })

# Then use it
urlpatterns = [
    path("", home),
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/post/", include("post.urls")),
    path("api/comment/", include("comment.urls")),
]


if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )
