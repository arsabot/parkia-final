from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class UsersAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')

    def test_user_registration(self):
        payload = {
            'first_name': 'Test',
            'last_name': 'Driver',
            'email': 'testdriver@parkia.com',
            'password': 'password123',
            'password_confirmation': 'password123',
            'role': 'driver',
            'phone': '+5491100000000'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertEqual(response.data['user']['email'], 'testdriver@parkia.com')

    def test_user_registration_password_mismatch(self):
        payload = {
            'first_name': 'Test',
            'last_name': 'Driver',
            'email': 'mismatch@parkia.com',
            'password': 'password123',
            'password_confirmation': 'different123',
            'role': 'driver'
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_login_success(self):
        User.objects.create_user(
            email='login@parkia.com',
            password='password123',
            first_name='Login',
            last_name='User'
        )
        response = self.client.post(self.login_url, {
            'email': 'login@parkia.com',
            'password': 'password123'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_user_me_authenticated(self):
        user = User.objects.create_user(
            email='me@parkia.com',
            password='password123',
            first_name='Me',
            last_name='Profile'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'me@parkia.com')
