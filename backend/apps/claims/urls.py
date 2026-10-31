from rest_framework.routers import SimpleRouter

from .views import ClaimViewSet

router = SimpleRouter()
router.register(r'', ClaimViewSet, basename='claim')

urlpatterns = router.urls
