from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.reservations.models import Reservation
from .models import Payment
from .serializers import PaymentSerializer
from .services import (
    PaymentConfigurationError,
    PaymentProviderError,
    create_checkout,
    refresh_payment,
    refresh_payment_by_provider_id,
    valid_webhook_signature,
)


def reservation_for_user(reservation_id, user):
    reservation = Reservation.objects.select_related('user', 'parking').filter(pk=reservation_id).first()
    if not reservation:
        return None
    if reservation.user_id == user.id or user.is_superuser or user.role == 'admin':
        return reservation
    return None


class ReservationCheckoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, reservation_id):
        reservation = reservation_for_user(reservation_id, request.user)
        if not reservation:
            return Response({'error': 'Reserva no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            payment = create_checkout(reservation)
        except PaymentConfigurationError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except PaymentProviderError as exc:
            return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({'payment': PaymentSerializer(payment).data})


class ReservationPaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, reservation_id):
        reservation = reservation_for_user(reservation_id, request.user)
        if not reservation:
            return Response({'error': 'Reserva no encontrada.'}, status=status.HTTP_404_NOT_FOUND)
        payment = Payment.objects.select_related('reservation').filter(reservation=reservation).first()
        if not payment:
            return Response({'error': 'Todavía no existe un pago para esta reserva.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            payment = refresh_payment(payment)
        except (PaymentConfigurationError, PaymentProviderError):
            pass
        return Response({'payment': PaymentSerializer(payment).data})


class MercadoPagoWebhookView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = request.data if isinstance(request.data, dict) else {}
        data_id = request.query_params.get('data.id') or (payload.get('data') or {}).get('id')
        if not data_id:
            return Response({'error': 'Notificación sin identificador de pago.'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.MERCADOPAGO_WEBHOOK_SECRET:
            return Response({'error': 'Webhook no configurado.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        if not valid_webhook_signature(
            request.headers.get('x-signature', ''),
            request.headers.get('x-request-id', ''),
            data_id,
        ):
            return Response({'error': 'Firma inválida.'}, status=status.HTTP_401_UNAUTHORIZED)
        if payload.get('type') not in (None, 'payment'):
            return Response(status=status.HTTP_204_NO_CONTENT)
        try:
            refresh_payment_by_provider_id(data_id)
        except (PaymentConfigurationError, PaymentProviderError):
            return Response({'error': 'No se pudo sincronizar el pago.'}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(status=status.HTTP_204_NO_CONTENT)
