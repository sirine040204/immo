from rest_framework import serializers
from ..immobilisations.models import Famille
from .models import TypeEntretien, ModeleEntretien

#serialiseur type entretien
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

#serialiseur modele entretien
class ModeleEntretienSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModeleEntretien
        fields = [
            "id",
            "famille",
            "type_entretien",
            "code",
            "nom",
            "description",
            "type_planification",
            "periodicite",
            "unite_periodicite",
            "seuil_usage",
            "unite_usage",
            "date_fixe",
            "statut",
            "entreprise",
        ]
        read_only_fields = [
            "id",
            "statut",
            "entreprise",
        ]

    # =========================
    # CODE
    # =========================

    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code du modèle d'entretien est obligatoire."
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

        queryset = ModeleEntretien.objects.filter(
            entreprise=entreprise,
            code__iexact=value,
        )

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "Un modèle d'entretien avec ce code existe déjà dans votre entreprise."
            )

        return value

    # =========================
    # NOM
    # =========================

    def validate_nom(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le nom du modèle d'entretien est obligatoire."
            )

        return value

    # =========================
    # DESCRIPTION
    # =========================

    def validate_description(self, value):
        return value.strip()

    # =========================
    # FAMILLE
    # =========================

    def validate_famille(self, value):
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

        if value.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError(
                "La famille doit appartenir à votre entreprise."
            )

        if value.statut != Famille.Statut.ACTIVE:
            raise serializers.ValidationError(
                "La famille sélectionnée est archivée."
            )

        return value

    # =========================
    # TYPE ENTRETIEN
    # =========================

    def validate_type_entretien(self, value):
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

        if value.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError(
                "Le type d'entretien doit appartenir à votre entreprise."
            )

        if value.statut != TypeEntretien.Statut.ACTIF:
            raise serializers.ValidationError(
                "Le type d'entretien sélectionné est archivé."
            )

        return value

    # =========================
    # PLANIFICATION
    # =========================

    def validate(self, attrs):
        # On construit l'état FINAL de l'objet.
        # Cela permet de gérer correctement les PATCH.

        if self.instance is not None:
            final_data = {
                "type_planification": self.instance.type_planification,
                "periodicite": self.instance.periodicite,
                "unite_periodicite": self.instance.unite_periodicite,
                "seuil_usage": self.instance.seuil_usage,
                "unite_usage": self.instance.unite_usage,
                "date_fixe": self.instance.date_fixe,
            }

            final_data.update({
                key: value
                for key, value in attrs.items()
                if key in final_data
            })

        else:
            final_data = {
                "type_planification": attrs.get("type_planification"),
                "periodicite": attrs.get("periodicite"),
                "unite_periodicite": attrs.get("unite_periodicite"),
                "seuil_usage": attrs.get("seuil_usage"),
                "unite_usage": attrs.get("unite_usage"),
                "date_fixe": attrs.get("date_fixe"),
            }

        type_planification = final_data["type_planification"]
        periodicite = final_data["periodicite"]
        unite_periodicite = final_data["unite_periodicite"]
        seuil_usage = final_data["seuil_usage"]
        unite_usage = final_data["unite_usage"]
        date_fixe = final_data["date_fixe"]

        # =========================
        # TYPE OBLIGATOIRE
        # =========================

        if not type_planification:
            raise serializers.ValidationError({
                "type_planification":
                    "Le type de planification est obligatoire."
            })

        # =========================
        # TEMPS
        # =========================

        if type_planification == ModeleEntretien.TypePlanification.TEMPS:

            if periodicite is None:
                raise serializers.ValidationError({
                    "periodicite":
                        "La périodicité est obligatoire pour une planification par temps."
                })

            if periodicite <= 0:
                raise serializers.ValidationError({
                    "periodicite":
                        "La périodicité doit être supérieure à 0."
                })

            if not unite_periodicite:
                raise serializers.ValidationError({
                    "unite_periodicite":
                        "L'unité de périodicité est obligatoire pour une planification par temps."
                })

            if seuil_usage is not None:
                raise serializers.ValidationError({
                    "seuil_usage":
                        "Le seuil d'usage ne doit pas être renseigné pour une planification par temps."
                })

            if unite_usage is not None:
                raise serializers.ValidationError({
                    "unite_usage":
                        "L'unité d'usage ne doit pas être renseignée pour une planification par temps."
                })

            if date_fixe is not None:
                raise serializers.ValidationError({
                    "date_fixe":
                        "La date fixe ne doit pas être renseignée pour une planification par temps."
                })

        # =========================
        # USAGE
        # =========================

        elif type_planification == ModeleEntretien.TypePlanification.USAGE:

            if seuil_usage is None:
                raise serializers.ValidationError({
                    "seuil_usage":
                        "Le seuil d'usage est obligatoire pour une planification par usage."
                })

            if seuil_usage <= 0:
                raise serializers.ValidationError({
                    "seuil_usage":
                        "Le seuil d'usage doit être supérieur à 0."
                })

            if not unite_usage:
                raise serializers.ValidationError({
                    "unite_usage":
                        "L'unité d'usage est obligatoire pour une planification par usage."
                })

            if periodicite is not None:
                raise serializers.ValidationError({
                    "periodicite":
                        "La périodicité ne doit pas être renseignée pour une planification par usage."
                })

            if unite_periodicite is not None:
                raise serializers.ValidationError({
                    "unite_periodicite":
                        "L'unité de périodicité ne doit pas être renseignée pour une planification par usage."
                })

            if date_fixe is not None:
                raise serializers.ValidationError({
                    "date_fixe":
                        "La date fixe ne doit pas être renseignée pour une planification par usage."
                })

        # =========================
        # DATE FIXE
        # =========================

        elif type_planification == ModeleEntretien.TypePlanification.DATE_FIXE:

            if date_fixe is None:
                raise serializers.ValidationError({
                    "date_fixe":
                        "La date fixe est obligatoire pour une planification à date fixe."
                })

            if periodicite is not None:
                raise serializers.ValidationError({
                    "periodicite":
                        "La périodicité ne doit pas être renseignée pour une planification à date fixe."
                })

            if unite_periodicite is not None:
                raise serializers.ValidationError({
                    "unite_periodicite":
                        "L'unité de périodicité ne doit pas être renseignée pour une planification à date fixe."
                })

            if seuil_usage is not None:
                raise serializers.ValidationError({
                    "seuil_usage":
                        "Le seuil d'usage ne doit pas être renseigné pour une planification à date fixe."
                })

            if unite_usage is not None:
                raise serializers.ValidationError({
                    "unite_usage":
                        "L'unité d'usage ne doit pas être renseignée pour une planification à date fixe."
                })

        # =========================
        # MANUELLE
        # =========================

        elif type_planification == ModeleEntretien.TypePlanification.MANUELLE:

            scheduling_fields = {
                "periodicite": periodicite,
                "unite_periodicite": unite_periodicite,
                "seuil_usage": seuil_usage,
                "unite_usage": unite_usage,
                "date_fixe": date_fixe,
            }

            non_empty_fields = [
                field
                for field, value in scheduling_fields.items()
                if value is not None
            ]

            if non_empty_fields:
                raise serializers.ValidationError({
                    field:
                        "Ce champ ne doit pas être renseigné pour une planification manuelle."
                    for field in non_empty_fields
                })

        return attrs

    # =========================
    # CREATE
    # =========================

    def create(self, validated_data):
        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["entreprise"] = request.user.entreprise

        return super().create(validated_data)
