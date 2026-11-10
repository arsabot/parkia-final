from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['external_reference', 'reservation', 'amount', 'status', 'provider_payment_id', 'created_at']
    list_filter = ['provider', 'status']
    search_fields = ['external_reference', 'reservation__booking_code', 'provider_payment_id']
    readonly_fields = ['created_at', 'updated_at', 'provider_payload']
