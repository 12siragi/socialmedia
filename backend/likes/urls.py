# likes/urls.py
from rest_framework.routers import DefaultRouter
from .views import LikeViewSet

router = DefaultRouter()
router.register(r'', LikeViewSet, basename='like')

urlpatterns = router.urls