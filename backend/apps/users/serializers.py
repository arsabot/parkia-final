from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    # Rol principal (driver, owner o admin), calculado desde la tabla UserRole
    role = serializers.CharField(read_only=True)
    # Todos los roles del usuario, por ejemplo ['driver', 'disabled'].
    # 'disabled' habilita las plazas accesibles y solo lo asigna un administrador.
    roles = serializers.ListField(source='role_codes', child=serializers.CharField(), read_only=True)

    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'first_name',
            'last_name',
            'full_name',
            'role',
            'roles',
            'phone',
            'avatar_url',
            'cud_number',
            'cud_verified',
            'cud_expiration',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'full_name']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.email


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirmation = serializers.CharField(write_only=True, min_length=6)
    # Al registrarse se puede elegir ser conductor o dueño.
    # Además se puede solicitar el rol 'disabled' (acceso a plazas accesibles) mediante CUD.
    role = serializers.ChoiceField(
        choices=[User.Role.DRIVER, User.Role.OWNER],
        required=False,
        default=User.Role.DRIVER,
    )
    has_disability_permit = serializers.BooleanField(required=False, default=False)
    cud_number = serializers.CharField(required=False, allow_blank=True, max_length=50)
    cud_dni = serializers.CharField(required=False, allow_blank=True, max_length=20)
    cud_expiration = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'first_name',
            'last_name',
            'email',
            'password',
            'password_confirmation',
            'role',
            'phone',
            'has_disability_permit',
            'cud_number',
            'cud_dni',
            'cud_expiration',
        ]

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({'password_confirmation': 'Las contraseñas no coinciden.'})

        if data.get('has_disability_permit'):
            cud_num = (data.get('cud_number') or '').strip()
            if not cud_num:
                raise serializers.ValidationError({
                    'cud_number': 'El número de CUD es obligatorio para solicitar acceso a plazas accesibles.'
                })
            if len(cud_num) < 6:
                raise serializers.ValidationError({
                    'cud_number': 'El número de CUD debe contener al menos 6 caracteres o dígitos.'
                })

            exp = data.get('cud_expiration')
            if exp:
                import datetime
                if exp < datetime.date.today():
                    raise serializers.ValidationError({
                        'cud_expiration': 'El certificado CUD ingresado está vencido.'
                    })
        return data

    def create(self, validated_data):
        has_disability_permit = validated_data.pop('has_disability_permit', False)
        cud_number = validated_data.pop('cud_number', None)
        cud_dni = validated_data.pop('cud_dni', None)
        cud_expiration = validated_data.pop('cud_expiration', None)
        validated_data.pop('password_confirmation')

        extra_roles = []
        if has_disability_permit and cud_number:
            extra_roles.append('disabled')

        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            role=validated_data.get('role', User.Role.DRIVER),
            roles=extra_roles,
            phone=validated_data.get('phone', ''),
            cud_number=cud_number.strip() if cud_number else None,
            cud_verified=bool(has_disability_permit and cud_number),
            cud_expiration=cud_expiration,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email', '').strip().lower()
        password = data.get('password')

        if not email or not password:
            raise serializers.ValidationError('Debe ingresar correo y contraseña.')

        user = authenticate(request=self.context.get('request'), username=email, password=password)
        if not user:
            # Check if user exists to provide clean error
            if not User.objects.filter(email=email).exists():
                raise serializers.ValidationError('No existe ninguna cuenta registrada con este correo.')
            raise serializers.ValidationError('Contraseña incorrecta.')

        if not user.is_active:
            raise serializers.ValidationError('Esta cuenta de usuario ha sido desactivada.')

        data['user'] = user
        return data


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        return value.strip().lower()


class PasswordResetValidateSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, data):
        uid = data.get('uid')
        token = data.get('token')

        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError('El enlace de recuperación no es válido.')

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError('El enlace ha expirado o ya fue utilizado.')

        data['user'] = user
        return data


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirmation = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        if data['password'] != data['password_confirmation']:
            raise serializers.ValidationError({'password_confirmation': 'Las contraseñas no coinciden.'})

        uid = data.get('uid')
        token = data.get('token')

        try:
            uid_decoded = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=uid_decoded)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            raise serializers.ValidationError({'uid': 'El usuario o enlace no es válido.'})

        if not default_token_generator.check_token(user, token):
            raise serializers.ValidationError({'token': 'El enlace ha expirado o ya fue utilizado.'})

        data['user'] = user
        return data
