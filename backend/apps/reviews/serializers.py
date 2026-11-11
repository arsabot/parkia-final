from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    parking_name = serializers.CharField(source='parking.name', read_only=True)

    class Meta:
        model = Review
        fields = [
            'id',
            'user',
            'user_name',
            'user_email',
            'parking',
            'parking_name',
            'rating',
            'comment',
            'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']

    def validate_parking(self, value):
        # Una reseña no se puede mover a otro estacionamiento al editarla
        if self.instance and value != self.instance.parking:
            raise serializers.ValidationError('No se puede cambiar el estacionamiento de una reseña.')
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
