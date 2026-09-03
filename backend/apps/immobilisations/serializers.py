from rest_framework import serializers

from .models import Famille

#get/patch/post famille
class FamilleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Famille
        fields = [
            "id_famille",
            "code",
            "nom",
            "description",
            "icone",
            "taux_amortissement",
            "statut",
            "entreprise",
        ]

        read_only_fields = [
            "id_famille",
            "statut",
            "entreprise",
        ]

    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code de la famille est obligatoire."
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

        queryset = Famille.objects.filter(
            entreprise=entreprise,
            code__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Une famille avec ce code existe déjà dans votre entreprise."
            )

        return value

    def validate_taux_amortissement(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Le taux d'amortissement ne peut pas être négatif."
            )

        return value

    def create(self, validated_data):
        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["entreprise"] = request.user.entreprise

        return super().create(validated_data)
#Archive a family
class FamilleArchiveSerializer(serializers.Serializer):

    def save(self, **kwargs):
        famille = self.context["famille"]

        if famille.statut == Famille.Statut.ARCHIVEE:
            raise serializers.ValidationError(
                "Cette famille est déjà archivée."
            )

        famille.statut = Famille.Statut.ARCHIVEE
        famille.save(update_fields=["statut"])

        return famille
#Restore a family
class FamilleRestoreSerializer(serializers.Serializer):

    def save(self, **kwargs):
        famille = self.context["famille"]

        if famille.statut == Famille.Statut.ACTIVE:
            raise serializers.ValidationError(
                "Cette famille est déjà active."
            )

        famille.statut = Famille.Statut.ACTIVE
        famille.save(update_fields=["statut"])

        return famille