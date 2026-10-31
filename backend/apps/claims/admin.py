from django.contrib import admin

from .models import Claim


@admin.register(Claim)
class ClaimAdmin(admin.ModelAdmin):
    list_display = ('code', 'user', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    list_editable = ('status',)
    search_fields = ('code', 'user__email', 'reservation_ref', 'description')
    readonly_fields = ('code', 'user', 'created_at', 'updated_at')
