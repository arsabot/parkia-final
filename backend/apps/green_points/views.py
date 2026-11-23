from rest_framework import views, permissions, status
from rest_framework.response import Response
from .services import get_user_green_points_summary, calculate_causes_totals


class GreenPointsSummaryView(views.APIView):
    """
    Endpoint principal de Green Points del usuario.
    Devuelve saldo, historial, puntos faltantes para descuento,
    si hay descuento disponible (>= 100 pts), impacto ecológico (km y CO2)
    y total destinado a las causas.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        summary = get_user_green_points_summary(request.user)
        return Response(summary, status=status.HTTP_200_OK)


class CausesStatsView(views.APIView):
    """
    Endpoint público/general del programa Park for Good.
    Devuelve el total acumulado destinado a las causas:
    - Ambiente (ONGs como PlantArg, Plantarse)
    - Inclusión (ONGs como Fundación Rumbos, Acceso Ya, Fundación TINC)
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        causes = calculate_causes_totals()
        return Response(causes, status=status.HTTP_200_OK)
