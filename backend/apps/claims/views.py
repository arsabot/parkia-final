from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle

from .models import Claim
from .serializers import ClaimCreateSerializer, ClaimSerializer


class ClaimViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Reclamos del chatbot. Cada usuario solo ve y crea los suyos."""

    permission_classes = [IsAuthenticated]
    lookup_field = 'code'
    throttle_scope = 'claims_create'

    def get_throttles(self):
        # Límite de frecuencia solo al crear (evita spam).
        return [ScopedRateThrottle()] if self.action == 'create' else []

    def get_queryset(self):
        return Claim.objects.filter(user=self.request.user)

    def get_serializer_class(self):
        return ClaimCreateSerializer if self.action == 'create' else ClaimSerializer

    def create(self, request, *args, **kwargs):
        serializer = ClaimCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        claim = serializer.save(user=request.user)
        return Response(ClaimSerializer(claim).data, status=status.HTTP_201_CREATED)
