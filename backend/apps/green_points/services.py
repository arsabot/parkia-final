from decimal import Decimal
from datetime import date, datetime
from django.conf import settings
from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from .models import GreenPointLedger, GreenPointsDiscount


def get_user_points_balance(user) -> int:
    """Calcula el saldo neto actual de Green Points del usuario (nunca negativo)."""
    if not user or not user.is_authenticated:
        return 0
    total = GreenPointLedger.objects.filter(user=user).aggregate(total=Sum('points'))['total'] or 0
    return max(0, total)


def sync_user_points(user):
    """
    Sincroniza y calcula los puntos acumulados por reservas terminadas con check-in,
    y ajusta cancelaciones o reembolsos según las reglas del sistema.
    Reglas:
    - 10 Green Points por reserva con check-in validado que haya finalizado.
    - No se suman si no hubo check-in o si fue cancelada/reembolsada.
    - No se suman dos veces la misma reserva.
    - Si se cancela o reembolsa una reserva que sumó puntos, se descuentan sin dejar saldo negativo.
    - Si se cancela o reembolsa una reserva donde se usó el descuento de 100 puntos, se reintegran los 100 puntos.
    """
    if not user or not user.is_authenticated:
        return

    from apps.reservations.models import Reservation

    now = timezone.now()
    today = now.date()
    now_time = now.time()

    points_per_reservation = getattr(settings, 'GREEN_POINTS_PER_RESERVATION', 10)
    redemption_threshold = getattr(settings, 'GREEN_POINTS_REDEMPTION_THRESHOLD', 100)

    with transaction.atomic():
        # 1. Sumar puntos para reservas terminadas con check-in
        # Una reserva se considera terminada si su estado es COMPLETED o si su fecha/hora de fin ya transcurrió
        user_reservations = Reservation.objects.filter(
            user=user,
            check_in_time__isnull=False
        ).exclude(
            status=Reservation.Status.CANCELLED
        ).exclude(
            payment_status='refunded'
        )

        for res in user_reservations:
            # Verificar si ya finalizó
            is_finished = (
                res.status == Reservation.Status.COMPLETED or
                res.date < today or
                (res.date == today and res.end_time <= now_time)
            )
            if not is_finished:
                continue

            # Verificar si ya se le otorgaron puntos por esta reserva
            already_earned = GreenPointLedger.objects.filter(
                reservation=res,
                transaction_type=GreenPointLedger.TransactionType.EARNED
            ).exists()

            if not already_earned:
                GreenPointLedger.objects.create(
                    user=user,
                    reservation=res,
                    points=points_per_reservation,
                    transaction_type=GreenPointLedger.TransactionType.EARNED,
                    description=f"Reserva completada con check-in en {res.parking.name} ({res.booking_code})"
                )

        # 2. Descontar puntos de reservas que sumaron puntos pero luego fueron canceladas o reembolsadas
        earned_entries = GreenPointLedger.objects.filter(
            user=user,
            transaction_type=GreenPointLedger.TransactionType.EARNED,
            reservation__isnull=False
        ).select_related('reservation')

        for entry in earned_entries:
            res = entry.reservation
            if res.status == Reservation.Status.CANCELLED or res.payment_status == 'refunded':
                already_refunded = GreenPointLedger.objects.filter(
                    reservation=res,
                    transaction_type=GreenPointLedger.TransactionType.REFUNDED
                ).exists()

                if not already_refunded:
                    current_balance = get_user_points_balance(user)
                    points_to_deduct = min(entry.points, current_balance)
                    if points_to_deduct > 0:
                        GreenPointLedger.objects.create(
                            user=user,
                            reservation=res,
                            points=-points_to_deduct,
                            transaction_type=GreenPointLedger.TransactionType.REFUNDED,
                            description=f"Puntos descontados por cancelación/reembolso de reserva {res.booking_code}"
                        )

        # 3. Devolver los 100 puntos canjeados si la reserva con descuento fue cancelada o reembolsada
        redeemed_entries = GreenPointLedger.objects.filter(
            user=user,
            transaction_type=GreenPointLedger.TransactionType.REDEEMED,
            reservation__isnull=False
        ).select_related('reservation')

        for entry in redeemed_entries:
            res = entry.reservation
            if res.status == Reservation.Status.CANCELLED or res.payment_status == 'refunded':
                already_restored = GreenPointLedger.objects.filter(
                    reservation=res,
                    transaction_type=GreenPointLedger.TransactionType.RESTORED
                ).exists()

                if not already_restored:
                    restore_amount = abs(entry.points) if entry.points else redemption_threshold
                    GreenPointLedger.objects.create(
                        user=user,
                        reservation=res,
                        points=restore_amount,
                        transaction_type=GreenPointLedger.TransactionType.RESTORED,
                        description=f"Reintegro de {restore_amount} puntos por cancelación de reserva {res.booking_code}"
                    )


def handle_reservation_cancellation_or_refund(reservation):
    """Maneja la reversión de puntos y descuentos cuando se cancela o reembolsa una reserva."""
    if not reservation or not reservation.user:
        return
    sync_user_points(reservation.user)


def calculate_causes_totals():
    """
    Calcula el total general donado a cada una de las dos causas:
    - Ambiente (ONGs como PlantArg, Plantarse)
    - Inclusión (ONGs como Fundación Rumbos, Acceso Ya, Fundación TINC)
    Regla:
    Cada reserva destina el 5% de la comisión de Parkia (15%) a cada causa.
    (5% de 15% = 0.75% del valor total de la reserva).
    En el MVP se incluye una base inicial simulada para mostrar impacto tangible en la plataforma.
    """
    from apps.reservations.models import Reservation

    commission_percent = getattr(settings, 'PARKIA_COMMISSION_PERCENT', 15)
    cause_share_percent = getattr(settings, 'CAUSE_ENVIRONMENT_COMMISSION_SHARE', 5.0)

    # Reservas activas/completadas que generaron ingreso
    revenue_qs = Reservation.objects.filter(
        status__in=[Reservation.Status.CONFIRMED, Reservation.Status.COMPLETED]
    ).exclude(payment_status='refunded')

    # Suma de precios base/totales
    total_rev = revenue_qs.aggregate(total=Sum('total_price'))['total'] or Decimal('0.00')

    # Comisión total de Parkia
    parkia_commission = float(total_rev) * (commission_percent / 100.0)

    # Cada causa recibe el 5% de la comisión de Parkia
    calc_per_cause = parkia_commission * (cause_share_percent / 100.0)

    # Base simulada inicial para el MVP Park for Good (según requerimiento)
    mvp_base_simulation = 12500.00
    total_environment = round(mvp_base_simulation + calc_per_cause, 2)
    total_inclusion = round(mvp_base_simulation + calc_per_cause, 2)

    return {
        'total_donated_environment': total_environment,
        'total_donated_inclusion': total_inclusion,
        'parkia_commission_percent': commission_percent,
        'cause_share_percent': cause_share_percent,
        'causes': [
            {
                'id': 'ambiente',
                'name': 'Ambiente',
                'ong_options': ['PlantArg', 'Plantarse'],
                'tagline': 'Plantación de árboles nativos de Argentina',
                'description': 'Apoyamos a ONGs ambientales para reforestar bosques nativos en Argentina, absorbiendo CO2 y regenerando la biodiversidad.',
                'total_donated': total_environment,
                'share_percent': cause_share_percent,
            },
            {
                'id': 'inclusion',
                'name': 'Inclusión',
                'ong_options': ['Fundación Rumbos', 'Acceso Ya', 'Fundación TINC'],
                'tagline': 'Accesibilidad universal para personas con discapacidad',
                'description': 'Apoyamos la accesibilidad para personas con discapacidad visual, auditiva e intelectual, eliminando barreras en la movilidad y los estacionamientos.',
                'total_donated': total_inclusion,
                'share_percent': cause_share_percent,
            }
        ]
    }


def get_user_green_points_summary(user):
    """
    Retorna el resumen completo del usuario:
    - Saldo actual de puntos
    - Puntos que faltan para el próximo descuento
    - Si tiene descuento disponible (saldo >= 100)
    - Km de búsqueda ahorrados
    - CO2 evitado en kg
    - Historial de movimientos
    - Causas apoyadas y totales donados
    """
    if not user or not user.is_authenticated:
        causes = calculate_causes_totals()
        return {
            'balance': 0,
            'points_to_next_discount': getattr(settings, 'GREEN_POINTS_REDEMPTION_THRESHOLD', 100),
            'has_discount_available': False,
            'discount_percent': getattr(settings, 'GREEN_POINTS_DISCOUNT_PERCENT', 10),
            'redemption_threshold': getattr(settings, 'GREEN_POINTS_REDEMPTION_THRESHOLD', 100),
            'km_saved': 0.0,
            'co2_saved_kg': 0.0,
            'completed_direct_trips': 0,
            'history': [],
            'causes': causes,
        }

    # Sincronizar puntos primero
    sync_user_points(user)

    balance = get_user_points_balance(user)
    threshold = getattr(settings, 'GREEN_POINTS_REDEMPTION_THRESHOLD', 100)
    discount_percent = getattr(settings, 'GREEN_POINTS_DISCOUNT_PERCENT', 10)
    km_per_res = getattr(settings, 'GREEN_POINTS_KM_SAVED_PER_RESERVATION', 5.0)
    co2_per_res = getattr(settings, 'GREEN_POINTS_CO2_SAVED_KG_PER_RESERVATION', 1.0)

    has_discount_available = balance >= threshold
    points_to_next = 0 if has_discount_available else (threshold - balance)

    # Cantidad de viajes directos completados con check-in (cada uno sumó 10 pts)
    completed_direct_trips = GreenPointLedger.objects.filter(
        user=user,
        transaction_type=GreenPointLedger.TransactionType.EARNED
    ).count()

    km_saved = round(completed_direct_trips * km_per_res, 1)
    co2_saved_kg = round(completed_direct_trips * co2_per_res, 1)

    history_qs = GreenPointLedger.objects.filter(user=user).select_related('reservation', 'reservation__parking')[:50]
    history_data = []
    for h in history_qs:
        history_data.append({
            'id': h.id,
            'points': h.points,
            'transaction_type': h.transaction_type,
            'transaction_type_display': h.get_transaction_type_display(),
            'description': h.description,
            'created_at': h.created_at.strftime('%Y-%m-%d %H:%M'),
            'booking_code': h.reservation.booking_code if h.reservation else None,
            'parking_name': h.reservation.parking.name if h.reservation and h.reservation.parking else None,
        })

    causes = calculate_causes_totals()

    return {
        'balance': balance,
        'points_to_next_discount': points_to_next,
        'has_discount_available': has_discount_available,
        'discount_percent': discount_percent,
        'redemption_threshold': threshold,
        'km_saved': km_saved,
        'co2_saved_kg': co2_saved_kg,
        'completed_direct_trips': completed_direct_trips,
        'history': history_data,
        'causes': causes,
    }
