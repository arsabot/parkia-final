from datetime import date, time, timedelta
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.parking.models import Parking, ParkingSpace
from apps.reservations.models import Reservation


class ReservationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.driver = User.objects.create_user(
            email='res_driver_t@test.com',
            password='password123',
            first_name='Juan',
            last_name='Pérez',
            role=User.Role.DRIVER
        )
        self.other_driver = User.objects.create_user(
            email='res_other_t@test.com',
            password='password123',
            first_name='María',
            last_name='Gómez',
            role=User.Role.DRIVER
        )
        self.parking = Parking.objects.create(
            name='Estacionamiento Test',
            address='Av. Libertador 1000',
            city='Buenos Aires',
            latitude=-34.5800,
            longitude=-58.4000,
            price_per_hour=1000.00,
            opening_time=time(8, 0),
            closing_time=time(22, 0),
            capacity=5,
            is_active=True
        )
        self.space1 = ParkingSpace.objects.create(
            parking=self.parking,
            code='A01',
            status=ParkingSpace.Status.AVAILABLE
        )
        self.space2 = ParkingSpace.objects.create(
            parking=self.parking,
            code='A02',
            status=ParkingSpace.Status.AVAILABLE
        )

    def test_create_valid_reservation(self):
        self.client.force_authenticate(user=self.driver)
        tomorrow = date.today() + timedelta(days=1)
        payload = {
            'parking': self.parking.id,
            'space': self.space1.id,
            'vehicle_plate': 'AB123CD',
            'date': tomorrow.strftime('%Y-%m-%d'),
            'start_time': '10:00',
            'end_time': '12:00',
        }
        response = self.client.post('/api/reservations/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('reservation', response.data)
        self.assertEqual(response.data['reservation']['vehicle_plate'], 'AB123CD')
        self.assertTrue(response.data['reservation']['booking_code'].startswith('PK-'))
        self.assertEqual(float(response.data['reservation']['total_price']), 2000.0)

    def test_prevent_overlapping_reservation_same_space(self):
        tomorrow = date.today() + timedelta(days=1)
        Reservation.objects.create(
            user=self.driver,
            parking=self.parking,
            space=self.space1,
            vehicle_plate='AB123CD',
            date=tomorrow,
            start_time=time(10, 0),
            end_time=time(12, 0),
            total_hours=2,
            total_price=2000,
            status=Reservation.Status.CONFIRMED
        )

        self.client.force_authenticate(user=self.other_driver)
        payload = {
            'parking': self.parking.id,
            'space': self.space1.id,
            'vehicle_plate': 'EF456GH',
            'date': tomorrow.strftime('%Y-%m-%d'),
            'start_time': '11:00',
            'end_time': '13:00',
        }
        response = self.client.post('/api/reservations/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('space', response.data['errors'])

    def test_reject_outside_opening_hours(self):
        self.client.force_authenticate(user=self.driver)
        tomorrow = date.today() + timedelta(days=1)
        payload = {
            'parking': self.parking.id,
            'vehicle_plate': 'AB123CD',
            'date': tomorrow.strftime('%Y-%m-%d'),
            'start_time': '06:00',
            'end_time': '07:30',
        }
        response = self.client.post('/api/reservations/', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_cancel_reservation(self):
        self.client.force_authenticate(user=self.driver)
        tomorrow = date.today() + timedelta(days=1)
        res = Reservation.objects.create(
            user=self.driver,
            parking=self.parking,
            space=self.space1,
            vehicle_plate='AB123CD',
            date=tomorrow,
            start_time=time(14, 0),
            end_time=time(16, 0),
            total_hours=2,
            total_price=2000,
            status=Reservation.Status.CONFIRMED
        )
        cancel_res = self.client.patch(f'/api/reservations/{res.id}/cancel/', {
            'reason': 'No necesito viajar hoy'
        }, format='json')
        self.assertEqual(cancel_res.status_code, status.HTTP_200_OK)
        res.refresh_from_db()
        self.assertEqual(res.status, Reservation.Status.CANCELLED)
        self.assertEqual(res.cancellation_reason, 'No necesito viajar hoy')


class AccessibleSpaceTests(TestCase):
    """Las plazas accesibles solo las puede reservar quien tiene credencial verificada."""

    def setUp(self):
        self.client = APIClient()
        self.driver = User.objects.create_user(
            email='sin_credencial@test.com', password='password123',
            first_name='Ana', last_name='Ruiz', role=User.Role.DRIVER
        )
        self.permit_driver = User.objects.create_user(
            email='con_credencial@test.com', password='password123',
            first_name='Luis', last_name='Sosa', role=User.Role.DRIVER,
            roles=[User.Role.DISABLED]
        )
        self.parking = Parking.objects.create(
            name='Estacionamiento Accesible', address='Av. Corrientes 1000',
            city='Buenos Aires', latitude=-34.60, longitude=-58.38,
            price_per_hour=1000.00, opening_time=time(8, 0), closing_time=time(22, 0),
            capacity=5, is_active=True
        )
        self.accessible = ParkingSpace.objects.create(
            parking=self.parking, code='A01',
            space_type=ParkingSpace.SpaceType.DISABLED,
            status=ParkingSpace.Status.AVAILABLE
        )
        self.standard = ParkingSpace.objects.create(
            parking=self.parking, code='A02',
            status=ParkingSpace.Status.AVAILABLE
        )
        self.tomorrow = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')

    def _payload(self, space=None):
        payload = {
            'parking': self.parking.id, 'vehicle_plate': 'AB123CD',
            'date': self.tomorrow, 'start_time': '10:00', 'end_time': '12:00',
        }
        if space:
            payload['space'] = space.id
        return payload

    def test_sin_credencial_no_puede_reservar_plaza_accesible(self):
        self.client.force_authenticate(user=self.driver)
        response = self.client.post('/api/reservations/', self._payload(self.accessible), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Reservation.objects.filter(space=self.accessible).exists())

    def test_con_credencial_puede_reservar_plaza_accesible(self):
        self.client.force_authenticate(user=self.permit_driver)
        response = self.client.post('/api/reservations/', self._payload(self.accessible), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_autoasignacion_no_da_plaza_accesible_sin_credencial(self):
        self.client.force_authenticate(user=self.driver)
        response = self.client.post('/api/reservations/', self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.get().space, self.standard)

    def test_usuario_no_puede_activarse_la_credencial(self):
        self.client.force_authenticate(user=self.driver)
        self.client.patch('/api/auth/me/', {'roles': ['driver', 'disabled']}, format='json')
        self.assertFalse(User.objects.get(pk=self.driver.pk).has_role(User.Role.DISABLED))

    def test_autoasignacion_con_credencial_prefiere_plaza_comun(self):
        self.client.force_authenticate(user=self.permit_driver)
        response = self.client.post('/api/reservations/', self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Reservation.objects.get().space, self.standard)

    def test_sin_credencial_y_solo_quedan_accesibles_no_reserva(self):
        Reservation.objects.create(
            user=self.permit_driver, parking=self.parking, space=self.standard,
            vehicle_plate='ZZ999ZZ', date=self.tomorrow, start_time='10:00', end_time='12:00',
            total_hours=2, total_price=2000, status=Reservation.Status.CONFIRMED
        )
        self.client.force_authenticate(user=self.driver)
        response = self.client.post('/api/reservations/', self._payload(), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
