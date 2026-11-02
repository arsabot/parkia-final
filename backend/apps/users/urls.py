from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    LoginView,
    MeView,
    DemoLoginView,
    PasswordResetRequestView,
    PasswordResetValidateView,
    PasswordResetConfirmView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('me/', MeView.as_view(), name='auth-me'),
    path('demo-login/', DemoLoginView.as_view(), name='auth-demo-login'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='auth-password-reset-request'),
    path('password-reset/validate/', PasswordResetValidateView.as_view(), name='auth-password-reset-validate'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
]
