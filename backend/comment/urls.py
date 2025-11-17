from django.urls import path, include
from rest_framework_nested import routers
from post.views import PostViewSet
from comment.views import CommentViewSet

# Main router for posts
router = routers.SimpleRouter()
router.register(r"post", PostViewSet, basename="post")

# Nested router for comments under posts
post_router = routers.NestedSimpleRouter(router, r"post", lookup="post")
post_router.register(r"comment", CommentViewSet, basename="post-comments")

urlpatterns = [
    path("", include(router.urls)),
    path("", include(post_router.urls)),
]
