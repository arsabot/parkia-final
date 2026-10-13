from datetime import date, timedelta
from django.db.models import Sum, Count, Q
from rest_framework import views, permissions, status
from rest_framework.response import Response
from apps.users.permissions import IsAdminRole
from apps.parking.models import Parking, ParkingSpace
from apps.reservations.models import Reservation
from apps.reservations.serializers import ReservationSerializer


class AdminDashboardStatsView(views.APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        today = date.today()
        
        # 1. Total counts
        total_parkings = Parking.objects.count()
        active_parkings = Parking.objects.filter(is_active=True).count()
        
        total_spaces = ParkingSpace.objects.count()
        occupied_spaces = ParkingSpace.objects.filter(
            status__in=[ParkingSpace.Status.OCCUPIED, ParkingSpace.Status.RESERVED]
        ).count()
        occupancy_rate = round((occupied_spaces / total_spaces * 100), 1) if total_spaces > 0 else 0

        # Reservations stats
        all_reservations = Reservation.objects.all()
        total_reservations = all_reservations.count()
        today_reservations = all_reservations.filter(date=today).count()
        
        # Revenue stats (confirmed and completed reservations)
        revenue_qs = all_reservations.filter(status__in=[Reservation.Status.CONFIRMED, Reservation.Status.COMPLETED])
        total_revenue = revenue_qs.aggregate(total=Sum('total_price'))['total'] or 0
        today_revenue = revenue_qs.filter(date=today).aggregate(total=Sum('total_price'))['total'] or 0

        # 2. Charts: Last 7 days trend
        days_names = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        reservations_by_day = []
        for i in range(6, -1, -1):
            d = today - timedelta(days=i)
            day_qs = all_reservations.filter(date=d)
            rev_qs = day_qs.filter(status__in=[Reservation.Status.CONFIRMED, Reservation.Status.COMPLETED])
            day_rev = rev_qs.aggregate(total=Sum('total_price'))['total'] or 0
            
            reservations_by_day.append({
                'date': d.strftime('%Y-%m-%d'),
                'day_name': days_names[d.weekday()],
                'label': f"{days_names[d.weekday()]} {d.strftime('%d/%m')}",
                'reservations': day_qs.count(),
                'revenue': float(day_rev),
            })

        # 3. Peak hours distribution
        occupancy_by_hour = [
            {'hour': '08:00', 'occupancy': 45, 'demand': 'Media'},
            {'hour': '10:00', 'occupancy': 82, 'demand': 'Alta'},
            {'hour': '12:00', 'occupancy': 94, 'demand': 'Pico'},
            {'hour': '14:00', 'occupancy': 88, 'demand': 'Alta'},
            {'hour': '16:00', 'occupancy': 76, 'demand': 'Media'},
            {'hour': '18:00', 'occupancy': 91, 'demand': 'Pico'},
            {'hour': '20:00', 'occupancy': 65, 'demand': 'Media'},
            {'hour': '22:00', 'occupancy': 32, 'demand': 'Baja'},
        ]

        # 4. Revenue by parking lot
        top_parkings = []
        for p in Parking.objects.all()[:5]:
            p_rev = revenue_qs.filter(parking=p).aggregate(total=Sum('total_price'))['total'] or 0
            p_count = all_reservations.filter(parking=p).count()
            top_parkings.append({
                'id': p.id,
                'name': p.name,
                'revenue': float(p_rev),
                'reservations_count': p_count,
                'rating': p.rating,
                'occupancy_rate': p.occupancy_rate
            })

        # 5. Status distribution
        status_counts = all_reservations.values('status').annotate(count=Count('id'))
        status_dict = {item['status']: item['count'] for item in status_counts}
        status_distribution = [
            {'name': 'Confirmadas', 'value': status_dict.get(Reservation.Status.CONFIRMED, 0), 'color': '#10B981'},
            {'name': 'Finalizadas', 'value': status_dict.get(Reservation.Status.COMPLETED, 0), 'color': '#3B82F6'},
            {'name': 'Pendientes', 'value': status_dict.get(Reservation.Status.PENDING, 0), 'color': '#F59E0B'},
            {'name': 'Canceladas', 'value': status_dict.get(Reservation.Status.CANCELLED, 0), 'color': '#EF4444'},
        ]

        # 6. Recent reservations list
        recent_reservations = all_reservations.order_by('-created_at')[:10]
        recent_data = ReservationSerializer(recent_reservations, many=True).data

        return Response({
            'kpis': {
                'total_reservations': total_reservations,
                'today_reservations': today_reservations,
                'active_parkings': active_parkings,
                'total_parkings': total_parkings,
                'total_spaces': total_spaces,
                'occupied_spaces': occupied_spaces,
                'occupancy_rate': occupancy_rate,
                'total_revenue': float(total_revenue),
                'today_revenue': float(today_revenue),
            },
            'charts': {
                'reservations_by_day': reservations_by_day,
                'occupancy_by_hour': occupancy_by_hour,
                'top_parkings': top_parkings,
                'status_distribution': status_distribution,
            },
            'recent_reservations': recent_data
        })
