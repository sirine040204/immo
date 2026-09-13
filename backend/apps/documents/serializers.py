from rest_framework import serializers
from django.utils import timezone
from ..immobilisations.models import Immobilisation


from .models import (
    Document,
    TypeDocument,
)
#type documnet serializer
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

#type document archive serializer
class TypeDocumentArchiveSerializer(serializers.Serializer):

    def validate(self, attrs):
        type_document = self.context["type_document"]

        if type_document.statut == TypeDocument.Statut.ARCHIVE:
            raise serializers.ValidationError(
                "Ce type de document est déjà archivé."
            )

        return attrs

#type document restore serializer
class TypeDocumentRestoreSerializer(serializers.Serializer):

    def validate(self, attrs):
        type_document = self.context["type_document"]

        if type_document.statut == TypeDocument.Statut.ACTIF:
            raise serializers.ValidationError(
                "Ce type de document est déjà actif."
            )

        return attrs

#document serializer
class DocumentSerializer(serializers.ModelSerializer):

    class Meta:
        model = Document

        fields = [
            "id",
            "entreprise",
            "immobilisation",
            "type_document",
            "nom",
            "description",
            "fichier",
            "date_document",
            "date_debut_validite",
            "date_fin_validite",
            "statut",
            "date_ajout",
            "ajoute_par",
        ]

        read_only_fields = [
            "id",
            "entreprise",
            "statut",
            "date_ajout",
            "ajoute_par",
        ]

    # ============================================================
    # NOM
    # ============================================================

    def validate_nom(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom du document est obligatoire."
            )

        return value

    # ============================================================
    # FICHIER
    # ============================================================

    def validate_fichier(self, fichier):

        max_size = 10 * 1024 * 1024  # 10 MB

        if fichier.size > max_size:
            raise serializers.ValidationError(
                "La taille du fichier ne doit pas dépasser 10 MB."
            )

        allowed_extensions = [
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".jpg",
            ".jpeg",
            ".png",
        ]

        filename = fichier.name.lower()

        if not any(
            filename.endswith(extension)
            for extension in allowed_extensions
        ):
            raise serializers.ValidationError(
                "Ce type de fichier n'est pas autorisé."
            )

        return fichier

    # ============================================================
    # DATE DU DOCUMENT
    # ============================================================

    def validate_date_document(self, value):

        today = timezone.localdate()

        if value > today:
            raise serializers.ValidationError(
                "La date du document ne peut pas être dans le futur."
            )

        return value

    # ============================================================
    # VALIDATION GLOBALE
    # ============================================================

    def validate(self, attrs):

        request = self.context.get("request")
        instance = self.instance

        # ========================================================
        # AUTHENTIFICATION
        # ========================================================

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        if not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Utilisateur non authentifié."
            )

        entreprise = getattr(request.user, "entreprise", None)

        if entreprise is None:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        # ========================================================
        # VALEURS ACTUELLES POUR POST / PUT / PATCH
        # ========================================================

        type_document = attrs.get(
            "type_document",
            instance.type_document if instance else None
        )

        immobilisation = attrs.get(
            "immobilisation",
            instance.immobilisation if instance else None
        )

        date_document = attrs.get(
            "date_document",
            instance.date_document if instance else None
        )

        date_debut = attrs.get(
            "date_debut_validite",
            instance.date_debut_validite if instance else None
        )

        date_fin = attrs.get(
            "date_fin_validite",
            instance.date_fin_validite if instance else None
        )

        # ========================================================
        # TYPE DOCUMENT
        # ========================================================

        if type_document is None:
            raise serializers.ValidationError({
                "type_document": (
                    "Le type de document est obligatoire."
                )
            })

        if type_document.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError({
                "type_document": (
                    "Ce type de document n'appartient pas "
                    "à votre entreprise."
                )
            })

        if type_document.statut != TypeDocument.Statut.ACTIF:
            raise serializers.ValidationError({
                "type_document": (
                    "Un type de document archivé ne peut pas "
                    "être utilisé."
                )
            })

        # ========================================================
        # IMMOBILISATION
        # ========================================================

        if immobilisation is not None:

            if immobilisation.entreprise_id != entreprise.id_entreprise:
                raise serializers.ValidationError({
                    "immobilisation": (
                        "Cette immobilisation n'appartient pas "
                        "à votre entreprise."
                    )
                })

            # Important :
            # On ne vérifie PAS que le statut est ACTIVE.
            # Une immobilisation CREEE, ACTIVE, HORS_SERVICE,
            # REFORMEE ou ARCHIVEE peut avoir des documents.

        # ========================================================
        # DATE DU DOCUMENT
        # ========================================================

        if date_document is None:
            raise serializers.ValidationError({
                "date_document": (
                    "La date du document est obligatoire."
                )
            })

        today = timezone.localdate()

        if date_document > today:
            raise serializers.ValidationError({
                "date_document": (
                    "La date du document ne peut pas être "
                    "dans le futur."
                )
            })

        # ========================================================
        # COHÉRENCE DES DATES DE VALIDITÉ
        # ========================================================

        if date_debut is not None:

            if date_debut < date_document:
                raise serializers.ValidationError({
                    "date_debut_validite": (
                        "La date de début de validité ne peut pas "
                        "être antérieure à la date du document."
                    )
                })

        if date_fin is not None:

            if date_fin < date_document:
                raise serializers.ValidationError({
                    "date_fin_validite": (
                        "La date de fin de validité ne peut pas "
                        "être antérieure à la date du document."
                    )
                })

        if (
            date_debut is not None
            and date_fin is not None
            and date_fin < date_debut
        ):
            raise serializers.ValidationError({
                "date_fin_validite": (
                    "La date de fin de validité doit être "
                    "supérieure ou égale à la date de début."
                )
            })

        # ========================================================
        # RÈGLE D'ÉCHÉANCE DU TYPE DE DOCUMENT
        # ========================================================

        if type_document.a_echeance:

            if date_fin is None:
                raise serializers.ValidationError({
                    "date_fin_validite": (
                        "La date de fin de validité est obligatoire "
                        "pour ce type de document."
                    )
                })

        else:

            attrs["date_debut_validite"] = None
            attrs["date_fin_validite"] = None

        return attrs

    # ============================================================
    # CRÉATION
    # ============================================================

    def create(self, validated_data):

        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["entreprise"] = request.user.entreprise
        validated_data["ajoute_par"] = request.user
        validated_data["statut"] = Document.Statut.ACTIF

        return super().create(validated_data)