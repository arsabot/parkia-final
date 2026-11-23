from rest_framework import serializers
from .models import GreenPointLedger, GreenPointsDiscount


class GreenPointLedgerSerializer(serializers.ModelSerializer):
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    booking_code = serializers.CharField(source='reservation.booking_code', read_only=True, default=None)
    parking_name = serializers.CharField(source='reservation.parking.name', read_only=True, default=None)

    class Meta:
        model = GreenPointLedger
        fields = [
            'id',
            'points',
            'transaction_type',
            'transaction_type_display',
            'description',
            'booking_code',
            'parking_name',
            'created_at',
        ]


class GreenPointsDiscountSerializer(serializers.ModelSerializer):
    booking_code = serializers.CharField(source='reservation.booking_code', read_only=True)

    class Meta:
        model = GreenPointsDiscount
        fields = [
            'id',
            'booking_code',
            'points_redeemed',
            'original_price',
            'discount_amount',
            'discount_percent',
            'final_price',
            'created_at',
        ]
