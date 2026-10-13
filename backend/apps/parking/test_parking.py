from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.parking.models import Parking, ParkingSpace, ParkingFavorite


class ParkingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            email='admin_p_test@test.com',
            password='password123',
            first_name='Admin',
            last_name='Test',
            role=User.Role.ADMIN
        )
        self.driver = User.objects.create_user(
            email='driver_p_test@test.com',
            password='password123',
            first_name='Driver',
            last_name='Test',
            role=User.Role.DRIVER
        )
        self.parking = Parking.objects.create(
            name='Estacionamiento Centro Test',
            address='Av. Santa Fe 1234',
            city='Buenos Aires',
            latitude=-34.5900,
            longitude=-58.3900,
            price_per_hour=1500.00,
            opening_time='08:00:00',
            closing_time='22:00:00',
            capacity=10,
            is_active=True,
            is_covered=True,
            has_security=True
        )
        self.space1 = ParkingSpace.objects.create(
            parking=self.parking,
            code='A01',
            status=ParkingSpace.Status.AVAILABLE
        )

    def test_list_parkings_public(self):
        response = self.client.get('/api/parking/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Estacionamiento Centro Test')

    def test_filter_parking_by_price(self):
        res1 = self.client.get('/api/parking/?max_price=2000')
        self.assertEqual(len(res1.data), 1)

        res2 = self.client.get('/api/parking/?max_price=1000')
        self.assertEqual(len(res2.data), 0)

    def test_toggle_favorite(self):
        self.client.force_authenticate(user=self.driver)
        res1 = self.client.post(f'/api/parking/{self.parking.id}/toggle_favorite/')
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertTrue(res1.data['is_favorite'])
        self.assertTrue(ParkingFavorite.objects.filter(user=self.driver, parking=self.parking).exists())

        res2 = self.client.post(f'/api/parking/{self.parking.id}/toggle_favorite/')
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertFalse(res2.data['is_favorite'])
        self.assertFalse(ParkingFavorite.objects.filter(user=self.driver, parking=self.parking).exists())

    def test_admin_create_parking(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            'name': 'Nuevo Parking Admin',
            'address': 'Calle Falsa 123',
            'city': 'Buenos Aires',
            'latitude': -34.6000,
            'longitude': -58.4000,
            'price_per_hour': '2000.00',
            'opening_time': '07:00:00',
            'closing_time': '23:00:00',
            'capacity': 15,
            'is_active': True
        }
        res = self.client.post('/api/parking/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_driver_cannot_create_parking(self):
        self.client.force_authenticate(user=self.driver)
        payload = {
            'name': 'Parking No Permitido',
            'address': 'Calle 123',
            'city': 'Buenos Aires',
            'latitude': -34.6000,
            'longitude': -58.4000,
            'price_per_hour': '2000.00',
            'capacity': 15
        }
        res = self.client.post('/api/parking/', payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
