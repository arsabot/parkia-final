from django.contrib import admin

from .models import Role, User, UserRole


class UserRoleInline(admin.TabularInline):
    """Roles del usuario (tabla intermedia). Acá el admin suma o saca roles,
    por ejemplo 'disabled' cuando verifica la credencial de discapacidad."""
    model = UserRole
    extra = 1
    autocomplete_fields = ('role',)
    readonly_fields = ('assigned_at',)


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'roles_list', 'cud_verified', 'cud_number')
    list_filter = ('roles', 'cud_verified')
    search_fields = ('email', 'first_name', 'last_name', 'cud_number')
    fields = ('email', 'first_name', 'last_name', 'phone', 'cud_number', 'cud_verified', 'cud_expiration', 'is_active')
    inlines = [UserRoleInline]

    @admin.display(description='Roles')
    def roles_list(self, obj):
        return ', '.join(obj.roles.values_list('name', flat=True))


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'description')
    search_fields = ('code', 'name')


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ('user', 'role', 'assigned_at')
    list_filter = ('role',)
    search_fields = ('user__email',)
