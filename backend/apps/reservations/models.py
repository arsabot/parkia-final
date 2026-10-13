import random
import string
from django.db import models
from django.conf import settings
from apps.parking.models import Parking, ParkingSpace


def generate_booking_code():
    chars = string.ascii_uppercase + string.digits
    suffix = ''.join(random.choices(chars, k=6))
    return f"PK-{suffix}"


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pendiente'
        CONFIRMED = 'confirmed', 'Confirmada'
        CANCELLED = 'cancelled', 'Cancelada'
        COMPLETED = 'completed', 'Finalizada'

    booking_code = models.CharField('Código de Reserva', max_length=20, unique=True, default=generate_booking_code)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reservations')
    parking = models.ForeignKey(Parking, on_delete=models.CASCADE, related_name='reservations')
    space = models.ForeignKey(ParkingSpace, on_delete=models.SET_NULL, null=True, blank=True, related_name='reservations')
    
    vehicle_plate = models.CharField('Patente / Matrícula', max_length=20, default='AA000XX')
    vehicle_model = models.CharField('Marca / Modelo del vehículo', max_length=100, blank=True)
    
    date = models.DateField('Fecha de reserva')
    start_time = models.TimeField('Hora de entrada')
    end_time = models.TimeField('Hora de salida')
    
    total_hours = models.DecimalField('Horas estimadas', max_digits=5, decimal_places=2, default=1.0)
    total_price = models.DecimalField('Precio total ($)', max_digits=10, decimal_places=2)
    
    status = models.CharField('Estado', max_length=20, choices=Status.choices, default=Status.CONFIRMED)
    cancellation_reason = models.TextField('Motivo de cancelación', blank=True, null=True)

    # Registro de Ingreso / Egreso y Finanzas
    check_in_time = models.DateTimeField('Hora real de ingreso', blank=True, null=True)
    check_out_time = models.DateTimeField('Hora real de egreso', blank=True, null=True)
    payment_status = models.CharField('Estado del Pago', max_length=20, default='paid', choices=[
        ('pending', 'Pendiente de cobro'),
        ('paid', 'Cobrado / Pagado'),
        ('refunded', 'Reembolsado')
    ])
    payment_method = models.CharField('Medio de Pago', max_length=30, default='Efectivo', choices=[
        ('Efectivo', 'Efectivo en Garita'),
        ('Mercado Pago', 'Mercado Pago (QR)'),
        ('Tarjeta Débito', 'Tarjeta de Débito'),
        ('Tarjeta Crédito', 'Tarjeta de Crédito'),
        ('Transferencia', 'Transferencia Bancaria')
    ])
    staff_notes = models.CharField('Notas del Operador', max_length=255, blank=True, default='')

    created_at = models.DateTimeField('Fecha de creación', auto_now_add=True)
    updated_at = models.DateTimeField('Última actualización', auto_now=True)

    class Meta:
        verbose_name = 'Reserva'
        verbose_name_plural = 'Reservas'
        ordering = ['-date', '-start_time']

    def __str__(self):
        return f"{self.booking_code} | {self.user.email} -> {self.parking.name} ({self.date} {self.start_time}-{self.end_time})"

    def save(self, *args, **kwargs):
        if not self.booking_code:
            self.booking_code = generate_booking_code()
        super().save(*args, **kwargs)
