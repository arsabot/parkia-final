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



def recalcular_rating(parking):
    """Recalcula el promedio y la cantidad de reseñas de un estacionamiento.
    Se llama desde las señales de signals.py, así queda bien también cuando
    una reseña se edita o se borra (antes solo se hacía en save())."""
    reviews = Review.objects.filter(parking=parking)
    avg = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 5.0
    parking.rating = round(avg, 1)
    parking.reviews_count = reviews.count()
    parking.save(update_fields=['rating', 'reviews_count'])
