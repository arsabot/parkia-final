import random

from django.conf import settings
from django.db import models
from django.utils import timezone


class Claim(models.Model):
    class Category(models.TextChoices):
        PAYMENT = 'payment', 'Pago'
        RESERVATION = 'reservation', 'Reserva'
        GARAGE = 'garage', 'Garage o servicio'
        APP = 'app', 'App o web'
        OTHER = 'other', 'Otro'

    class Status(models.TextChoices):
        RECEIVED = 'received', 'Recibido'
        IN_REVIEW = 'in_review', 'En revisión'
        RESOLVED = 'resolved', 'Resuelto'

    code = models.CharField('código', max_length=20, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='claims')
    category = models.CharField('categoría', max_length=20, choices=Category.choices)
    reservation_ref = models.CharField('reserva', max_length=30, blank=True)
    description = models.TextField('descripción', max_length=1000)
    contact = models.CharField('contacto', max_length=120)
    status = models.CharField('estado', max_length=20, choices=Status.choices, default=Status.RECEIVED)
    response = models.TextField('respuesta del equipo', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'reclamo'
        verbose_name_plural = 'reclamos'

    def __str__(self):
        return self.code

    @staticmethod
    def _new_code():
        year = timezone.now().year
        while True:
            code = f'RC-{year}-{random.randint(10000, 99999)}'
            if not Claim.objects.filter(code=code).exists():
                return code

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = self._new_code()
        super().save(*args, **kwargs)
