from rest_framework import status, views, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer


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
