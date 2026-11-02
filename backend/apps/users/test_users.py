from django.test import TestCase
from django.urls import reverse
from django.core import mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User


class UsersAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('auth-register')
        self.login_url = reverse('auth-login')
        self.me_url = reverse('auth-me')
        self.password_reset_request_url = reverse('auth-password-reset-request')
        self.password_reset_validate_url = reverse('auth-password-reset-validate')
        self.password_reset_confirm_url = reverse('auth-password-reset-confirm')

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

    def test_password_reset_flow(self):
        # 1. Create a user
        user = User.objects.create_user(
            email='olvidado@parkia.com',
            password='oldpassword123',
            first_name='Juan',
            last_name='Pérez'
        )

        # 2. Request password reset
        mail.outbox = []
        response = self.client.post(self.password_reset_request_url, {
            'email': 'olvidado@parkia.com'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('olvidado@parkia.com', mail.outbox[0].to)
        self.assertIn('Recuperación de contraseña', mail.outbox[0].subject)

        # Extract uid and token generated for the user
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # 3. Validate token
        val_response = self.client.post(self.password_reset_validate_url, {
            'uid': uid,
            'token': token
        }, format='json')
        self.assertEqual(val_response.status_code, status.HTTP_200_OK)
        self.assertTrue(val_response.data.get('valid'))

        # 4. Confirm password reset with mismatch (should fail)
        bad_confirm_res = self.client.post(self.password_reset_confirm_url, {
            'uid': uid,
            'token': token,
            'password': 'newpassword123',
            'password_confirmation': 'wrongpassword123'
        }, format='json')
        self.assertEqual(bad_confirm_res.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Confirm password reset with matching passwords (should succeed)
        confirm_res = self.client.post(self.password_reset_confirm_url, {
            'uid': uid,
            'token': token,
            'password': 'newpassword123',
            'password_confirmation': 'newpassword123'
        }, format='json')
        self.assertEqual(confirm_res.status_code, status.HTTP_200_OK)

        # 6. Verify old password no longer works, new password works
        old_login_res = self.client.post(self.login_url, {
            'email': 'olvidado@parkia.com',
            'password': 'oldpassword123'
        }, format='json')
        self.assertEqual(old_login_res.status_code, status.HTTP_400_BAD_REQUEST)

        new_login_res = self.client.post(self.login_url, {
            'email': 'olvidado@parkia.com',
            'password': 'newpassword123'
        }, format='json')
        self.assertEqual(new_login_res.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', new_login_res.data)

        # 7. Token cannot be reused
        reused_res = self.client.post(self.password_reset_validate_url, {
            'uid': uid,
            'token': token
        }, format='json')
        self.assertEqual(reused_res.status_code, status.HTTP_400_BAD_REQUEST)
