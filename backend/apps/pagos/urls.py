from django.urls import path

from .views import MercadoPagoWebhookView, ReservationCheckoutView, ReservationPaymentView


urlpatterns = [
    path('reservations/<int:reservation_id>/checkout/', ReservationCheckoutView.as_view(), name='payment-checkout'),
    path('reservations/<int:reservation_id>/', ReservationPaymentView.as_view(), name='payment-detail'),
    path('webhooks/mercadopago/', MercadoPagoWebhookView.as_view(), name='mercadopago-webhook'),
]
