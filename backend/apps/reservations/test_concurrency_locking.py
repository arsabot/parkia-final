import threading
from datetime import date, time, timedelta, datetime
from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status
from apps.parking.models import Parking, ParkingSpace
from apps.reservations.models import Reservation, SpaceLock

User = get_user_model()


class SpaceLockingIntegrationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_a = User.objects.create_user(
            email='user_a@parkia.com',
            password='Password123!',
            first_name='Usuario',
            last_name='A'
        )
        self.user_b = User.objects.create_user(
            email='user_b@parkia.com',
            password='Password123!',
            first_name='Usuario',
            last_name='B'
        )
        self.user_c = User.objects.create_user(
            email='user_c@parkia.com',
            password='Password123!',
            first_name='Usuario',
            last_name='C'
        )

        self.parking = Parking.objects.create(
            name='Estacionamiento Concurrencia Central',
            address='Av. Corrientes 1500',
            city='Buenos Aires',
            latitude=-34.6037,
            longitude=-58.3816,
            price_per_hour=2000.00,
            capacity=10
        )

        self.space_1 = ParkingSpace.objects.create(
            parking=self.parking,
            code='P01',
            floor='PB',
            space_type=ParkingSpace.SpaceType.STANDARD,
            status=ParkingSpace.Status.AVAILABLE
        )

        self.space_2 = ParkingSpace.objects.create(
            parking=self.parking,
            code='P02',
            floor='PB',
            space_type=ParkingSpace.SpaceType.STANDARD,
            status=ParkingSpace.Status.AVAILABLE
        )

        self.res_date = (date.today() + timedelta(days=1)).strftime('%Y-%m-%d')
        self.start_time = '10:00'
        self.end_time = '12:00'

    def test_01_user_a_locks_space_successfully(self):
        """Escenario: Usuario A bloquea una plaza disponible exitosamente."""
        self.client.force_authenticate(user=self.user_a)
        response = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_a_123',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertEqual(response.data['ttl_seconds'], 300)
        self.assertIn('expires_at', response.data)

        # Verificar que el estado de la plaza cambió a LOCKED
        self.space_1.refresh_from_db()
        self.assertEqual(self.space_1.status, ParkingSpace.Status.LOCKED)

    def test_02_user_b_rejected_when_locking_same_space(self):
        """Escenario: Usuario B intenta bloquear la misma plaza y recibe rechazo 409 Conflict."""
        # 1. Usuario A adquiere el bloqueo
        self.client.force_authenticate(user=self.user_a)
        res_a = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_a_123',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        self.assertEqual(res_a.status_code, status.HTTP_201_CREATED)

        # 2. Usuario B intenta bloquearla
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_b_456',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        self.assertEqual(res_b.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res_b.data['code'], 'LOCKED_BY_OTHER')
        self.assertIn('seleccionada por otro usuario', res_b.data['error'])

    def test_03_user_a_confirms_reservation_and_space_becomes_reserved(self):
        """Escenario: Usuario A confirma reserva; la plaza pasa a RESERVED y el lock a CONVERTED."""
        self.client.force_authenticate(user=self.user_a)
        lock_res = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_a_123',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        lock_id = lock_res.data['lock_id']

        # Confirmar reserva
        booking_res = self.client.post('/api/reservations/', {
            'parking': self.parking.id,
            'space': self.space_1.id,
            'vehicle_plate': 'AA123BB',
            'vehicle_model': 'Ford Fiesta',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
            'payment_method': 'Mercado Pago',
            'payment_status': 'paid',
            'lock_id': lock_id,
            'session_id': 'sess_user_a_123',
        })
        self.assertEqual(booking_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(booking_res.data['reservation']['status'], 'confirmed')

        # Verificar estados finales
        self.space_1.refresh_from_db()
        self.assertEqual(self.space_1.status, ParkingSpace.Status.RESERVED)

        lock = SpaceLock.objects.get(id=lock_id)
        self.assertEqual(lock.status, SpaceLock.Status.CONVERTED)

    def test_04_user_c_rejected_after_reservation_confirmed(self):
        """Escenario: Usuario C intenta bloquear la plaza ya confirmada y es rechazado."""
        # Reserva previa confirmada
        Reservation.objects.create(
            user=self.user_a,
            parking=self.parking,
            space=self.space_1,
            vehicle_plate='AA123BB',
            date=datetime.strptime(self.res_date, '%Y-%m-%d').date(),
            start_time=datetime.strptime(self.start_time, '%H:%M').time(),
            end_time=datetime.strptime(self.end_time, '%H:%M').time(),
            total_price=4000.00,
            status=Reservation.Status.CONFIRMED
        )

        self.client.force_authenticate(user=self.user_c)
        res = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_c_789',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(res.data['code'], 'ALREADY_RESERVED')

    def test_05_expired_lock_returns_space_to_available_and_allows_user_b(self):
        """Escenario: Un bloqueo de 5 minutos vence; la plaza vuelve a disponible y Usuario B la puede tomar."""
        # Bloqueo creado en el pasado (expirado)
        past_time = timezone.now() - timedelta(minutes=10)
        lock = SpaceLock.objects.create(
            space=self.space_1,
            parking=self.parking,
            user=self.user_a,
            session_id='sess_user_a_old',
            date=datetime.strptime(self.res_date, '%Y-%m-%d').date(),
            start_time=datetime.strptime(self.start_time, '%H:%M').time(),
            end_time=datetime.strptime(self.end_time, '%H:%M').time(),
            status=SpaceLock.Status.ACTIVE,
            expires_at=past_time
        )
        self.space_1.status = ParkingSpace.Status.LOCKED
        self.space_1.save()

        # Usuario B intenta bloquear la misma plaza
        self.client.force_authenticate(user=self.user_b)
        res_b = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_b_new',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        self.assertEqual(res_b.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res_b.data['success'])

        # Verificar que el bloqueo anterior quedó marcado como EXPIRED
        lock.refresh_from_db()
        self.assertEqual(lock.status, SpaceLock.Status.EXPIRED)

    def test_06_user_can_release_lock_voluntarily(self):
        """Escenario: El usuario libera proactivamente su bloqueo."""
        self.client.force_authenticate(user=self.user_a)
        lock_res = self.client.post('/api/reservations/lock_space/', {
            'space_id': self.space_1.id,
            'parking_id': self.parking.id,
            'session_id': 'sess_user_a_rel',
            'date': self.res_date,
            'start_time': self.start_time,
            'end_time': self.end_time,
        })
        lock_id = lock_res.data['lock_id']

        rel_res = self.client.post('/api/reservations/release_lock/', {
            'lock_id': lock_id,
            'session_id': 'sess_user_a_rel',
        })
        self.assertEqual(rel_res.status_code, status.HTTP_200_OK)
        self.assertTrue(rel_res.data['released'])

        self.space_1.refresh_from_db()
        self.assertEqual(self.space_1.status, ParkingSpace.Status.AVAILABLE)


class ConcurrencyStressTests(TransactionTestCase):
    """
    Prueba de alta concurrencia con TransactionTestCase (transacciones reales y commits).
    Simula 20 solicitudes simultáneas compitiendo por la misma plaza exacta en el mismo milisegundo.
    """
    def setUp(self):
        self.parking = Parking.objects.create(
            name='Estacionamiento High Concurrency',
            address='Av. 9 de Julio 1000',
            city='Buenos Aires',
            latitude=-34.6037,
            longitude=-58.3816,
            price_per_hour=2500.00,
            capacity=1
        )
        self.target_space = ParkingSpace.objects.create(
            parking=self.parking,
            code='VIP-01',
            floor='PB',
            space_type=ParkingSpace.SpaceType.STANDARD,
            status=ParkingSpace.Status.AVAILABLE
        )
        self.res_date = (date.today() + timedelta(days=2)).strftime('%Y-%m-%d')
        self.start_time = '14:00'
        self.end_time = '16:00'

    def test_twenty_concurrent_requests_exact_one_winner(self):
        """
        Simular 20 usuarios concurrentes intentando bloquear la plaza VIP-01 al mismo tiempo.
        EXACTAMENTE uno debe ganar (HTTP 201 Created) y los otros 19 deben ser rechazados (HTTP 409 Conflict).
        """
        n_threads = 20
        results = []
        barrier = threading.Barrier(n_threads)

        def worker(thread_idx):
            client = APIClient()
            session_id = f"stress_sess_{thread_idx}"
            # Esperar a que todos los hilos estén listos para disparar exactamente en el mismo instante
            barrier.wait()
            try:
                res = client.post('/api/reservations/lock_space/', {
                    'space_id': self.target_space.id,
                    'parking_id': self.parking.id,
                    'session_id': session_id,
                    'date': self.res_date,
                    'start_time': self.start_time,
                    'end_time': self.end_time,
                })
                results.append((res.status_code, res.data))
            except Exception as ex:
                results.append((500, str(ex)))

        threads = []
        for i in range(n_threads):
            t = threading.Thread(target=worker, args=(i,))
            threads.append(t)
            t.start()

        for t in threads:
            t.join()

        success_count = sum(1 for code, _ in results if code == status.HTTP_201_CREATED)
        conflict_count = sum(1 for code, _ in results if code == status.HTTP_409_CONFLICT)

        # Verificación estricta del criterio de aceptación:
        self.assertEqual(
            success_count, 1,
            f"Se esperaba exactamente 1 ganador entre 20 competidores concurrentes, pero hubo {success_count}."
        )
        self.assertEqual(
            conflict_count, n_threads - 1,
            f"Se esperaban {n_threads - 1} rechazos por colisión (409 Conflict), pero hubo {conflict_count}."
        )

        # Comprobar que en la base de datos existe exactamente 1 bloqueo activo
        active_locks = SpaceLock.objects.filter(
            space=self.target_space,
            status=SpaceLock.Status.ACTIVE
        ).count()
        self.assertEqual(active_locks, 1)
