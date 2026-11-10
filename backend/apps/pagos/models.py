from django.db import models


class Payment(models.Model):
    class Provider(models.TextChoices):
        MERCADO_PAGO = 'mercado_pago', 'Mercado Pago'

    class Status(models.TextChoices):
        CREATED = 'created', 'Creado'
        PENDING = 'pending', 'Pendiente'
        IN_PROCESS = 'in_process', 'En proceso'
        APPROVED = 'approved', 'Aprobado'
        REJECTED = 'rejected', 'Rechazado'
        CANCELLED = 'cancelled', 'Cancelado'
        REFUNDED = 'refunded', 'Reembolsado'
        EXPIRED = 'expired', 'Vencido'

    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='payment',
    )
    provider = models.CharField(max_length=30, choices=Provider.choices, default=Provider.MERCADO_PAGO)
    external_reference = models.CharField(max_length=64, unique=True)
    preference_id = models.CharField(max_length=120, blank=True)
    checkout_url = models.URLField(max_length=2048, blank=True)
    provider_payment_id = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.CREATED)
    status_detail = models.CharField(max_length=100, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='ARS')
    expires_at = models.DateTimeField(null=True, blank=True)
    provider_payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.get_provider_display()} · {self.external_reference} · {self.status}'
