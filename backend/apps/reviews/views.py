from rest_framework import viewsets, permissions
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

    def get_queryset(self):
        queryset = Review.objects.select_related('user', 'parking').all()
        # Editar o borrar: solo tus propias reseñas (un admin puede todas).
        # Las ajenas devuelven 404, así no se puede saber si existen.
        if self.action in ['update', 'partial_update', 'destroy']:
            user = self.request.user
            if not user.is_super_admin:
                queryset = queryset.filter(user=user)
        parking_id = self.request.query_params.get('parking_id')
        if parking_id:
            queryset = queryset.filter(parking_id=parking_id)
        return queryset
