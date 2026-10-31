import re

from rest_framework import serializers

from .models import Claim

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]{2,}$')


class ClaimCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Claim
        fields = ['category', 'reservation_ref', 'description', 'contact']
        extra_kwargs = {'reservation_ref': {'required': False, 'allow_blank': True}}

    def validate_description(self, value):
        value = value.strip()
        if len(value) < 10:
            raise serializers.ValidationError('Describí el problema con al menos 10 caracteres.')
        return value

    def validate_contact(self, value):
        value = value.strip()
        if not (EMAIL_RE.match(value) or len(re.sub(r'\D', '', value)) >= 8):
            raise serializers.ValidationError('Ingresá un email válido o un teléfono de al menos 8 dígitos.')
        return value


class ClaimSerializer(serializers.ModelSerializer):
    category_label = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model = Claim
        fields = ['code', 'category', 'category_label', 'reservation_ref', 'status', 'response', 'created_at']
