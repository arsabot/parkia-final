from django.db import models
from django.conf import settings


class GreenPointLedger(models.Model):
    class TransactionType(models.TextChoices):
        EARNED = 'earned', 'Puntos sumados por reserva'
        REDEEMED = 'redeemed', 'Puntos canjeados por descuento'
        REFUNDED = 'refunded', 'Puntos descontados por reembolso/cancelación'
        RESTORED = 'restored', 'Puntos devueltos por cancelación'
        ADJUSTMENT = 'adjustment', 'Ajuste manual'

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='green_point_entries',
        verbose_name='Usuario'
    )
    reservation = models.ForeignKey(
        'reservations.Reservation',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='green_point_entries',
        verbose_name='Reserva asociada'
    )
    points = models.IntegerField('Puntos (+/-)')
    transaction_type = models.CharField(
        'Tipo de transacción',
        max_length=20,
        choices=TransactionType.choices,
        default=TransactionType.EARNED
    )
    description = models.CharField('Descripción', max_length=255, blank=True)
    created_at = models.DateTimeField('Fecha y hora', auto_now_add=True)

    class Meta:
        verbose_name = 'Movimiento de Green Points'
        verbose_name_plural = 'Libro de Green Points'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['reservation', 'transaction_type']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['reservation', 'transaction_type'],
                condition=models.Q(transaction_type='earned'),
                name='unique_earned_points_per_reservation'
            )
        ]

    def __str__(self):
        sign = '+' if self.points > 0 else ''
        return f"{self.user.email} | {sign}{self.points} pts ({self.get_transaction_type_display()})"


class GreenPointsDiscount(models.Model):
    reservation = models.OneToOneField(
        'reservations.Reservation',
        on_delete=models.CASCADE,
        related_name='green_points_discount',
        verbose_name='Reserva'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='green_points_discounts',
        verbose_name='Usuario'
    )
    points_redeemed = models.PositiveIntegerField('Puntos canjeados', default=100)
    original_price = models.DecimalField('Precio original ($)', max_digits=10, decimal_places=2)
    discount_amount = models.DecimalField('Monto de descuento ($)', max_digits=10, decimal_places=2)
    discount_percent = models.DecimalField('Porcentaje de descuento (%)', max_digits=5, decimal_places=2, default=10.00)
    final_price = models.DecimalField('Precio final pagado ($)', max_digits=10, decimal_places=2)
    created_at = models.DateTimeField('Fecha de aplicación', auto_now_add=True)

    class Meta:
        verbose_name = 'Descuento Green Points'
        verbose_name_plural = 'Descuentos Green Points'
        ordering = ['-created_at']

    def __str__(self):
        return f"Descuento {self.discount_percent}% en {self.reservation.booking_code} (-${self.discount_amount})"
