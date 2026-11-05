import hashlib
import hmac
from datetime import time, timedelta
from decimal import Decimal
from unittest.mock import Mock, patch

from django.test import override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.parking.models import Parking, ParkingSpace
from apps.reservations.models import Reservation
from apps.users.models import User
from .models import Payment


@override_settings(
    MERCADOPAGO_ACCESS_TOKEN='TEST-access-token',
    MERCADOPAGO_WEBHOOK_SECRET='test-webhook-secret',
    MERCADOPAGO_WEBHOOK_URL='',
    PAYMENT_RESERVATION_MINUTES=15,
)
class MercadoPagoPaymentTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='driver@example.com', password='password123', first_name='Ana', last_name='Pérez'
        )
        self.other_user = User.objects.create_user(
            email='other@example.com', password='password123', first_name='Beto', last_name='Gómez'
        )
        self.parking = Parking.objects.create(
            name='Parking Centro', address='Av. Siempre Viva 123', latitude=-34.6, longitude=-58.4,
            price_per_hour=Decimal('2500.00'), is_24_hours=True, capacity=3,
        )
        self.space = ParkingSpace.objects.create(parking=self.parking, code='A01')
        self.client.force_authenticate(self.user)

    def create_pending_reservation(self):
        response = self.client.post('/api/reservations/', {
            'parking': self.parking.id,
            'space': self.space.id,
            'vehicle_plate': 'AA123BB',
            'vehicle_model': 'Auto',
            'date': (timezone.localdate() + timedelta(days=1)).isoformat(),
            'start_time': '10:00',
            'end_time': '12:00',
        }, format='json')
        self.assertEqual(response.status_code, 201, response.data)
        return Reservation.objects.get(pk=response.data['reservation']['id'])

    def test_new_reservation_waits_for_payment(self):
        reservation = self.create_pending_reservation()
        self.assertEqual(reservation.status, Reservation.Status.PENDING)
        self.assertEqual(reservation.payment_status, 'pending')
        self.assertEqual(reservation.payment_method, 'Mercado Pago')
        self.assertGreater(reservation.payment_expires_at, timezone.now())

    @patch('apps.pagos.services.requests.request')
    def test_checkout_returns_mercado_pago_url(self, request_mock):
        reservation = self.create_pending_reservation()
        provider_response = Mock(ok=True)
        provider_response.json.return_value = {
            'id': 'PREFERENCE-123',
            'init_point': 'https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=PREFERENCE-123',
        }
        request_mock.return_value = provider_response

        response = self.client.post(f'/api/payments/reservations/{reservation.id}/checkout/')

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data['payment']['checkout_url'], provider_response.json.return_value['init_point'])
        payment = Payment.objects.get(reservation=reservation)
        self.assertEqual(payment.preference_id, 'PREFERENCE-123')
        self.assertEqual(payment.status, Payment.Status.PENDING)

    @patch('apps.pagos.services.requests.request')
    def test_approved_payment_confirms_reservation(self, request_mock):
        reservation = self.create_pending_reservation()
        payment = Payment.objects.create(
            reservation=reservation,
            external_reference=f'PARKIA-{reservation.id}-{reservation.booking_code}',
            amount=reservation.total_price,
            currency='ARS',
            status=Payment.Status.PENDING,
            expires_at=reservation.payment_expires_at,
        )
        provider_response = Mock(ok=True)
        provider_response.json.return_value = {'results': [{
            'id': 999,
            'external_reference': payment.external_reference,
            'transaction_amount': str(payment.amount),
            'currency_id': 'ARS',
            'status': 'approved',
            'status_detail': 'accredited',
        }]}
        request_mock.return_value = provider_response

        response = self.client.get(f'/api/payments/reservations/{reservation.id}/')

        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(response.data['payment']['is_paid'])
        reservation.refresh_from_db()
        self.assertEqual(reservation.status, Reservation.Status.CONFIRMED)
        self.assertEqual(reservation.payment_status, 'paid')
        self.assertIsNone(reservation.payment_expires_at)

    def test_another_driver_cannot_start_payment(self):
        reservation = self.create_pending_reservation()
        self.client.force_authenticate(self.other_user)

        response = self.client.post(f'/api/payments/reservations/{reservation.id}/checkout/')

        self.assertEqual(response.status_code, 404)

    @patch('apps.pagos.services.requests.request')
    def test_valid_webhook_syncs_only_verified_payment(self, request_mock):
        reservation = self.create_pending_reservation()
        payment = Payment.objects.create(
            reservation=reservation,
            external_reference=f'PARKIA-{reservation.id}-{reservation.booking_code}',
            amount=reservation.total_price,
            currency='ARS',
            status=Payment.Status.PENDING,
        )
        provider_response = Mock(ok=True)
        provider_response.json.return_value = {
            'id': 321,
            'external_reference': payment.external_reference,
            'transaction_amount': str(payment.amount),
            'currency_id': 'ARS',
            'status': 'approved',
            'status_detail': 'accredited',
        }
        request_mock.return_value = provider_response
        request_id = 'request-abc'
        timestamp = '1700000000'
        manifest = f'id:321;request-id:{request_id};ts:{timestamp};'
        signature = hmac.new(b'test-webhook-secret', manifest.encode(), hashlib.sha256).hexdigest()
        self.client.force_authenticate(user=None)

        response = self.client.post(
            '/api/payments/webhooks/mercadopago/?data.id=321',
            {'type': 'payment', 'data': {'id': '321'}},
            format='json',
            HTTP_X_SIGNATURE=f'ts={timestamp},v1={signature}',
            HTTP_X_REQUEST_ID=request_id,
        )

        self.assertEqual(response.status_code, 204, response.data)
        reservation.refresh_from_db()
        self.assertEqual(reservation.payment_status, 'paid')

    def test_access_qr_is_refused_while_payment_is_pending(self):
        reservation = self.create_pending_reservation()
        self.user.role = User.Role.ADMIN
        self.user.save(update_fields=['role'])
        self.client.force_authenticate(self.user)

        response = self.client.post('/api/reservations/verify_qr/', {'code': reservation.booking_code}, format='json')

        self.assertEqual(response.status_code, 400)
