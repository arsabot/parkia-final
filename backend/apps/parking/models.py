from django.db import models
from django.conf import settings


class Parking(models.Model):
    name = models.CharField('Nombre del estacionamiento', max_length=200)
    address = models.CharField('Dirección', max_length=255)
    city = models.CharField('Ciudad', max_length=100, default='Buenos Aires')
    latitude = models.FloatField('Latitud')
    longitude = models.FloatField('Longitud')
    description = models.TextField('Descripción detallada', blank=True)
    phone = models.CharField('Teléfono de contacto', max_length=50, blank=True)

    # Owner / Operator relationship
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_parkings',
        verbose_name='Dueño / Operador responsable'
    )

    # Pricing & Hours
    price_per_hour = models.DecimalField('Precio por hora ($)', max_digits=10, decimal_places=2)
    price_per_day = models.DecimalField('Precio por estadía/día ($)', max_digits=10, decimal_places=2, null=True, blank=True)
    opening_time = models.TimeField('Hora de apertura', default='07:00:00')
    closing_time = models.TimeField('Hora de cierre', default='23:00:00')
    is_24_hours = models.BooleanField('Abierto 24 Horas', default=False)
    
    # Capacity & Stats
    capacity = models.PositiveIntegerField('Capacidad total', default=30)
    rating = models.FloatField('Calificación promedio', default=4.8)
    reviews_count = models.PositiveIntegerField('Cantidad de reseñas', default=0)
    is_active = models.BooleanField('Activo en la plataforma', default=True)

    # Amenities & Services
    is_covered = models.BooleanField('Techado / Cubierto', default=True)
    has_security = models.BooleanField('Seguridad / CCTV 24hs', default=True)
    has_ev_charging = models.BooleanField('Carga para autos eléctricos', default=False)
    has_disabled_access = models.BooleanField('Accesibilidad / Movilidad reducida', default=True)
    has_car_wash = models.BooleanField('Lavado de autos', default=False)
    has_valet = models.BooleanField('Servicio de Valet Parking', default=False)

    # Media
    image_url = models.URLField('Imagen principal', max_length=500, blank=True)
    gallery = models.JSONField('Galería de imágenes', default=list, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Estacionamiento'
        verbose_name_plural = 'Estacionamientos'
        ordering = ['-rating', 'name']

    def __str__(self):
        return f"{self.name} - {self.address} (${self.price_per_hour}/h)"

    @property
    def available_spaces_count(self):
        return self.spaces.filter(status=ParkingSpace.Status.AVAILABLE).count()

    @property
    def total_spaces_count(self):
        return self.spaces.count() or self.capacity

    @property
    def occupancy_rate(self):
        total = self.total_spaces_count
        if total == 0:
            return 0
        occupied_or_reserved = self.spaces.filter(
            status__in=[ParkingSpace.Status.OCCUPIED, ParkingSpace.Status.RESERVED]
        ).count()
        return round((occupied_or_reserved / total) * 100, 1)


class ParkingSpace(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = 'available', 'Disponible'
        OCCUPIED = 'occupied', 'Ocupado'
        RESERVED = 'reserved', 'Reservado'
        MAINTENANCE = 'maintenance', 'Fuera de servicio'

    class SpaceType(models.TextChoices):
        STANDARD = 'standard', 'Estándar'
        DISABLED = 'disabled', 'Accesible'
        EV = 'ev', 'Eléctrico'
        LARGE = 'large', 'Camioneta / Grande'

    parking = models.ForeignKey(Parking, on_delete=models.CASCADE, related_name='spaces')
    code = models.CharField('Código de espacio', max_length=20)  # e.g. A01, B02
    floor = models.CharField('Piso / Sector', max_length=50, default='Planta Baja')
    space_type = models.CharField('Tipo de espacio', max_length=20, choices=SpaceType.choices, default=SpaceType.STANDARD)
    status = models.CharField('Estado', max_length=20, choices=Status.choices, default=Status.AVAILABLE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Espacio de Estacionamiento'
        verbose_name_plural = 'Espacios de Estacionamiento'
        unique_together = ('parking', 'code')
        ordering = ['parking', 'code']

    def __str__(self):
        return f"{self.parking.name} - Espacio {self.code} ({self.get_status_display()})"


class ParkingFavorite(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='favorites')
    parking = models.ForeignKey(Parking, on_delete=models.CASCADE, related_name='favorited_by')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Favorito'
        verbose_name_plural = 'Favoritos'
        unique_together = ('user', 'parking')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} -> {self.parking.name}"
