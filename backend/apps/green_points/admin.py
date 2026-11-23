from django.contrib import admin
from .models import GreenPointLedger, GreenPointsDiscount


@admin.register(GreenPointLedger)
class GreenPointLedgerAdmin(admin.ModelAdmin):
    list_display = ('user', 'points', 'transaction_type', 'reservation', 'created_at')
    list_filter = ('transaction_type', 'created_at')
    search_fields = ('user__email', 'reservation__booking_code', 'description')
    ordering = ('-created_at',)


@admin.register(GreenPointsDiscount)
class GreenPointsDiscountAdmin(admin.ModelAdmin):
    list_display = ('reservation', 'user', 'points_redeemed', 'discount_percent', 'discount_amount', 'final_price', 'created_at')
    list_filter = ('discount_percent', 'created_at')
    search_fields = ('reservation__booking_code', 'user__email')
    ordering = ('-created_at',)
