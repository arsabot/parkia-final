from datetime import date, time, timedelta, datetime
import random
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.parking.models import Parking, ParkingSpace, ParkingFavorite
from apps.reservations.models import Reservation, generate_booking_code
from apps.reviews.models import Review

User = get_user_model()


class Command(BaseCommand):
    help = 'Puebla la base de datos con datos realistas para PARKIA (Estacionamientos, Plazas, Usuarios, Reservas y Reseñas)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Iniciando seed de datos para PARKIA...'))

        # 1. Crear usuarios de prueba
        driver_user, _ = User.objects.get_or_create(
            email='conductor@parkia.com',
            defaults={
                'first_name': 'Carlos',
                'last_name': 'Méndez',
                'role': User.Role.DRIVER,
                'phone': '+54 9 11 4488-2211',
                'avatar_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
            }
        )
        driver_user.set_password('parkia123')
        driver_user.save()

        admin_user, _ = User.objects.get_or_create(
            email='admin@parkia.com',
            defaults={
                'first_name': 'Valentina',
                'last_name': 'Rossi',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'phone': '+54 9 11 8899-7733',
                'avatar_url': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
            }
        )
        admin_user.set_password('parkia123')
        admin_user.save()

        user_lucia, _ = User.objects.get_or_create(
            email='lucia.gomez@gmail.com',
            defaults={'first_name': 'Lucía', 'last_name': 'Gómez', 'role': User.Role.DRIVER, 'phone': '+54 9 11 9911-3322'}
        )
        user_lucia.set_password('parkia123')
        user_lucia.save()

        user_martin, _ = User.objects.get_or_create(
            email='martin.suarez@gmail.com',
            defaults={'first_name': 'Martín', 'last_name': 'Suárez', 'role': User.Role.DRIVER, 'phone': '+54 9 11 7722-1144'}
        )
        user_martin.set_password('parkia123')
        user_martin.save()

        self.stdout.write(self.style.SUCCESS('✓ Usuarios creados (conductor@parkia.com, admin@parkia.com / pass: parkia123)'))

        # 2. Datos de Estacionamientos (Buenos Aires)
        parkings_data = [
            {
                'name': 'Parkia Obelisco & Corrientes',
                'address': 'Av. Corrientes 1045, San Nicolás',
                'city': 'Buenos Aires',
                'latitude': -34.6037,
                'longitude': -58.3816,
                'description': 'Estacionamiento premium subterráneo ubicado a 50 metros del Obelisco y teatros de calle Corrientes. Cuenta con vigilancia 24hs, circuito cerrado de TV y plazas extra anchas.',
                'phone': '+54 11 4322-9090',
                'price_per_hour': 2400.00,
                'price_per_day': 18000.00,
                'opening_time': '00:00:00',
                'closing_time': '23:59:59',
                'is_24_hours': True,
                'capacity': 35,
                'rating': 4.9,
                'reviews_count': 128,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': True,
                'has_disabled_access': True,
                'has_car_wash': True,
                'has_valet': True,
                'image_url': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Estacionamiento Palermo Soho Hub',
                'address': 'Honduras 4820, Palermo',
                'city': 'Buenos Aires',
                'latitude': -34.5885,
                'longitude': -58.4283,
                'description': 'Ubicado en el epicentro gastronómico y de diseño de Palermo Soho. Fácil acceso, garita de seguridad, cámaras HD y cargadores rápidos para vehículos eléctricos.',
                'phone': '+54 11 4833-1122',
                'price_per_hour': 2100.00,
                'price_per_day': 16000.00,
                'opening_time': '07:00:00',
                'closing_time': '02:00:00',
                'is_24_hours': False,
                'capacity': 28,
                'rating': 4.8,
                'reviews_count': 94,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': True,
                'has_disabled_access': True,
                'has_car_wash': False,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Garage Plaza San Martín & Retiro',
                'address': 'Florida 980, Retiro',
                'city': 'Buenos Aires',
                'latitude': -34.5960,
                'longitude': -58.3755,
                'description': 'Ideal para personas de negocios y turistas. Conexión rápida con estación Retiro y Plaza San Martín. Plazas techadas y monitoreo permanente.',
                'phone': '+54 11 4311-6677',
                'price_per_hour': 1800.00,
                'price_per_day': 14000.00,
                'opening_time': '06:30:00',
                'closing_time': '23:30:00',
                'is_24_hours': False,
                'capacity': 30,
                'rating': 4.7,
                'reviews_count': 82,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': True,
                'has_car_wash': True,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Parkia Puerto Madero Dock 4',
                'address': 'Juana Manso 850, Puerto Madero',
                'city': 'Buenos Aires',
                'latitude': -34.6055,
                'longitude': -58.3628,
                'description': 'Estacionamiento moderno de alta categoría con acceso automatizado por matrícula. A pasos de los mejores restaurantes y torres corporativas de Puerto Madero.',
                'phone': '+54 11 4515-3344',
                'price_per_hour': 3200.00,
                'price_per_day': 24000.00,
                'opening_time': '00:00:00',
                'closing_time': '23:59:59',
                'is_24_hours': True,
                'capacity': 40,
                'rating': 4.9,
                'reviews_count': 160,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': True,
                'has_disabled_access': True,
                'has_car_wash': True,
                'has_valet': True,
                'image_url': 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'EcoPark Recoleta Village',
                'address': 'Vicente López 2050, Recoleta',
                'city': 'Buenos Aires',
                'latitude': -34.5878,
                'longitude': -58.3920,
                'description': 'Playa techada frente al Cementerio de la Recoleta, Plaza Francia y cines. Estructura moderna, señalización digital de plazas y atención personalizada.',
                'phone': '+54 11 4801-4455',
                'price_per_hour': 2300.00,
                'price_per_day': 17500.00,
                'opening_time': '07:00:00',
                'closing_time': '01:00:00',
                'is_24_hours': False,
                'capacity': 25,
                'rating': 4.8,
                'reviews_count': 110,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': True,
                'has_car_wash': False,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Central Belgrano & Juramento',
                'address': 'Av. Cabildo 2140, Belgrano',
                'city': 'Buenos Aires',
                'latitude': -34.5614,
                'longitude': -58.4568,
                'description': 'En pleno centro comercial de Belgrano, junto a estación Juramento del subte D. Entrada amplia apta para camionetas y SUV.',
                'phone': '+54 11 4782-9900',
                'price_per_hour': 1900.00,
                'price_per_day': 15000.00,
                'opening_time': '07:00:00',
                'closing_time': '23:00:00',
                'is_24_hours': False,
                'capacity': 30,
                'rating': 4.6,
                'reviews_count': 76,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': True,
                'has_car_wash': True,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'San Telmo Colonial Parking',
                'address': 'Defensa 840, San Telmo',
                'city': 'Buenos Aires',
                'latitude': -34.6186,
                'longitude': -58.3712,
                'description': 'Excelente opción para visitar la feria de San Telmo y Plaza Dorrego. Tarifas promocionales por estadía y personal de asistencia permanente.',
                'phone': '+54 11 4361-5544',
                'price_per_hour': 1600.00,
                'price_per_day': 12000.00,
                'opening_time': '08:00:00',
                'closing_time': '22:00:00',
                'is_24_hours': False,
                'capacity': 20,
                'rating': 4.5,
                'reviews_count': 64,
                'is_covered': False,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': False,
                'has_car_wash': False,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Tribunales Express Garage',
                'address': 'Lavalle 1320, San Nicolás',
                'city': 'Buenos Aires',
                'latitude': -34.6025,
                'longitude': -58.3862,
                'description': 'Zona Tribunales y Teatro Colón. Rápida entrada y salida, sistema de cobro digital y cámaras de lectura de placas.',
                'phone': '+54 11 4371-2288',
                'price_per_hour': 2200.00,
                'price_per_day': 16500.00,
                'opening_time': '06:00:00',
                'closing_time': '22:00:00',
                'is_24_hours': False,
                'capacity': 26,
                'rating': 4.7,
                'reviews_count': 88,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': True,
                'has_car_wash': False,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1508873696983-2df570464756?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1508873696983-2df570464756?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Parkia Villa Crespo Outlet',
                'address': 'Aguirre 750, Villa Crespo',
                'city': 'Buenos Aires',
                'latitude': -34.5956,
                'longitude': -58.4374,
                'description': 'Playa cómoda ubicada en la zona de outlets de indumentaria y café de especialidad. Tarifas económicas y espacios de fácil maniobra.',
                'phone': '+54 11 4774-8833',
                'price_per_hour': 1500.00,
                'price_per_day': 11500.00,
                'opening_time': '08:00:00',
                'closing_time': '21:00:00',
                'is_24_hours': False,
                'capacity': 22,
                'rating': 4.6,
                'reviews_count': 50,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': False,
                'has_disabled_access': True,
                'has_car_wash': True,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=800&auto=format&fit=crop&q=80'
                ]
            },
            {
                'name': 'Colegiales Plaza Garage',
                'address': 'Federico Lacroze 2890, Colegiales',
                'city': 'Buenos Aires',
                'latitude': -34.5768,
                'longitude': -58.4489,
                'description': 'Estacionamiento 24hs en Colegiales, cerca de productoras y polo gastronómico de Av. Álvarez Thomas y Lacroze. Cobertura total y cámaras 4K.',
                'phone': '+54 11 4552-7711',
                'price_per_hour': 1750.00,
                'price_per_day': 13000.00,
                'opening_time': '00:00:00',
                'closing_time': '23:59:59',
                'is_24_hours': True,
                'capacity': 24,
                'rating': 4.7,
                'reviews_count': 42,
                'is_covered': True,
                'has_security': True,
                'has_ev_charging': True,
                'has_disabled_access': True,
                'has_car_wash': False,
                'has_valet': False,
                'image_url': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80',
                'gallery': [
                    'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=800&auto=format&fit=crop&q=80'
                ]
            }
        ]

        created_parkings = []
        for p_data in parkings_data:
            parking, created = Parking.objects.update_or_create(
                name=p_data['name'],
                defaults=p_data
            )
            created_parkings.append(parking)

            # Generar espacios de estacionamiento (A01 a A10, B01 a B10)
            existing_codes = set(parking.spaces.values_list('code', flat=True))
            spaces_to_create = []
            
            num_spaces = min(parking.capacity, 20)
            for i in range(1, num_spaces + 1):
                sector = 'A' if i <= 10 else 'B'
                num = i if i <= 10 else i - 10
                code = f"{sector}{num:02d}"
                
                if code not in existing_codes:
                    space_type = ParkingSpace.SpaceType.STANDARD
                    if code == 'A01' and parking.has_disabled_access:
                        space_type = ParkingSpace.SpaceType.DISABLED
                    elif code == 'A02' and parking.has_ev_charging:
                        space_type = ParkingSpace.SpaceType.EV
                    elif code in ['B09', 'B10']:
                        space_type = ParkingSpace.SpaceType.LARGE

                    # Random status
                    status_choice = random.choice([
                        ParkingSpace.Status.AVAILABLE,
                        ParkingSpace.Status.AVAILABLE,
                        ParkingSpace.Status.AVAILABLE,
                        ParkingSpace.Status.OCCUPIED,
                        ParkingSpace.Status.RESERVED
                    ])

                    spaces_to_create.append(ParkingSpace(
                        parking=parking,
                        code=code,
                        floor='Planta Baja' if sector == 'A' else 'Primer Piso',
                        space_type=space_type,
                        status=status_choice
                    ))

            if spaces_to_create:
                ParkingSpace.objects.bulk_create(spaces_to_create)

        self.stdout.write(self.style.SUCCESS(f'✓ {len(created_parkings)} Estacionamientos creados con sus espacios'))

        # 3. Favoritos para el conductor
        if len(created_parkings) >= 3:
            ParkingFavorite.objects.get_or_create(user=driver_user, parking=created_parkings[0])
            ParkingFavorite.objects.get_or_create(user=driver_user, parking=created_parkings[1])
            ParkingFavorite.objects.get_or_create(user=driver_user, parking=created_parkings[3])

        # 4. Reservas de prueba (Pasadas, Hoy y Futuras)
        today = date.today()
        sample_parkings = created_parkings[:4]

        # Reserva Activa / Próxima para el Conductor
        p1 = sample_parkings[0]
        space_p1 = p1.spaces.filter(status=ParkingSpace.Status.AVAILABLE).first() or p1.spaces.first()
        Reservation.objects.get_or_create(
            booking_code='PK-892401',
            defaults={
                'user': driver_user,
                'parking': p1,
                'space': space_p1,
                'vehicle_plate': 'AF 342 KL',
                'vehicle_model': 'Volkswagen Golf TSI',
                'date': today + timedelta(days=1),
                'start_time': time(14, 0),
                'end_time': time(18, 30),
                'total_hours': 4.5,
                'total_price': float(p1.price_per_hour) * 4.5,
                'status': Reservation.Status.CONFIRMED
            }
        )

        # Reserva de Hoy
        p2 = sample_parkings[1]
        space_p2 = p2.spaces.filter(status=ParkingSpace.Status.AVAILABLE).first() or p2.spaces.first()
        Reservation.objects.get_or_create(
            booking_code='PK-774912',
            defaults={
                'user': driver_user,
                'parking': p2,
                'space': space_p2,
                'vehicle_plate': 'AF 342 KL',
                'vehicle_model': 'Volkswagen Golf TSI',
                'date': today,
                'start_time': time(19, 0),
                'end_time': time(22, 0),
                'total_hours': 3.0,
                'total_price': float(p2.price_per_hour) * 3.0,
                'status': Reservation.Status.CONFIRMED
            }
        )

        # Reservas Pasadas para gráfico y estadísticas
        past_dates = [today - timedelta(days=i) for i in range(1, 8)]
        users_pool = [driver_user, user_lucia, user_martin]

        for p in created_parkings[:6]:
            for d in past_dates:
                # 1 to 3 bookings per day
                for _ in range(random.randint(1, 3)):
                    u = random.choice(users_pool)
                    sp = p.spaces.order_by('?').first()
                    start_h = random.choice([9, 11, 14, 16, 18])
                    dur = random.choice([1.5, 2.0, 3.0, 4.0])
                    end_h = int(start_h + dur)
                    end_m = 30 if dur % 1 != 0 else 0
                    
                    price = round(dur * float(p.price_per_hour), 2)
                    status_c = random.choice([Reservation.Status.COMPLETED, Reservation.Status.COMPLETED, Reservation.Status.CANCELLED])
                    
                    Reservation.objects.create(
                        booking_code=generate_booking_code(),
                        user=u,
                        parking=p,
                        space=sp,
                        vehicle_plate=f"AE {random.randint(100, 999)} ZW",
                        vehicle_model="Toyota Corolla",
                        date=d,
                        start_time=time(start_h, 0),
                        end_time=time(end_h, end_m),
                        total_hours=dur,
                        total_price=price,
                        status=status_c,
                        cancellation_reason="Cambio de itinerario" if status_c == Reservation.Status.CANCELLED else ""
                    )

        # 5. Reseñas
        reviews_data = [
            {'user': driver_user, 'parking': created_parkings[0], 'rating': 5, 'comment': 'Excelente servicio, entré con el código y el lugar estaba reservado y señalizado con mi nombre. Muy seguro.'},
            {'user': user_lucia, 'parking': created_parkings[0], 'rating': 5, 'comment': 'La mejor ubicación para ir al teatro sobre Corrientes. Súper rápido el acceso.'},
            {'user': user_martin, 'parking': created_parkings[1], 'rating': 5, 'comment': 'Pude cargar mi auto eléctrico sin problemas mientras almorzaba en Palermo.'},
            {'user': driver_user, 'parking': created_parkings[1], 'rating': 4, 'comment': 'Muy limpio y bien iluminado. El personal fue muy amable.'},
            {'user': user_lucia, 'parking': created_parkings[3], 'rating': 5, 'comment': 'Impecable estacionamiento en Puerto Madero. Plazas amplias y muy cómodo.'},
        ]

        for r in reviews_data:
            Review.objects.get_or_create(
                user=r['user'],
                parking=r['parking'],
                defaults={'rating': r['rating'], 'comment': r['comment']}
            )

        self.stdout.write(self.style.SUCCESS('✓ Reservas de ejemplo y reseñas creadas con éxito.'))
        self.stdout.write(self.style.SUCCESS('🎉 SEED COMPLETADO SATISFACTORIAMENTE PARA PARKIA.'))
