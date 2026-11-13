from datetime import datetime, date, time, timedelta
from django.db import models, transaction, OperationalError, IntegrityError
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.parking.models import Parking, ParkingSpace
from apps.parking.serializers import ParkingSpaceSerializer
from .models import Reservation, SpaceLock
from .serializers import ReservationSerializer, ReservationCreateSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = Reservation.objects.select_related('parking', 'space', 'user').all()

        if user.role == 'admin' or user.is_superuser:
            # Super Admin Ariel ve todas las reservas de la plataforma
            pass
        elif user.role == 'owner':
            # El dueño de garaje solo ve las reservas de sus propios estacionamientos
            queryset = queryset.filter(parking__owner=user)
        else:
            # Los conductores solo ven sus propias reservas
            queryset = queryset.filter(user=user)

        # Filters
        status_param = self.request.query_params.get('status')
        if status_param:
            if status_param == 'active':
                queryset = queryset.filter(
                    status__in=[Reservation.Status.CONFIRMED, Reservation.Status.PENDING],
                    date__gte=date.today()
                )
            elif status_param == 'past':
                queryset = queryset.filter(
                    status__in=[Reservation.Status.COMPLETED, Reservation.Status.CANCELLED]
                ) | queryset.filter(date__lt=date.today())
            else:
                queryset = queryset.filter(status=status_param)

        parking_id = self.request.query_params.get('parking_id')
        if parking_id:
            queryset = queryset.filter(parking_id=parking_id)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(booking_code__icontains=search)

        return queryset.order_by('-date', '-start_time')

    def get_serializer_class(self):
        if self.action == 'create':
            return ReservationCreateSerializer
        return ReservationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            reservation = serializer.save()
            # Return complete detail
            detail_serializer = ReservationSerializer(reservation)
            return Response({
                'message': '¡Reserva confirmada con éxito!',
                'reservation': detail_serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response({'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['patch'])
    def cancel(self, request, pk=None):
        reservation = self.get_object()
        user = request.user

        # Only owner or admin can cancel
        if user != reservation.user and user.role not in ['admin', 'owner'] and not user.is_superuser:
            return Response({'error': 'No tienes permiso para cancelar esta reserva.'}, status=status.HTTP_403_FORBIDDEN)

        if reservation.status == Reservation.Status.CANCELLED:
            return Response({'message': 'La reserva ya se encontraba cancelada.'}, status=status.HTTP_200_OK)

        if reservation.status == Reservation.Status.COMPLETED:
            return Response({'error': 'No se puede cancelar una reserva que ya ha finalizado.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Cancelado por el usuario')
        reservation.status = Reservation.Status.CANCELLED
        reservation.cancellation_reason = reason

        # Si la reserva ya fue abonada, se procesa automáticamente el reembolso
        is_refunded = False
        if reservation.payment_status == 'paid':
            reservation.payment_status = 'refunded'
            is_refunded = True

            # Sincronizar estado en modelo Payment si existe
            try:
                from apps.pagos.models import Payment
                payment = getattr(reservation, 'payment', None)
                if payment and payment.status == Payment.Status.APPROVED:
                    payment.status = Payment.Status.REFUNDED
                    payment.status_detail = 'reembolso_total_cancelacion'
                    payment.save(update_fields=['status', 'status_detail', 'updated_at'])
            except Exception:
                pass

        reservation.save()

        # Liberar la plaza asociada si estaba reservada
        if reservation.space and reservation.space.status == 'reserved':
            reservation.space.status = 'available'
            reservation.space.save(update_fields=['status'])

        msg = (
            f'Reserva cancelada y reembolso del 100% (${reservation.total_price}) procesado a tu cuenta.'
            if is_refunded else
            'Reserva cancelada exitosamente.'
        )

        return Response({
            'message': msg,
            'refunded': is_refunded,
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def change_status(self, request, pk=None):
        if request.user.role not in ['admin', 'owner'] and not request.user.is_superuser:
            return Response({'error': 'Acción solo permitida para administradores u operadores.'}, status=status.HTTP_403_FORBIDDEN)

        reservation = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [c[0] for c in Reservation.Status.choices]:
            return Response({'error': 'Estado no válido.'}, status=status.HTTP_400_BAD_REQUEST)

        reservation.status = new_status
        reservation.save()
        return Response({
            'message': f'Estado de reserva actualizado a {reservation.get_status_display()}.',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify_qr(self, request):
        """Verifica un código de reserva escaneado vía QR"""
        if request.user.role not in ['admin', 'owner'] and not request.user.is_superuser:
            return Response({'error': 'Solo el personal del estacionamiento puede validar códigos QR.'}, status=status.HTTP_403_FORBIDDEN)

        raw_code = request.data.get('code', '').strip()
        if not raw_code:
            return Response({'error': 'Código QR no proporcionado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Si el QR contiene JSON o URL, extraer el código PK-XXXXXX
        import re
        match = re.search(r'PK-[A-Z0-9]+', raw_code)
        code = match.group(0) if match else raw_code

        try:
            reservation = Reservation.objects.select_related('parking', 'space', 'user').get(booking_code=code)
        except Reservation.DoesNotExist:
            return Response({'error': f'No se encontró ninguna reserva con el código "{code}".'}, status=status.HTTP_404_NOT_FOUND)

        # Si el usuario es dueño de garaje, verificar que el código pertenezca a su propio estacionamiento
        if request.user.role == 'owner' and reservation.parking.owner != request.user and not request.user.is_superuser:
            return Response({
                'error': f'Este código QR pertenece al estacionamiento "{reservation.parking.name}". Solo puedes validar reservas de tu propio estacionamiento asignado.'
            }, status=status.HTTP_403_FORBIDDEN)

        # Si está cancelada, informar
        if reservation.status == Reservation.Status.CANCELLED:
            return Response({
                'error': f'Esta reserva fue cancelada previamente (Motivo: {reservation.cancellation_reason or "Cancelada por usuario"}). No habilitada para ingreso/egreso.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'valid': True,
            'message': 'Código QR validado exitosamente.',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_in(self, request, pk=None):
        """Registra el ingreso de un vehículo (por QR o manual)"""
        if request.user.role not in ['admin', 'owner'] and not request.user.is_superuser:
            return Response({'error': 'Permiso denegado.'}, status=status.HTTP_403_FORBIDDEN)

        from django.utils import timezone
        reservation = self.get_object()

        # Si es dueño de garaje, validar que sea su propio estacionamiento
        if request.user.role == 'owner' and reservation.parking.owner != request.user and not request.user.is_superuser:
            return Response({'error': 'No tienes permiso para operar este estacionamiento ajeno.'}, status=status.HTTP_403_FORBIDDEN)

        reservation.check_in_time = timezone.now()
        reservation.status = Reservation.Status.CONFIRMED
        
        # Ocupar el espacio
        if reservation.space:
            reservation.space.status = ParkingSpace.Status.OCCUPIED
            reservation.space.save()

        notes = request.data.get('notes')
        if notes:
            reservation.staff_notes = notes
        
        payment_method = request.data.get('payment_method')
        if payment_method:
            reservation.payment_method = payment_method
        elif not reservation.payment_method:
            reservation.payment_method = 'Efectivo'

        reservation.save()

        return Response({
            'message': f'¡Ingreso registrado para {reservation.vehicle_plate}!',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_out(self, request, pk=None):
        """Registra el egreso y cobro final de un vehículo"""
        if request.user.role not in ['admin', 'owner'] and not request.user.is_superuser:
            return Response({'error': 'Permiso denegado.'}, status=status.HTTP_403_FORBIDDEN)

        from django.utils import timezone
        reservation = self.get_object()

        # Si es dueño de garaje, validar que sea su propio estacionamiento
        if request.user.role == 'owner' and reservation.parking.owner != request.user and not request.user.is_superuser:
            return Response({'error': 'No tienes permiso para operar este estacionamiento ajeno.'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        reservation.check_out_time = now
        reservation.status = Reservation.Status.COMPLETED
        reservation.payment_status = 'paid'

        # Liberar el espacio
        if reservation.space:
            reservation.space.status = ParkingSpace.Status.AVAILABLE
            reservation.space.save()

        payment_method = request.data.get('payment_method')
        if payment_method:
            reservation.payment_method = payment_method
        elif not reservation.payment_method:
            reservation.payment_method = 'Efectivo'

        notes = request.data.get('notes')
        if notes:
            reservation.staff_notes = notes

        reservation.save()

        return Response({
            'message': f'¡Egreso registrado exitosamente! Cobro completado: ${reservation.total_price}',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def register_walk_in(self, request):
        """Registra un ingreso directo en ventanilla sin reserva previa"""
        if request.user.role not in ['admin', 'owner'] and not request.user.is_superuser:
            return Response({'error': 'Permiso denegado.'}, status=status.HTTP_403_FORBIDDEN)

        from django.utils import timezone
        parking_id = request.data.get('parking_id')
        plate = request.data.get('vehicle_plate', 'AA000XX').strip().upper()
        model_name = request.data.get('vehicle_model', '')
        hours = float(request.data.get('hours', 1.0))
        payment_method = request.data.get('payment_method', 'Efectivo')
        notes = request.data.get('notes', 'Ingreso directo por garita')

        try:
            parking = Parking.objects.get(id=parking_id)
        except Parking.DoesNotExist:
            return Response({'error': 'Estacionamiento no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        # Si es dueño de garaje, validar que sea su propio estacionamiento
        if request.user.role == 'owner' and parking.owner != request.user and not request.user.is_superuser:
            return Response({'error': 'No tienes permiso para registrar ingresos en un estacionamiento ajeno.'}, status=status.HTTP_403_FORBIDDEN)

        now = timezone.now()
        price = round(hours * float(parking.price_per_hour), 2)

        # Buscar espacio libre
        space = parking.spaces.filter(status=ParkingSpace.Status.AVAILABLE).first()
        if space:
            space.status = ParkingSpace.Status.OCCUPIED
            space.save()

        reservation = Reservation.objects.create(
            user=request.user,
            parking=parking,
            space=space,
            vehicle_plate=plate,
            vehicle_model=model_name,
            date=now.date(),
            start_time=now.time(),
            end_time=(now + timezone.timedelta(hours=hours)).time(),
            total_hours=hours,
            total_price=price,
            status=Reservation.Status.CONFIRMED,
            check_in_time=now,
            payment_status='paid',
            payment_method=payment_method,
            staff_notes=notes
        )

        return Response({
            'message': f'Vehículo {plate} ingresado correctamente.',
            'reservation': ReservationSerializer(reservation).data
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def check_availability(self, request):
        parking_id = request.query_params.get('parking_id')
        date_str = request.query_params.get('date')
        start_time_str = request.query_params.get('start_time')
        end_time_str = request.query_params.get('end_time')
        session_id = request.query_params.get('session_id')

        if not all([parking_id, date_str, start_time_str, end_time_str]):
            return Response({'error': 'Parámetros incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parking = Parking.objects.get(id=parking_id)
            res_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except (ValueError, Parking.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Limpieza de expirados
        SpaceLock.objects.filter(status=SpaceLock.Status.ACTIVE, expires_at__lt=timezone.now()).update(
            status=SpaceLock.Status.EXPIRED
        )

        user = request.user if request.user and request.user.is_authenticated else None

        # 2. Reservas confirmadas / pendientes
        overlapping = Reservation.objects.filter(
            parking=parking,
            date=res_date,
            status__in=[Reservation.Status.PENDING, Reservation.Status.CONFIRMED],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        occupied_space_ids = set(overlapping.values_list('space_id', flat=True))

        # 3. Bloqueos temporales activos de 5 minutos
        active_locks = SpaceLock.objects.filter(
            parking=parking,
            date=res_date,
            status=SpaceLock.Status.ACTIVE,
            expires_at__gt=timezone.now(),
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        locked_space_map = {}
        for l in active_locks:
            is_mine = False
            if user and l.user_id == user.id:
                is_mine = True
            elif session_id and l.session_id == session_id:
                is_mine = True
            locked_space_map[l.space_id] = {
                'lock_id': l.id,
                'is_mine': is_mine,
                'expires_at': l.expires_at.isoformat(),
                'seconds_remaining': max(0, int((l.expires_at - timezone.now()).total_seconds()))
            }

        spaces = parking.spaces.all()
        spaces_data = []
        for space in spaces:
            lock_info = locked_space_map.get(space.id)
            is_reserved = space.id in occupied_space_ids
            is_maintenance = space.status == ParkingSpace.Status.MAINTENANCE

            if is_maintenance:
                computed_status = 'maintenance'
                is_available = False
            elif is_reserved:
                computed_status = 'occupied'
                is_available = False
            elif lock_info:
                if lock_info['is_mine']:
                    computed_status = 'locked_by_me'
                    is_available = True
                else:
                    computed_status = 'locked_by_other'
                    is_available = False
            else:
                computed_status = 'available'
                is_available = True

            spaces_data.append({
                'id': space.id,
                'code': space.code,
                'floor': space.floor,
                'space_type': space.space_type,
                'is_available': is_available,
                'status': computed_status,
                'lock_info': lock_info
            })

        available_count = len([s for s in spaces_data if s['is_available']])
        duration = (datetime.combine(res_date, end_time) - datetime.combine(res_date, start_time)).total_seconds() / 3600.0
        estimated_price = round(duration * float(parking.price_per_hour), 2) if duration > 0 else 0

        return Response({
            'parking_id': parking.id,
            'total_spaces': len(spaces_data),
            'available_spaces_count': available_count,
            'has_availability': available_count > 0,
            'duration_hours': duration,
            'estimated_price': estimated_price,
            'spaces': spaces_data
        })

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def lock_space(self, request):
        space_id = request.data.get('space_id')
        parking_id = request.data.get('parking_id')
        session_id = request.data.get('session_id')
        date_str = request.data.get('date')
        start_time_str = request.data.get('start_time')
        end_time_str = request.data.get('end_time')

        if not all([space_id, parking_id, session_id, date_str, start_time_str, end_time_str]):
            return Response({'error': 'Parámetros incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            res_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except ValueError as e:
            return Response({'error': f'Formato inválido: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user if request.user and request.user.is_authenticated else None

        try:
            with transaction.atomic():
                # 1. Limpieza de expirados
                SpaceLock.objects.filter(status=SpaceLock.Status.ACTIVE, expires_at__lt=timezone.now()).update(
                    status=SpaceLock.Status.EXPIRED
                )

                # 2. Bloqueo pesimista a nivel de fila
                try:
                    space = ParkingSpace.objects.select_for_update().get(id=space_id, parking_id=parking_id)
                except ParkingSpace.DoesNotExist:
                    return Response({'error': 'Plaza no encontrada en este estacionamiento.'}, status=status.HTTP_404_NOT_FOUND)

                if space.status == ParkingSpace.Status.MAINTENANCE:
                    return Response({'error': f'La plaza {space.code} se encuentra fuera de servicio.'}, status=status.HTTP_400_BAD_REQUEST)

                # Verificar plaza accesible
                if space.space_type == ParkingSpace.SpaceType.DISABLED:
                    has_permit = bool(user and (getattr(user, 'cud_verified', False) or user.has_role('disabled')))
                    if not has_permit:
                        return Response({
                            'error': f'La plaza {space.code} es accesible, reservada para personas con credencial de discapacidad verificada.'
                        }, status=status.HTTP_403_FORBIDDEN)

                # 3. Si el usuario ya la tenía bloqueada, renovar
                existing_lock = SpaceLock.objects.filter(
                    space=space,
                    date=res_date,
                    status=SpaceLock.Status.ACTIVE,
                    expires_at__gt=timezone.now()
                )
                if user:
                    user_match = existing_lock.filter(models.Q(user=user) | models.Q(session_id=session_id)).first()
                else:
                    user_match = existing_lock.filter(session_id=session_id).first()

                if user_match:
                    user_match.expires_at = timezone.now() + timedelta(minutes=5)
                    user_match.save(update_fields=['expires_at', 'updated_at'])
                    return Response({
                        'success': True,
                        'lock_id': user_match.id,
                        'space_id': space.id,
                        'space_code': space.code,
                        'expires_at': user_match.expires_at.isoformat(),
                        'ttl_seconds': 300,
                        'is_renewed': True,
                        'message': 'Bloqueo renovado con éxito.'
                    }, status=status.HTTP_200_OK)

                # 4. Liberar cualquier otro bloqueo previo que tenga este usuario/sesión en este parking
                prev_locks = SpaceLock.objects.filter(
                    parking_id=parking_id,
                    status=SpaceLock.Status.ACTIVE
                )
                if user:
                    prev_locks = prev_locks.filter(models.Q(user=user) | models.Q(session_id=session_id))
                else:
                    prev_locks = prev_locks.filter(session_id=session_id)
                prev_locks.update(status=SpaceLock.Status.RELEASED)

                # 5. Verificar si otro usuario la tiene bloqueada
                other_lock = SpaceLock.objects.filter(
                    space=space,
                    date=res_date,
                    status=SpaceLock.Status.ACTIVE,
                    expires_at__gt=timezone.now(),
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()

                if other_lock:
                    return Response({
                        'error': 'Esta plaza acaba de ser seleccionada por otro usuario. Elegí otra plaza disponible.',
                        'code': 'LOCKED_BY_OTHER'
                    }, status=status.HTTP_409_CONFLICT)

                # 6. Verificar si existe reserva confirmada
                has_reservation = Reservation.objects.filter(
                    space=space,
                    date=res_date,
                    status__in=[Reservation.Status.PENDING, Reservation.Status.CONFIRMED],
                    start_time__lt=end_time,
                    end_time__gt=start_time
                ).exists()

                if has_reservation:
                    return Response({
                        'error': f'La plaza {space.code} ya se encuentra reservada para esa franja horaria.',
                        'code': 'ALREADY_RESERVED'
                    }, status=status.HTTP_409_CONFLICT)

                # 7. Crear el bloqueo por 5 minutos
                expires_at = timezone.now() + timedelta(minutes=5)
                new_lock = SpaceLock.objects.create(
                    space=space,
                    parking=space.parking,
                    user=user,
                    session_id=session_id,
                    date=res_date,
                    start_time=start_time,
                    end_time=end_time,
                    status=SpaceLock.Status.ACTIVE,
                    expires_at=expires_at
                )

                if space.status == ParkingSpace.Status.AVAILABLE:
                    space.status = ParkingSpace.Status.LOCKED
                    space.save(update_fields=['status'])

                return Response({
                    'success': True,
                    'lock_id': new_lock.id,
                    'space_id': space.id,
                    'space_code': space.code,
                    'expires_at': expires_at.isoformat(),
                    'ttl_seconds': 300,
                    'is_renewed': False,
                    'message': 'Tu plaza está protegida durante 5 minutos.'
                }, status=status.HTTP_201_CREATED)
        except (OperationalError, IntegrityError):
            return Response({
                'error': 'Esta plaza acaba de ser seleccionada por otro usuario. Elegí otra plaza disponible.',
                'code': 'LOCKED_BY_OTHER'
            }, status=status.HTTP_409_CONFLICT)

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def release_lock(self, request):
        lock_id = request.data.get('lock_id')
        session_id = request.data.get('session_id')
        user = request.user if request.user and request.user.is_authenticated else None

        if not lock_id or not session_id:
            return Response({'error': 'Faltan parámetros.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            qs = SpaceLock.objects.filter(id=lock_id, status=SpaceLock.Status.ACTIVE)
            if user:
                qs = qs.filter(models.Q(user=user) | models.Q(session_id=session_id))
            else:
                qs = qs.filter(session_id=session_id)

            lock = qs.first()
            if not lock:
                return Response({'success': False, 'message': 'Bloqueo no encontrado o inactivo.'}, status=status.HTTP_200_OK)

            lock.status = SpaceLock.Status.RELEASED
            lock.save(update_fields=['status', 'updated_at'])

            has_other_locks = SpaceLock.objects.filter(
                space=lock.space,
                status=SpaceLock.Status.ACTIVE,
                expires_at__gt=timezone.now()
            ).exists()
            if not has_other_locks and lock.space.status == ParkingSpace.Status.LOCKED:
                lock.space.status = ParkingSpace.Status.AVAILABLE
                lock.space.save(update_fields=['status'])

            return Response({'success': True, 'released': True, 'message': 'Plaza liberada exitosamente.'})
