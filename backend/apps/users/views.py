from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import EmailMultiAlternatives
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    PasswordResetRequestSerializer,
    PasswordResetValidateSerializer,
    PasswordResetConfirmSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


class RegisterView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Usuario registrado exitosamente.',
                'user': user_data,
                'tokens': tokens
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            tokens = get_tokens_for_user(user)
            user_data = UserSerializer(user).data
            return Response({
                'message': 'Inicio de sesión exitoso.',
                'user': user_data,
                'tokens': tokens
            }, status=status.HTTP_200_OK)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


class DemoLoginView(views.APIView):
    """
    Endpoint rápido para loguearse con perfiles demo preconfigurados:
    - 'admin': Super Administrador de la plataforma (Ariel)
    - 'owner': Dueño / Operador de Estacionamiento (Control de accesos, QR, plazas, caja)
    - 'driver': Conductor (Búsqueda, reserva, pase QR)
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        role = request.data.get('role', 'driver')
        if role == 'admin':
            email = 'admin@parkia.com'
            first_name = 'Ariel'
            last_name = 'Super Admin'
            user_role = User.Role.ADMIN
        elif role == 'owner':
            email = 'dueno@parkia.com'
            first_name = 'Roberto'
            last_name = 'Garaje Central'
            user_role = User.Role.OWNER
        else:
            email = 'conductor@parkia.com'
            first_name = 'Carlos'
            last_name = 'Conductor'
            user_role = User.Role.DRIVER

        user = User.objects.filter(email=email).first()
        if not user:
            user = User.objects.create_user(
                email=email,
                password='password123',
                first_name=first_name,
                last_name=last_name,
                role=user_role,
                phone='+54 9 11 5555-0199'
            )
        else:
            # Asegurar que el rol corresponda
            if user.role != user_role:
                user.role = user_role
                user.save()

        # Si es dueño de garaje demo, asegurar asignación de su estacionamiento
        if user_role == User.Role.OWNER:
            from apps.parking.models import Parking
            parking = Parking.objects.filter(id=1).first()
            if parking and parking.owner != user:
                parking.owner = user
                parking.save()

        tokens = get_tokens_for_user(user)
        user_data = UserSerializer(user).data
        return Response({
            'message': f'Acceso como demo {role} correcto.',
            'user': user_data,
            'tokens': tokens
        }, status=status.HTTP_200_OK)


class PasswordResetRequestView(views.APIView):
    """
    Solicita restablecimiento de contraseña enviando un correo al usuario
    con un enlace de un solo uso que contiene UID y Token.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()

        dev_reset_url = None
        if user and user.is_active:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
            reset_url = f"{frontend_url}/reset-password?uid={uid}&token={token}"

            text_content = f"""Hola {user.first_name or 'Usuario'},

Has solicitado restablecer la contraseña de tu cuenta en PARKIA.

Para elegir una nueva contraseña, haz clic en el siguiente enlace:
{reset_url}

Este enlace es válido por tiempo limitado. Si tú no realizaste esta solicitud, puedes ignorar este correo; tu contraseña actual continuará siendo la misma.

Saludos,
El equipo de PARKIA
"""

            html_content = f"""
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="utf-8">
              <style>
                body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
                .card {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
                .header {{ background: #0f172a; padding: 28px; text-align: center; }}
                .header h1 {{ color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 1px; }}
                .header p {{ color: #94a3b8; margin: 4px 0 0; font-size: 13px; }}
                .body {{ padding: 32px 28px; }}
                .btn {{ display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; font-size: 15px; margin: 20px 0; }}
                .footer {{ border-top: 1px solid #f1f5f9; padding: 20px 28px; font-size: 12px; color: #64748b; text-align: center; background: #f8fafc; }}
              </style>
            </head>
            <body>
              <div class="card">
                <div class="header">
                  <h1>🚗 PARKIA</h1>
                  <p>Plataforma Inteligente de Estacionamiento</p>
                </div>
                <div class="body">
                  <h2 style="font-size: 20px; color: #0f172a; margin-top: 0;">Recuperación de Contraseña</h2>
                  <p>Hola <strong>{user.first_name or 'Usuario'}</strong>,</p>
                  <p>Recibimos una solicitud para restablecer la contraseña asociada a tu cuenta (<strong>{user.email}</strong>).</p>
                  <div style="text-align: center;">
                    <a href="{reset_url}" class="btn" target="_blank">Restablecer mi Contraseña</a>
                  </div>
                  <p style="font-size: 13px; color: #64748b;">Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                  <p style="font-size: 12px; word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 6px;"><a href="{reset_url}" style="color: #2563eb;">{reset_url}</a></p>
                  <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Si tú no solicitaste este cambio, puedes ignorar este correo de forma segura. Tu contraseña actual no se modificará.</p>
                </div>
                <div class="footer">
                  © 2026 PARKIA. Todos los derechos reservados.
                </div>
              </div>
            </body>
            </html>
            """

            subject = "Recuperación de contraseña - PARKIA"
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'PARKIA <no-reply@parkia.com>')
            msg = EmailMultiAlternatives(subject, text_content, from_email, [user.email])
            msg.attach_alternative(html_content, "text/html")
            try:
                msg.send(fail_silently=False)
            except Exception as e:
                print(f"[Email send warning]: {e}")

            dev_reset_url = reset_url

        return Response({
            'message': 'Si tu correo electrónico está registrado, recibirás un enlace para restablecer tu contraseña.',
            'dev_reset_url': dev_reset_url if settings.DEBUG else None
        }, status=status.HTTP_200_OK)


class PasswordResetValidateView(views.APIView):
    """
    Valida si el token y uid son correctos y no han expirado.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetValidateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            return Response({
                'valid': True,
                'email': user.email
            }, status=status.HTTP_200_OK)
        return Response({
            'valid': False,
            'message': serializer.errors.get('non_field_errors', ['Enlace inválido o expirado'])[0]
        }, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(views.APIView):
    """
    Aplica la nueva contraseña del usuario una vez verificado el token y uid.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            new_password = serializer.validated_data['password']
            user.set_password(new_password)
            user.save()
            return Response({
                'message': 'Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave.'
            }, status=status.HTTP_200_OK)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
