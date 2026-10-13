from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from apps.parking.models import Parking


class Review(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    parking = models.ForeignKey(Parking, on_delete=models.CASCADE, related_name='reviews')
    rating = models.IntegerField('Puntuación (1-5)', validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField('Comentario')
    created_at = models.DateTimeField('Fecha de reseña', auto_now_add=True)

    class Meta:
        verbose_name = 'Reseña'
        verbose_name_plural = 'Reseñas'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.email} - {self.parking.name} ({self.rating}★)"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Recalcular promedio de calificación del estacionamiento
        reviews = Review.objects.filter(parking=self.parking)
        avg = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 5.0
        self.parking.rating = round(avg, 1)
        self.parking.reviews_count = reviews.count()
        self.parking.save(update_fields=['rating', 'reviews_count'])
