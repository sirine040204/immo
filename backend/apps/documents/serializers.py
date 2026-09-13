from rest_framework import serializers

from .models import TypeDocument


class TypeDocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = TypeDocument
        fields = [
            "id_type_document",
            "entreprise",
            "code",
            "nom",
            "description",
            "a_echeance",
            "statut",
        ]

        read_only_fields = [
            "id_type_document",
            "entreprise",
            "statut",
        ]

    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code du type de document est obligatoire."
            )

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Utilisateur non authentifié."
            )

        entreprise = request.user.entreprise

        if not entreprise:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        queryset = TypeDocument.objects.filter(
            entreprise=entreprise,
            code__iexact=value,
        )

        # Pendant une modification, exclure l'objet actuel.
        if self.instance:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Un type de document avec ce code existe déjà."
            )

        return value

    def validate_nom(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom du type de document est obligatoire."
            )

        return value

    def validate(self, attrs):
        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Utilisateur non authentifié."
            )

        if not request.user.entreprise:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        return attrs

    def create(self, validated_data):
        request = self.context["request"]

        validated_data["entreprise"] = request.user.entreprise
        validated_data["statut"] = TypeDocument.Statut.ACTIF

        return super().create(validated_data)


class TypeDocumentArchiveSerializer(serializers.Serializer):

    def validate(self, attrs):
        type_document = self.context["type_document"]

        if type_document.statut == TypeDocument.Statut.ARCHIVE:
            raise serializers.ValidationError(
                "Ce type de document est déjà archivé."
            )

        return attrs


class TypeDocumentRestoreSerializer(serializers.Serializer):

    def validate(self, attrs):
        type_document = self.context["type_document"]

        if type_document.statut == TypeDocument.Statut.ACTIF:
            raise serializers.ValidationError(
                "Ce type de document est déjà actif."
            )

        return attrs