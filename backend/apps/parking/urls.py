from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParkingViewSet, ParkingSpaceViewSet, FavoritesListView

router = DefaultRouter()
router.register(r'spaces', ParkingSpaceViewSet, basename='parking-space')
router.register(r'', ParkingViewSet, basename='parking')

urlpatterns = [
    path('favorites/', FavoritesListView.as_view(), name='parking-favorites'),
    path('', include(router.urls)),
]
