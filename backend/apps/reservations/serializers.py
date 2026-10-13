from datetime import datetime, date, time
from decimal import Decimal
from rest_framework import serializers
from apps.parking.models import Parking, ParkingSpace
from apps.parking.serializers import ParkingListSerializer, ParkingSpaceSerializer
from apps.users.serializers import UserSerializer
from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    parking_name = serializers.CharField(source='parking.name', read_only=True)
    parking_address = serializers.CharField(source='parking.address', read_only=True)
    parking_city = serializers.CharField(source='parking.city', read_only=True)
    parking_phone = serializers.CharField(source='parking.phone', read_only=True)
    parking_image_url = serializers.CharField(source='parking.image_url', read_only=True)
    parking_latitude = serializers.FloatField(source='parking.latitude', read_only=True)
    parking_longitude = serializers.FloatField(source='parking.longitude', read_only=True)
    
    space_code = serializers.CharField(source='space.code', read_only=True, default='Auto')
    space_floor = serializers.CharField(source='space.floor', read_only=True, default='Planta Baja')
    
    user_email = serializers.CharField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Reservation
        fields = [
            'id',
            'booking_code',
            'user',
            'user_name',
            'user_email',
            'parking',
            'parking_name',
            'parking_address',
            'parking_city',
            'parking_phone',
            'parking_image_url',
            'parking_latitude',
            'parking_longitude',
            'space',
            'space_code',
            'space_floor',
            'vehicle_plate',
            'vehicle_model',
            'date',
            'start_time',
            'end_time',
            'total_hours',
            'total_price',
            'status',
            'status_display',
            'cancellation_reason',
            'check_in_time',
            'check_out_time',
            'payment_status',
            'payment_method',
            'staff_notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'booking_code', 'user', 'total_price', 'total_hours', 'created_at', 'updated_at']


class ReservationCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            'parking',
            'space',
            'vehicle_plate',
            'vehicle_model',
            'date',
            'start_time',
            'end_time',
        ]

    def validate(self, data):
        parking = data['parking']
        res_date = data['date']
        start_time = data['start_time']
        end_time = data['end_time']
        space = data.get('space')

        # 1. Validar que el estacionamiento esté activo
        if not parking.is_active:
            raise serializers.ValidationError({'parking': 'El estacionamiento seleccionado no está activo para reservas.'})

        # 2. Validar que la fecha no sea en el pasado
        today = date.today()
        if res_date < today:
            raise serializers.ValidationError({'date': 'No se pueden realizar reservas para fechas pasadas.'})

        # 3. Validar horario: hora de salida posterior a entrada
        if start_time >= end_time:
            raise serializers.ValidationError({'end_time': 'La hora de salida debe ser posterior a la hora de entrada.'})

        # 4. Validar horario de atención si no es 24 horas
        if not parking.is_24_hours:
            if start_time < parking.opening_time or end_time > parking.closing_time:
                raise serializers.ValidationError({
                    'start_time': f'El horario de atención es de {parking.opening_time.strftime("%H:%M")} a {parking.closing_time.strftime("%H:%M")}.'
                })

        # Calcular duración en horas
        start_dt = datetime.combine(res_date, start_time)
        end_dt = datetime.combine(res_date, end_time)
        duration_hours = (end_dt - start_dt).total_seconds() / 3600.0
        
        if duration_hours < 0.5:
            raise serializers.ValidationError({'end_time': 'La duración mínima de reserva es de 30 minutos.'})

        # 5. Validar disponibilidad de espacios y no superposición
        active_statuses = [Reservation.Status.PENDING, Reservation.Status.CONFIRMED]
        
        # Buscar reservas que se solapen en fecha y hora
        overlapping_reservations = Reservation.objects.filter(
            parking=parking,
            date=res_date,
            status__in=active_statuses,
            start_time__lt=end_time,
            end_time__gt=start_time
        )

        if space:
            # Si eligió un espacio específico, verificar que pertenezca al parking y no esté ocupado
            if space.parking != parking:
                raise serializers.ValidationError({'space': 'El espacio seleccionado no pertenece a este estacionamiento.'})
            
            if space.status == ParkingSpace.Status.MAINTENANCE:
                raise serializers.ValidationError({'space': f'El espacio {space.code} se encuentra fuera de servicio.'})

            if overlapping_reservations.filter(space=space).exists():
                raise serializers.ValidationError({
                    'space': f'El espacio {space.code} ya está reservado para esa franja horaria. Por favor elige otro espacio.'
                })
        else:
            # Autoasignar un espacio libre
            occupied_space_ids = overlapping_reservations.values_list('space_id', flat=True)
            available_spaces = parking.spaces.exclude(
                id__in=occupied_space_ids
            ).exclude(
                status=ParkingSpace.Status.MAINTENANCE
            ).order_by('code')

            chosen_space = available_spaces.first()
            if not chosen_space:
                # Si el estacionamiento no tiene plazas creadas aún, comprobar por capacidad
                if overlapping_reservations.count() >= parking.capacity:
                    raise serializers.ValidationError('No hay espacios disponibles para la franja horaria seleccionada.')
            else:
                data['space'] = chosen_space

        # Calcular precio total
        total_price = Decimal(str(round(duration_hours * float(parking.price_per_hour), 2)))
        data['total_hours'] = Decimal(str(round(duration_hours, 2)))
        data['total_price'] = total_price

        return data

    def create(self, validated_data):
        user = self.context['request'].user
        validated_data['user'] = user
        validated_data['status'] = Reservation.Status.CONFIRMED
        return super().create(validated_data)
