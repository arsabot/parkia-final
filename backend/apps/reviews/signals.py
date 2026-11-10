from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from .models import Review, recalcular_rating


@receiver(post_save, sender=Review)
def review_guardada(sender, instance, **kwargs):
    recalcular_rating(instance.parking)


@receiver(post_delete, sender=Review)
def review_borrada(sender, instance, **kwargs):
    # Si el estacionamiento se está borrando entero (CASCADE), no hay nada que recalcular
    from apps.parking.models import Parking
    if Parking.objects.filter(pk=instance.parking_id).exists():
        recalcular_rating(instance.parking)
