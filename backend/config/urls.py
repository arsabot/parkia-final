from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin-django/', admin.site.urls),
    path('api/auth/', include('apps.users.urls')),
    path('api/parking/', include('apps.parking.urls')),
    path('api/reservations/', include('apps.reservations.urls')),
    path('api/reviews/', include('apps.reviews.urls')),
    path('api/admin/', include('apps.admin_stats.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
