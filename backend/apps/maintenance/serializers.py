from rest_framework import serializers
from .models import TypeEntretien

class TypeEntretienSerializer(serializers.ModelSerializer):

    class Meta:
        model = TypeEntretien
        fields = [
            "id",
            "code",
            "nom",
            "description",
            "statut",
            "entreprise",
        ]
        read_only_fields = [
            "id",
            "statut",
            "entreprise",
        ]

    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code du type d'entretien est obligatoire."
            )

        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        entreprise = request.user.entreprise

        if entreprise is None:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        queryset = TypeEntretien.objects.filter(
            entreprise=entreprise,
            code__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Un type d'entretien avec ce code existe déjà dans votre entreprise."
            )

        return value

    def validate_nom(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom du type d'entretien est obligatoire."
            )

        return value

    def validate_description(self, value):
        return value.strip()

    def create(self, validated_data):
        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["entreprise"] = request.user.entreprise

        return super().create(validated_data)
