from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    reservation_id = serializers.IntegerField(source='reservation.id', read_only=True)
    booking_code = serializers.CharField(source='reservation.booking_code', read_only=True)
    is_paid = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            'id', 'reservation_id', 'booking_code', 'provider', 'external_reference',
            'checkout_url', 'status', 'status_detail', 'amount', 'currency',
            'expires_at', 'created_at', 'updated_at', 'is_paid',
        ]
        read_only_fields = fields

    def get_is_paid(self, payment):
        return payment.status == Payment.Status.APPROVED
