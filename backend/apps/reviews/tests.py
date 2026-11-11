from datetime import time

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from apps.parking.models import Parking
from apps.reviews.models import Review
from apps.users.models import User


class ReviewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.autor = User.objects.create_user(
            email='autor@test.com', password='password123', first_name='Ana', last_name='Ruiz')
        self.otro = User.objects.create_user(
            email='otro@test.com', password='password123', first_name='Leo', last_name='Paz')
        self.admin = User.objects.create_user(
            email='admin_rev@test.com', password='password123', first_name='Ad', last_name='Min',
            role=User.Role.ADMIN)
        self.parking = Parking.objects.create(
            name='P1', address='Calle 1', latitude=-34.6, longitude=-58.4,
            price_per_hour=1000, opening_time=time(7, 0), closing_time=time(23, 0))
        self.parking2 = Parking.objects.create(
            name='P2', address='Calle 2', latitude=-34.6, longitude=-58.4,
            price_per_hour=1000, opening_time=time(7, 0), closing_time=time(23, 0))
        self.r1 = Review.objects.create(user=self.autor, parking=self.parking, rating=5, comment='Bien')
        self.r2 = Review.objects.create(user=self.otro, parking=self.parking, rating=1, comment='Mal')

    def test_rating_se_recalcula_al_borrar(self):
        self.parking.refresh_from_db()
        self.assertEqual(self.parking.reviews_count, 2)
        self.assertEqual(self.parking.rating, 3.0)
        self.r2.delete()
        self.parking.refresh_from_db()
        self.assertEqual(self.parking.reviews_count, 1)
        self.assertEqual(self.parking.rating, 5.0)

    def test_no_se_puede_borrar_resena_ajena(self):
        self.client.force_authenticate(self.otro)
        resp = self.client.delete(f'/api/reviews/{self.r1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Review.objects.filter(id=self.r1.id).exists())

    def test_no_se_puede_editar_resena_ajena(self):
        self.client.force_authenticate(self.otro)
        resp = self.client.patch(f'/api/reviews/{self.r1.id}/', {'rating': 1}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_404_NOT_FOUND)
        self.r1.refresh_from_db()
        self.assertEqual(self.r1.rating, 5)

    def test_autor_borra_la_suya_y_el_rating_se_actualiza(self):
        self.client.force_authenticate(self.autor)
        resp = self.client.delete(f'/api/reviews/{self.r1.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.parking.refresh_from_db()
        self.assertEqual(self.parking.rating, 1.0)
        self.assertEqual(self.parking.reviews_count, 1)

    def test_admin_puede_borrar_cualquiera(self):
        self.client.force_authenticate(self.admin)
        resp = self.client.delete(f'/api/reviews/{self.r2.id}/')
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)

    def test_no_se_puede_mover_resena_a_otro_estacionamiento(self):
        self.client.force_authenticate(self.autor)
        resp = self.client.patch(f'/api/reviews/{self.r1.id}/', {'parking': self.parking2.id}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)
