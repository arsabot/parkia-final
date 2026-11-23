from django.urls import path
from .views import GreenPointsSummaryView, CausesStatsView

urlpatterns = [
    path('', GreenPointsSummaryView.as_view(), name='green-points-summary'),
    path('causes/', CausesStatsView.as_view(), name='green-points-causes'),
]
