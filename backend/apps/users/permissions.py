from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsSuperAdmin(BasePermission):
    """
    Permite acceso únicamente al Super Administrador de la plataforma (Ariel).
    Es quien crea, da de alta o baja estacionamientos.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser or request.user.is_staff)
        )


class IsParkingOwnerOrAdmin(BasePermission):
    """
    Permite acceso tanto a Dueños de Estacionamiento (Operadores de Garita) como al Super Admin.
    Para operar QR, ingresos/egresos, ver plazas y caja.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'owner'] or request.user.is_superuser or request.user.is_staff)
        )


class IsAdminRole(BasePermission):
    """
    Compatibilidad: permite acceso a administradores o dueños.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'owner'] or request.user.is_superuser or request.user.is_staff)
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Lectura libre para cualquiera, modificación (alta/baja de parkings) solo para Super Administrador.
    """
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.role == 'admin' or request.user.is_superuser or request.user.is_staff)
        )


class IsOwnerOrAdmin(BasePermission):
    """
    Permite acceso solo al dueño del objeto o a un administrador.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.role in ['admin', 'owner'] or request.user.is_superuser:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False
