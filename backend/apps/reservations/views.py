from datetime import datetime, date, time
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.parking.models import Parking, ParkingSpace
from apps.parking.serializers import ParkingSpaceSerializer
from .models import Reservation
from .serializers import ReservationSerializer, ReservationCreateSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        queryset = Reservation.objects.select_related('parking', 'space', 'user').all()

        if user.role != 'admin' and not user.is_superuser:
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
        if user != reservation.user and user.role != 'admin' and not user.is_superuser:
            return Response({'error': 'No tienes permiso para cancelar esta reserva.'}, status=status.HTTP_403_FORBIDDEN)

        if reservation.status == Reservation.Status.CANCELLED:
            return Response({'message': 'La reserva ya se encontraba cancelada.'}, status=status.HTTP_200_OK)

        if reservation.status == Reservation.Status.COMPLETED:
            return Response({'error': 'No se puede cancelar una reserva que ya ha finalizado.'}, status=status.HTTP_400_BAD_REQUEST)

        reason = request.data.get('reason', 'Cancelado por el usuario')
        reservation.status = Reservation.Status.CANCELLED
        reservation.cancellation_reason = reason
        reservation.save()

        return Response({
            'message': 'Reserva cancelada exitosamente.',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def change_status(self, request, pk=None):
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Acción solo permitida para administradores.'}, status=status.HTTP_403_FORBIDDEN)

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
        if request.user.role != 'admin' and not request.user.is_superuser:
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

        return Response({
            'valid': True,
            'message': 'Código QR validado exitosamente.',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_in(self, request, pk=None):
        """Registra el ingreso de un vehículo (por QR o manual)"""
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permiso denegado.'}, status=status.HTTP_403_FORBIDDEN)

        from django.utils import timezone
        reservation = self.get_object()
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

        reservation.save()

        return Response({
            'message': f'¡Ingreso registrado para {reservation.vehicle_plate}!',
            'reservation': ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_out(self, request, pk=None):
        """Registra el egreso y cobro final de un vehículo"""
        if request.user.role != 'admin' and not request.user.is_superuser:
            return Response({'error': 'Permiso denegado.'}, status=status.HTTP_403_FORBIDDEN)

        from django.utils import timezone
        reservation = self.get_object()
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
        if request.user.role != 'admin' and not request.user.is_superuser:
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

        if not all([parking_id, date_str, start_time_str, end_time_str]):
            return Response({'error': 'Parámetros incompletos.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parking = Parking.objects.get(id=parking_id)
            res_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            start_time = datetime.strptime(start_time_str, '%H:%M').time()
            end_time = datetime.strptime(end_time_str, '%H:%M').time()
        except (ValueError, Parking.DoesNotExist) as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        overlapping = Reservation.objects.filter(
            parking=parking,
            date=res_date,
            status__in=[Reservation.Status.PENDING, Reservation.Status.CONFIRMED],
            start_time__lt=end_time,
            end_time__gt=start_time
        )
        occupied_space_ids = overlapping.values_list('space_id', flat=True)

        spaces = parking.spaces.all()
        spaces_data = []
        for space in spaces:
            is_occupied_in_slot = space.id in occupied_space_ids or space.status == ParkingSpace.Status.MAINTENANCE
            spaces_data.append({
                'id': space.id,
                'code': space.code,
                'floor': space.floor,
                'space_type': space.space_type,
                'is_available': not is_occupied_in_slot,
                'status': 'occupied' if is_occupied_in_slot else 'available'
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
