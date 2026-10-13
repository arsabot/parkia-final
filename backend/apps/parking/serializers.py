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
    class Meta:
        model = Parking
        fields = '__all__'


class ParkingFavoriteSerializer(serializers.ModelSerializer):
    parking = ParkingListSerializer(read_only=True)

    class Meta:
        model = ParkingFavorite
        fields = ['id', 'parking', 'created_at']
        read_only_fields = ['id', 'created_at']
