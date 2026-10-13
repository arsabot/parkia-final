import math
from django.db.models import Q
from rest_framework import viewsets, permissions, status, views
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.users.permissions import IsAdminOrReadOnly, IsAdminRole
from .models import Parking, ParkingSpace, ParkingFavorite
from .serializers import (
    ParkingListSerializer,
    ParkingDetailSerializer,
    ParkingCreateUpdateSerializer,
    ParkingSpaceSerializer,
    ParkingFavoriteSerializer
)


def calculate_distance(lat1, lon1, lat2, lon2):
    """Calcula la distancia aproximada en km entre dos puntos usando la fórmula de Haversine"""
    R = 6371.0 # Radio de la Tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class ParkingViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        queryset = Parking.objects.all().prefetch_related('spaces', 'favorited_by')
        
        # Drivers and guests should only see active parkings
        if not (self.request.user.is_authenticated and (self.request.user.role == 'admin' or self.request.user.is_superuser)):
            # If query param show_all is not set by admin
            queryset = queryset.filter(is_active=True)

        # Search by name, address, or city
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(address__icontains=search) |
                Q(city__icontains=search) |
                Q(description__icontains=search)
            )

        # Filters
        max_price = self.request.query_params.get('max_price')
        if max_price:
            try:
                queryset = queryset.filter(price_per_hour__lte=float(max_price))
            except ValueError:
                pass

        if self.request.query_params.get('is_covered') == 'true':
            queryset = queryset.filter(is_covered=True)
        if self.request.query_params.get('has_security') == 'true':
            queryset = queryset.filter(has_security=True)
        if self.request.query_params.get('has_ev_charging') == 'true':
            queryset = queryset.filter(has_ev_charging=True)
        if self.request.query_params.get('has_disabled_access') == 'true':
            queryset = queryset.filter(has_disabled_access=True)
        if self.request.query_params.get('is_24_hours') == 'true':
            queryset = queryset.filter(is_24_hours=True)

        # Sorting
        sort_by = self.request.query_params.get('sort_by', 'recommended')
        if sort_by == 'price_asc':
            queryset = queryset.order_by('price_per_hour')
        elif sort_by == 'price_desc':
            queryset = queryset.order_by('-price_per_hour')
        elif sort_by == 'rating_desc':
            queryset = queryset.order_by('-rating')
        elif sort_by == 'capacity_desc':
            queryset = queryset.order_by('-capacity')

        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ParkingCreateUpdateSerializer
        elif self.action == 'retrieve':
            return ParkingDetailSerializer
        return ParkingListSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        
        # Distance calculation if user coords provided
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        max_distance = request.query_params.get('max_distance')
        sort_by = request.query_params.get('sort_by')

        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        data = list(serializer.data)

        if user_lat and user_lng:
            try:
                u_lat = float(user_lat)
                u_lng = float(user_lng)
                for item in data:
                    item['distance_km'] = round(calculate_distance(u_lat, u_lng, item['latitude'], item['longitude']), 2)

                if max_distance:
                    try:
                        max_d = float(max_distance)
                        data = [item for item in data if item.get('distance_km', 0) <= max_d]
                    except ValueError:
                        pass

                if sort_by == 'distance_asc' or sort_by == 'closest':
                    data.sort(key=lambda x: x.get('distance_km', 999999))
            except ValueError:
                pass

        return Response(data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_parkings(self, request):
        """Devuelve únicamente los estacionamientos asignados al dueño actual"""
        if request.user.role == 'owner' and not request.user.is_superuser:
            qs = Parking.objects.filter(owner=request.user)
        else:
            qs = Parking.objects.all()
        serializer = ParkingListSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def spaces(self, request, pk=None):
        parking = self.get_object()
        # Si es dueño, verificar que sea su garaje
        if request.user.is_authenticated and request.user.role == 'owner' and parking.owner != request.user and not request.user.is_superuser:
            return Response({'error': 'No tienes permiso para ver o administrar plazas de otro garaje.'}, status=status.HTTP_403_FORBIDDEN)
        spaces = parking.spaces.all()
        serializer = ParkingSpaceSerializer(spaces, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        parking = self.get_object()
        fav = ParkingFavorite.objects.filter(user=request.user, parking=parking).first()
        if fav:
            fav.delete()
            return Response({'is_favorite': False, 'message': 'Eliminado de favoritos.'})
        else:
            ParkingFavorite.objects.create(user=request.user, parking=parking)
            return Response({'is_favorite': True, 'message': 'Agregado a favoritos.'})


class ParkingSpaceViewSet(viewsets.ModelViewSet):
    serializer_class = ParkingSpaceSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        user = self.request.user
        queryset = ParkingSpace.objects.all()
        # Si es dueño de garaje, restringir a los espacios de su propio garaje
        if user.is_authenticated and user.role == 'owner' and not user.is_superuser:
            queryset = queryset.filter(parking__owner=user)

        parking_id = self.request.query_params.get('parking_id')
        if parking_id:
            queryset = queryset.filter(parking_id=parking_id)
        return queryset

    @action(detail=True, methods=['patch'])
    def set_status(self, request, pk=None):
        space = self.get_object()
        # Si es dueño de garaje, verificar que sea el propietario
        if request.user.role == 'owner' and space.parking.owner != request.user and not request.user.is_superuser:
            return Response({'error': 'No tienes permiso para modificar plazas de otro estacionamiento.'}, status=status.HTTP_403_FORBIDDEN)

        new_status = request.data.get('status')
        if new_status not in [choice[0] for choice in ParkingSpace.Status.choices]:
            return Response({'error': 'Estado no válido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        space.status = new_status
        space.save()
        return Response(ParkingSpaceSerializer(space).data)


class FavoritesListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        favorites = ParkingFavorite.objects.filter(user=request.user).select_related('parking')
        serializer = ParkingFavoriteSerializer(favorites, many=True, context={'request': request})
        return Response(serializer.data)
