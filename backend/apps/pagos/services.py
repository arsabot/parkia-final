import hmac
from datetime import timedelta
from decimal import Decimal, InvalidOperation
from urllib.parse import urlparse

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.reservations.models import Reservation
from .models import Payment


class PaymentConfigurationError(Exception):
    pass


class PaymentProviderError(Exception):
    pass


def _access_token():
    token = settings.MERCADOPAGO_ACCESS_TOKEN.strip()
    if not token:
        raise PaymentConfigurationError('Falta configurar MERCADOPAGO_ACCESS_TOKEN en el backend.')
    return token


def _request(method, path, **kwargs):
    headers = kwargs.pop('headers', {})
    headers['Authorization'] = f'Bearer {_access_token()}'
    headers['Content-Type'] = 'application/json'
    try:
        response = requests.request(
            method,
            f'https://api.mercadopago.com{path}',
            headers=headers,
            timeout=(5, 20),
            **kwargs,
        )
    except requests.RequestException as exc:
        raise PaymentProviderError('No se pudo conectar con Mercado Pago. Intentá nuevamente.') from exc

    if not response.ok:
        try:
            message = response.json().get('message') or response.json().get('error')
        except ValueError:
            message = None
        raise PaymentProviderError(message or 'Mercado Pago no pudo procesar la solicitud.')

    try:
        return response.json()
    except ValueError as exc:
        raise PaymentProviderError('Mercado Pago devolvió una respuesta inválida.') from exc


def _is_public_https_url(value):
    parsed = urlparse(value)
    return parsed.scheme == 'https' and parsed.hostname not in {'localhost', '127.0.0.1', '::1'}


def _reservation_is_expired(reservation):
    return bool(reservation.payment_expires_at and reservation.payment_expires_at <= timezone.now())


def _expire_reservation(reservation):
    if reservation.status == Reservation.Status.PENDING and _reservation_is_expired(reservation):
        reservation.status = Reservation.Status.CANCELLED
        reservation.cancellation_reason = 'El plazo de pago venció.'
        reservation.save(update_fields=['status', 'cancellation_reason', 'updated_at'])


def payment_for_reservation(reservation):
    with transaction.atomic():
        reservation = Reservation.objects.select_for_update().get(pk=reservation.pk)
        _expire_reservation(reservation)
        if reservation.status == Reservation.Status.CANCELLED:
            raise PaymentProviderError('El plazo para pagar esta reserva venció. Creá una nueva reserva.')
        if reservation.status == Reservation.Status.COMPLETED:
            raise PaymentProviderError('No se puede iniciar un pago para una reserva finalizada.')
        payment, _ = Payment.objects.get_or_create(
            reservation=reservation,
            defaults={
                'external_reference': f'PARKIA-{reservation.pk}-{reservation.booking_code}',
                'amount': reservation.total_price,
                'currency': 'ARS',
                'expires_at': reservation.payment_expires_at,
            },
        )
        return payment


def create_checkout(reservation):
    payment = payment_for_reservation(reservation)
    if payment.status == Payment.Status.APPROVED:
        return payment
    if payment.checkout_url:
        return payment

    frontend_url = settings.FRONTEND_URL.rstrip('/')
    payload = {
        'items': [{
            'id': str(reservation.id),
            'title': f'Reserva Parkia · {reservation.parking.name}',
            'description': f'{reservation.date} · {reservation.start_time.strftime("%H:%M")} a {reservation.end_time.strftime("%H:%M")}',
            'quantity': 1,
            'currency_id': 'ARS',
            'unit_price': float(payment.amount),
        }],
        'payer': {'email': reservation.user.email},
        'external_reference': payment.external_reference,
        'statement_descriptor': 'PARKIA',
        'expires': True,
        'expiration_date_from': timezone.now().isoformat(),
        'expiration_date_to': payment.expires_at.isoformat() if payment.expires_at else (timezone.now() + timedelta(minutes=15)).isoformat(),
    }

    if _is_public_https_url(frontend_url):
        payment_url = f'{frontend_url}/payment/{reservation.id}'
        payload['back_urls'] = {
            'success': f'{payment_url}?result=success',
            'pending': f'{payment_url}?result=pending',
            'failure': f'{payment_url}?result=failure',
        }
        payload['auto_return'] = 'approved'

    if settings.MERCADOPAGO_WEBHOOK_URL:
        if not _is_public_https_url(settings.MERCADOPAGO_WEBHOOK_URL):
            raise PaymentConfigurationError('MERCADOPAGO_WEBHOOK_URL debe usar HTTPS y no puede ser localhost.')
        payload['notification_url'] = settings.MERCADOPAGO_WEBHOOK_URL

    data = _request('POST', '/checkout/preferences', json=payload)
    checkout_url = data.get('init_point')
    if not checkout_url:
        raise PaymentProviderError('Mercado Pago no devolvió una URL de pago.')

    payment.preference_id = str(data.get('id', ''))
    payment.checkout_url = checkout_url
    payment.status = Payment.Status.PENDING
    payment.status_detail = ''
    payment.provider_payload = data
    payment.save(update_fields=['preference_id', 'checkout_url', 'status', 'status_detail', 'provider_payload', 'updated_at'])
    return payment


def _apply_provider_payment(payment, data):
    if data.get('external_reference') != payment.external_reference:
        raise PaymentProviderError('La referencia del pago no coincide con la reserva.')

    try:
        amount = Decimal(str(data.get('transaction_amount'))).quantize(Decimal('0.01'))
    except (InvalidOperation, TypeError, ValueError) as exc:
        raise PaymentProviderError('Mercado Pago devolvió un monto inválido.') from exc

    if amount != payment.amount or data.get('currency_id') != payment.currency:
        raise PaymentProviderError('El monto o la moneda del pago no coinciden con la reserva.')

    provider_status = data.get('status', Payment.Status.IN_PROCESS)
    statuses = {choice for choice, _ in Payment.Status.choices}
    payment.status = provider_status if provider_status in statuses else Payment.Status.IN_PROCESS
    payment.status_detail = data.get('status_detail', '')[:100]
    payment.provider_payment_id = str(data.get('id', ''))
    payment.provider_payload = data
    payment.save(update_fields=['status', 'status_detail', 'provider_payment_id', 'provider_payload', 'updated_at'])

    reservation = payment.reservation
    reservation.payment_method = 'Mercado Pago'
    if payment.status == Payment.Status.APPROVED:
        reservation.payment_status = 'paid'
        reservation.status = Reservation.Status.CONFIRMED
        reservation.payment_expires_at = None
    elif payment.status == Payment.Status.REFUNDED:
        reservation.payment_status = 'refunded'
    else:
        reservation.payment_status = 'pending'
        if reservation.status != Reservation.Status.CANCELLED:
            reservation.status = Reservation.Status.PENDING
    reservation.save(update_fields=['payment_method', 'payment_status', 'status', 'payment_expires_at', 'updated_at'])
    return payment


def refresh_payment(payment):
    if payment.status in {Payment.Status.APPROVED, Payment.Status.REFUNDED}:
        return payment
    _expire_reservation(payment.reservation)
    payment.reservation.refresh_from_db()
    if payment.reservation.status == Reservation.Status.CANCELLED:
        payment.status = Payment.Status.EXPIRED
        payment.status_detail = 'payment_window_expired'
        payment.save(update_fields=['status', 'status_detail', 'updated_at'])
        return payment
    data = _request(
        'GET',
        '/v1/payments/search',
        params={
            'external_reference': payment.external_reference,
            'sort': 'date_created',
            'criteria': 'desc',
            'limit': 20,
        },
    )
    results = data.get('results') or []
    if not results:
        return payment
    approved = next((item for item in results if item.get('status') == Payment.Status.APPROVED), None)
    return _apply_provider_payment(payment, approved or results[0])


def refresh_payment_by_provider_id(provider_payment_id):
    data = _request('GET', f'/v1/payments/{provider_payment_id}')
    external_reference = data.get('external_reference')
    payment = Payment.objects.select_related('reservation').filter(external_reference=external_reference).first()
    if not payment:
        return None
    return _apply_provider_payment(payment, data)


def valid_webhook_signature(signature, request_id, data_id):
    secret = settings.MERCADOPAGO_WEBHOOK_SECRET
    if not secret or not signature:
        return False
    parts = {}
    for value in signature.split(','):
        key, separator, item = value.strip().partition('=')
        if separator:
            parts[key] = item
    timestamp = parts.get('ts')
    received_hash = parts.get('v1')
    if not timestamp or not received_hash:
        return False
    values = [('id', str(data_id)), ('request-id', request_id), ('ts', timestamp)]
    manifest = ''.join(f'{key}:{value};' for key, value in values if value)
    expected_hash = hmac.new(secret.encode(), manifest.encode(), 'sha256').hexdigest()
    return hmac.compare_digest(expected_hash, received_hash)
