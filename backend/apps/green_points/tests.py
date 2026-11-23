from datetime import date, time, timedelta
from decimal import Decimal
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.parking.models import Parking, ParkingSpace
from apps.reservations.models import Reservation
from apps.green_points.models import GreenPointLedger, GreenPointsDiscount
from apps.green_points.services import (
    get_user_points_balance,
    sync_user_points,
    get_user_green_points_summary,
    calculate_causes_totals,
)

User = get_user_model()


class GreenPointsBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create user conductor
        self.user = User.objects.create_user(
            email='driver_green@parkia.com',
            password='testpassword123',
            first_name='Carlos',
            last_name='Verde',
            role='driver'
        )

        # Create user owner
        self.owner = User.objects.create_user(
            email='owner_green@parkia.com',
            password='testpassword123',
            first_name='Dueño',
            last_name='Garaje',
            role='owner'
        )

        # Create parking
        self.parking = Parking.objects.create(
            name='Estacionamiento Ecológico Central',
            address='Av. Corrientes 1234',
            city='CABA',
            latitude=-34.6037,
            longitude=-58.3816,
            price_per_hour=Decimal('1000.00'),
            capacity=10,
            owner=self.owner,
            is_active=True
        )

        self.space = ParkingSpace.objects.create(
            parking=self.parking,
            code='E-01',
            floor='Planta Baja',
            space_type=ParkingSpace.SpaceType.STANDARD,
            status=ParkingSpace.Status.AVAILABLE
        )

    def test_points_calculation_on_completed_with_checkin(self):
        """1. Los puntos (+10) se suman cuando hubo check-in y la reserva terminó."""
        res = Reservation.objects.create(
            user=self.user,
            parking=self.parking,
            space=self.space,
            vehicle_plate='AA123BB',
            date=date.today() - timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=Decimal('2.0'),
            total_price=Decimal('2000.00'),
            status=Reservation.Status.COMPLETED,
            check_in_time=timezone.now() - timedelta(days=1),
            check_out_time=timezone.now() - timedelta(days=1, hours=22),
            payment_status='paid'
        )

        sync_user_points(self.user)

        balance = get_user_points_balance(self.user)
        self.assertEqual(balance, settings.GREEN_POINTS_PER_RESERVATION)

        summary = get_user_green_points_summary(self.user)
        self.assertEqual(summary['balance'], 10)
        self.assertEqual(summary['km_saved'], 5.0)
        self.assertEqual(summary['co2_saved_kg'], 1.0)
        self.assertEqual(summary['points_to_next_discount'], 90)
        self.assertFalse(summary['has_discount_available'])

    def test_points_not_earned_without_checkin(self):
        """2. Si no hubo check-in (no se validó QR), no se suman puntos."""
        res = Reservation.objects.create(
            user=self.user,
            parking=self.parking,
            space=self.space,
            vehicle_plate='AA123BB',
            date=date.today() - timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=Decimal('2.0'),
            total_price=Decimal('2000.00'),
            status=Reservation.Status.COMPLETED,
            check_in_time=None,  # No hubo check-in
            payment_status='paid'
        )

        sync_user_points(self.user)
        self.assertEqual(get_user_points_balance(self.user), 0)

    def test_points_not_added_twice(self):
        """3. No se suman puntos dos veces para la misma reserva."""
        res = Reservation.objects.create(
            user=self.user,
            parking=self.parking,
            space=self.space,
            vehicle_plate='AA123BB',
            date=date.today() - timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=Decimal('2.0'),
            total_price=Decimal('2000.00'),
            status=Reservation.Status.COMPLETED,
            check_in_time=timezone.now() - timedelta(days=1),
            payment_status='paid'
        )

        # Sincronizar dos veces
        sync_user_points(self.user)
        sync_user_points(self.user)

        entries_count = GreenPointLedger.objects.filter(
            user=self.user,
            reservation=res,
            transaction_type=GreenPointLedger.TransactionType.EARNED
        ).count()

        self.assertEqual(entries_count, 1)
        self.assertEqual(get_user_points_balance(self.user), 10)

    def test_check_in_rejects_cancelled_reservation(self):
        """4. El check-in no debe aceptar reservas canceladas."""
        res = Reservation.objects.create(
            user=self.user,
            parking=self.parking,
            space=self.space,
            vehicle_plate='AA123BB',
            date=date.today(),
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=Decimal('2.0'),
            total_price=Decimal('2000.00'),
            status=Reservation.Status.CANCELLED,
            cancellation_reason='El usuario canceló'
        )

        self.client.force_authenticate(user=self.owner)
        response = self.client.post(f'/api/reservations/{res.id}/check_in/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cancelada', response.data['error'].lower())

    def test_discount_applied_at_100_points(self):
        """5. Con 100 puntos, la próxima reserva tiene 10% de descuento automático y saldo baja 100."""
        # Acreditar 100 puntos al usuario
        GreenPointLedger.objects.create(
            user=self.user,
            points=100,
            transaction_type=GreenPointLedger.TransactionType.ADJUSTMENT,
            description='Acreditación de bienvenida para test'
        )
        self.assertEqual(get_user_points_balance(self.user), 100)

        # Crear reserva vía API autenticado
        self.client.force_authenticate(user=self.user)
        payload = {
            'parking': self.parking.id,
            'space': self.space.id,
            'vehicle_plate': 'AA999ZZ',
            'date': (date.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'start_time': '10:00',
            'end_time': '12:00',  # 2 horas a $1000/h = $2000 base
            'payment_method': 'Efectivo',
        }
        response = self.client.post('/api/reservations/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        res_data = response.data['reservation']
        # Precio original: 2000, 10% descuento: 200, precio final: 1800
        self.assertEqual(float(res_data['total_price']), 1800.0)

        # Verificar que el descuento quedó guardado aparte
        discount_record = GreenPointsDiscount.objects.get(reservation_id=res_data['id'])
        self.assertEqual(float(discount_record.original_price), 2000.0)
        self.assertEqual(float(discount_record.discount_amount), 200.0)
        self.assertEqual(float(discount_record.discount_percent), 10.0)
        self.assertEqual(float(discount_record.final_price), 1800.0)

        # Verificar que el saldo del usuario bajó 100
        self.assertEqual(get_user_points_balance(self.user), 0)

    def test_cancellation_restores_discount_points(self):
        """6. Cancelar una reserva que usó el descuento devuelve los 100 puntos."""
        # Acreditar 100 puntos
        GreenPointLedger.objects.create(
            user=self.user,
            points=100,
            transaction_type=GreenPointLedger.TransactionType.ADJUSTMENT,
            description='Test'
        )

        self.client.force_authenticate(user=self.user)
        payload = {
            'parking': self.parking.id,
            'space': self.space.id,
            'vehicle_plate': 'AA999ZZ',
            'date': (date.today() + timedelta(days=1)).strftime('%Y-%m-%d'),
            'start_time': '10:00',
            'end_time': '12:00',
            'payment_method': 'Efectivo',
        }
        res_post = self.client.post('/api/reservations/', payload, format='json')
        res_id = res_post.data['reservation']['id']
        self.assertEqual(get_user_points_balance(self.user), 0)

        # Cancelar la reserva
        cancel_res = self.client.patch(f'/api/reservations/{res_id}/cancel/', {'reason': 'Cambio de planes'})
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)

        # Los 100 puntos deben estar devueltos
        self.assertEqual(get_user_points_balance(self.user), 100)

    def test_cancellation_deducts_earned_points_without_negative_balance(self):
        """7. Si una reserva completada que sumó puntos se cancela/reembolsa, se descuentan sin dejar saldo negativo."""
        res = Reservation.objects.create(
            user=self.user,
            parking=self.parking,
            space=self.space,
            vehicle_plate='AA123BB',
            date=date.today() - timedelta(days=1),
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=Decimal('2.0'),
            total_price=Decimal('2000.00'),
            status=Reservation.Status.COMPLETED,
            check_in_time=timezone.now() - timedelta(days=1),
            payment_status='paid'
        )

        sync_user_points(self.user)
        self.assertEqual(get_user_points_balance(self.user), 10)

        # Marcar la reserva como reembolsada/cancelada
        res.payment_status = 'refunded'
        res.status = Reservation.Status.CANCELLED
        res.save()

        sync_user_points(self.user)
        self.assertEqual(get_user_points_balance(self.user), 0)

    def test_causes_endpoint_and_summary_endpoint(self):
        """8. Endpoints GET /api/green-points/ y GET /api/green-points/causes/ devuelven datos correctos."""
        # Test causes público
        causes_res = self.client.get('/api/green-points/causes/')
        self.assertEqual(causes_res.status_code, status.HTTP_200_OK)
        self.assertIn('total_donated_environment', causes_res.data)
        self.assertIn('total_donated_inclusion', causes_res.data)
        self.assertEqual(len(causes_res.data['causes']), 2)

        # Test summary autenticado
        self.client.force_authenticate(user=self.user)
        summary_res = self.client.get('/api/green-points/')
        self.assertEqual(summary_res.status_code, status.HTTP_200_OK)
        self.assertIn('balance', summary_res.data)
        self.assertIn('km_saved', summary_res.data)
        self.assertIn('co2_saved_kg', summary_res.data)
        self.assertIn('causes', summary_res.data)
        self.assertIn('history', summary_res.data)
