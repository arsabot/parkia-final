import re
import urllib.parse
from rest_framework import serializers
from .models import Parking, ParkingSpace, ParkingFavorite


class ParkingSpaceSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    space_type_display = serializers.CharField(source='get_space_type_display', read_only=True)

    class Meta:
        model = ParkingSpace
        fields = [
            'id',
            'parking',
            'code',
            'floor',
            'space_type',
            'space_type_display',
            'status',
            'status_display',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class ParkingListSerializer(serializers.ModelSerializer):
    available_spaces = serializers.IntegerField(source='available_spaces_count', read_only=True)
    total_spaces = serializers.IntegerField(source='total_spaces_count', read_only=True)
    occupancy_rate = serializers.FloatField(read_only=True)
    is_favorite = serializers.SerializerMethodField()
    owner_id = serializers.IntegerField(source='owner.id', read_only=True, allow_null=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True, allow_null=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = Parking
        fields = [
            'id',
            'name',
            'address',
            'city',
            'latitude',
            'longitude',
            'description',
            'phone',
            'owner_id',
            'owner_email',
            'owner_name',
            'price_per_hour',
            'price_per_day',
            'opening_time',
            'closing_time',
            'is_24_hours',
            'capacity',
            'rating',
            'reviews_count',
            'is_active',
            'is_covered',
            'has_security',
            'has_ev_charging',
            'has_disabled_access',
            'has_car_wash',
            'has_valet',
            'image_url',
            'available_spaces',
            'total_spaces',
            'occupancy_rate',
            'is_favorite',
        ]

    def get_is_favorite(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.favorited_by.filter(user=request.user).exists()
        return False


class ParkingDetailSerializer(ParkingListSerializer):
    spaces = ParkingSpaceSerializer(many=True, read_only=True)

    class Meta(ParkingListSerializer.Meta):
        fields = ParkingListSerializer.Meta.fields + ['gallery', 'spaces']


class ParkingCreateUpdateSerializer(serializers.ModelSerializer):
    owner_email = serializers.EmailField(required=False, allow_blank=True, allow_null=True, write_only=True)

    class Meta:
        model = Parking
        fields = '__all__'

    def validate_image_url(self, value):
        if not value:
            return value
        clean_val = value.strip()
        parsed = urllib.parse.urlparse(clean_val)
        if parsed.scheme not in ('http', 'https'):
            raise serializers.ValidationError('La URL de la imagen debe comenzar con http:// o https://.')
        path_lower = parsed.path.lower()
        is_valid_ext = any(path_lower.endswith(ext) for ext in ('.jpg', '.jpeg', '.png', '.webp')) or ('unsplash.com' in parsed.netloc and '/photo-' in path_lower)
        if not is_valid_ext and not re.search(r'\.(jpg|jpeg|png|webp)($|\?)', clean_val, re.IGNORECASE):
            raise serializers.ValidationError('La URL debe ser un enlace directo a una imagen válida (.jpg, .jpeg o .png).')
        return clean_val

    def _handle_owner_email(self, validated_data):
        from apps.users.models import User
        if 'owner_email' in validated_data:
            email = validated_data.pop('owner_email')
            if email and email.strip():
                email_clean = email.strip()
                owner_user = User.objects.filter(email__iexact=email_clean).first()
                if not owner_user:
                    # Crear usuario dueño preliminar si aún no existe
                    owner_user = User.objects.create_user(
                        email=email_clean,
                        password='password123',
                        first_name='Dueño',
                        last_name=validated_data.get('name', 'Garaje'),
                        role=User.Role.OWNER
                    )
                else:
                    if not owner_user.has_role(User.Role.OWNER) and not owner_user.is_superuser:
                        owner_user.set_main_role(User.Role.OWNER)
                validated_data['owner'] = owner_user
            else:
                validated_data['owner'] = None
        return validated_data

    def create(self, validated_data):
        validated_data = self._handle_owner_email(validated_data)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data = self._handle_owner_email(validated_data)
        return super().update(instance, validated_data)


class ParkingFavoriteSerializer(serializers.ModelSerializer):
    parking = ParkingListSerializer(read_only=True)

    class Meta:
        model = ParkingFavorite
        fields = ['id', 'parking', 'created_at']
        read_only_fields = ['id', 'created_at']
