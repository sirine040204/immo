from rest_framework import serializers
from django.utils import timezone
from ..immobilisations.models import Famille, Immobilisation
from ..accounts.models import User
from .models import (
    Intervention,
    ModeleEntretien,
    TypeEntretien,
    EtapeEntretien,
)
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

#serializer etape entretien
class EtapeEntretienSerializer(serializers.ModelSerializer):

    class Meta:
        model = EtapeEntretien
        fields = [
            "id",
            "modele_entretien",
            "libelle",
            "description",
            "ordre",
            "obligatoire",
            "statut",
        ]
        read_only_fields = ["id", "statut"]

    def validate_modele_entretien(self, value):
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
                "Le modèle d'entretien doit appartenir à votre entreprise."
            )

        if value.statut != ModeleEntretien.Statut.ACTIF:
            raise serializers.ValidationError(
                "Le modèle d'entretien sélectionné est archivé."
            )

        return value

    def validate_libelle(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le libellé de l'étape d'entretien est obligatoire."
            )

        return value

    def validate_description(self, value):
        return value.strip()

    def validate_ordre(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "L'ordre doit être supérieur à 0."
            )

        return value

    def validate(self, attrs):
        modele_entretien = attrs.get(
            "modele_entretien",
            self.instance.modele_entretien
            if self.instance is not None
            else None
        )

        ordre = attrs.get(
            "ordre",
            self.instance.ordre
            if self.instance is not None
            else None
        )

        if modele_entretien is None:
            raise serializers.ValidationError({
                "modele_entretien":
                    "Le modèle d'entretien est obligatoire."
            })

        if ordre is None:
            raise serializers.ValidationError({
                "ordre":
                    "L'ordre est obligatoire."
            })

        queryset = EtapeEntretien.objects.filter(
            modele_entretien=modele_entretien,
            ordre=ordre,
        )

        if self.instance is not None:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                "ordre":
                    "Une étape avec cet ordre existe déjà pour ce modèle d'entretien."
            })

        return attrs

#serializer Intervention
class InterventionSerializer(serializers.ModelSerializer):

    class Meta:
        model = Intervention
        fields = [
            "id",
            "entreprise",
            "immobilisation",
            "modele_entretien",
            "type_entretien",
            "demande_par",
            "date_demande",
            "date_prevue",
            "date_debut",
            "date_fin",
            "priorite",
            "motif",
            "statut",
        ]

        read_only_fields = [
            "id",
            "entreprise",
            "demande_par",
            "date_demande",
            "date_debut",
            "date_fin",
            "statut",
        ]

    def validate(self, attrs):
        """
        Validate the business rules of an Intervention.

        The authenticated user's company is the source of truth
        for company isolation.
        """

        request = self.context.get("request")

        if not request or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Utilisateur authentifié requis."
            )

        user = request.user
        entreprise = user.entreprise

        if not entreprise:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        # -------------------------------------------------
        # Values used for both CREATE and UPDATE
        # -------------------------------------------------

        immobilisation = attrs.get(
            "immobilisation",
            getattr(self.instance, "immobilisation", None)
        )

        type_entretien = attrs.get(
            "type_entretien",
            getattr(self.instance, "type_entretien", None)
        )

        modele_entretien = attrs.get(
            "modele_entretien",
            getattr(self.instance, "modele_entretien", None)
        )

        date_prevue = attrs.get(
            "date_prevue",
            getattr(self.instance, "date_prevue", None)
        )
# Le modèle d'entretien devient immuable
# dès que l'intervention est planifiée.
        if (
            self.instance
            and self.instance.statut != Intervention.Statut.BROUILLON
            and "modele_entretien" in attrs
        ):
            nouveau_modele = attrs["modele_entretien"]
            ancien_modele_id = self.instance.modele_entretien_id

            nouveau_modele_id = (
                nouveau_modele.id
                if nouveau_modele is not None
                else None
            )

            if nouveau_modele_id != ancien_modele_id:
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Le modèle d'entretien ne peut plus être modifié "
                        "après la planification de l'intervention."
                    )
                })
        # -------------------------------------------------
        # IMMOBILISATION
        # -------------------------------------------------

        if immobilisation:

            if immobilisation.entreprise_id != entreprise.id_entreprise:
                raise serializers.ValidationError({
                    "immobilisation": (
                        "Cette immobilisation n'appartient pas "
                        "à votre entreprise."
                    )
                })

            # An immobilisation that has already been reformed
            # or archived should not receive a new intervention.
            if immobilisation.statut in [
                Immobilisation.Statut.REFORMEE,
                Immobilisation.Statut.ARCHIVEE,
            ]:
                raise serializers.ValidationError({
                    "immobilisation": (
                        "Une immobilisation réformée ou archivée "
                        "ne peut pas recevoir une nouvelle intervention."
                    )
                })

        # -------------------------------------------------
        # TYPE ENTRETIEN
        # -------------------------------------------------

        if type_entretien:

            if type_entretien.entreprise_id != entreprise.id_entreprise:
                raise serializers.ValidationError({
                    "type_entretien": (
                        "Ce type d'entretien n'appartient pas "
                        "à votre entreprise."
                    )
                })

            if type_entretien.statut != TypeEntretien.Statut.ACTIF:
                raise serializers.ValidationError({
                    "type_entretien": (
                        "Un type d'entretien archivé ne peut pas "
                        "être utilisé pour une nouvelle intervention."
                    )
                })

        # -------------------------------------------------
        # MODELE ENTRETIEN
        # -------------------------------------------------

        if modele_entretien:

            if modele_entretien.entreprise_id != entreprise.id_entreprise:
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Ce modèle d'entretien n'appartient pas "
                        "à votre entreprise."
                    )
                })

            if modele_entretien.statut != ModeleEntretien.Statut.ACTIF:
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Un modèle d'entretien archivé ne peut pas "
                        "être utilisé pour une nouvelle intervention."
                    )
                })

            # -------------------------------------------------
            # MODEL ↔ IMMOBILISATION FAMILY
            # -------------------------------------------------

            if (
                immobilisation
                and modele_entretien.famille_id
                != immobilisation.famille_id
            ):
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Le modèle d'entretien doit appartenir "
                        "à la même famille que l'immobilisation."
                    )
                })

            # -------------------------------------------------
            # MODEL ↔ TYPE ENTRETIEN
            # -------------------------------------------------

            if (
                type_entretien
                and modele_entretien.type_entretien_id
                != type_entretien.id
            ):
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Le modèle d'entretien doit correspondre "
                        "au type d'entretien sélectionné."
                    )
                })

        # -------------------------------------------------
        # CORRECTIVE / DIRECT PATH
        # -------------------------------------------------

        if type_entretien:

            is_correctif = (
                type_entretien.code.upper() == "CORRECTIF"
            )

            if is_correctif and modele_entretien is not None:
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Une intervention corrective directe "
                        "ne doit pas utiliser de modèle d'entretien."
                    )
                })

            if not is_correctif and modele_entretien is None:
                raise serializers.ValidationError({
                    "modele_entretien": (
                        "Un modèle d'entretien est requis pour "
                        "une intervention non corrective."
                    )
                })

        # -------------------------------------------------
        # DATE PREVUE
        # -------------------------------------------------
        if date_prevue:

            # During CREATE, date_demande does not exist yet
            # because it is generated by auto_now_add.
            #
            # Therefore, today's date represents the future
            # date_demande for the validation.
            date_demande = getattr(
                self.instance,
                "date_demande",
                None
            )

            if date_demande is None:
                date_demande = timezone.localdate()

            if date_prevue < date_demande:
                raise serializers.ValidationError({
                    "date_prevue": (
                        "La date prévue ne peut pas être "
                        "antérieure à la date de demande."
                    )
                })

        return attrs

    def create(self, validated_data):
        """
        Create an Intervention using the authenticated user's
        company and identity.
        """

        request = self.context["request"]
        user = request.user

        validated_data["entreprise"] = user.entreprise
        validated_data["demande_par"] = user

        return Intervention.objects.create(
            **validated_data
        )
#Intervention Statut
class InterventionStatutSerializer(serializers.Serializer):
    statut = serializers.ChoiceField(
        choices=Intervention.Statut.choices
    )

    def validate(self, attrs):
        intervention = self.context.get("intervention")

        if not intervention:
            raise serializers.ValidationError(
                "Intervention requise."
            )

        nouveau_statut = attrs["statut"]
        statut_actuel = intervention.statut

        transitions_autorisees = {
            Intervention.Statut.BROUILLON: {
                Intervention.Statut.PLANIFIEE,
                Intervention.Statut.ANNULEE,
            },
            Intervention.Statut.PLANIFIEE: {
                Intervention.Statut.EN_COURS,
                Intervention.Statut.ANNULEE,
            },
            Intervention.Statut.EN_COURS: {
                Intervention.Statut.TERMINEE,
            },
            Intervention.Statut.TERMINEE: set(),
            Intervention.Statut.ANNULEE: set(),
        }

        if nouveau_statut == statut_actuel:
            raise serializers.ValidationError({
                "statut": (
                    "L'intervention est déjà dans ce statut."
                )
            })

        if nouveau_statut not in transitions_autorisees.get(
            statut_actuel, set()
        ):
            raise serializers.ValidationError({
                "statut": (
                    f"Transition impossible : "
                    f"{statut_actuel} → {nouveau_statut}."
                )
            })

        # PLANIFIEE requires a planned date.
        if (
            nouveau_statut == Intervention.Statut.PLANIFIEE
            and intervention.date_prevue is None
        ):
            raise serializers.ValidationError({
                "statut": (
                    "Une date prévue est obligatoire "
                    "pour planifier une intervention."
                )
            })
        # Le modèle devient immuable dès que l'intervention est planifiée.
        if (
            self.instance
            and self.instance.statut != Intervention.Statut.BROUILLON
            and "modele_entretien" in attrs
            and attrs["modele_entretien"] != self.instance.modele_entretien
        ):
            raise serializers.ValidationError({
                "modele_entretien": (
                    "Le modèle d'entretien ne peut plus être modifié "
                    "après la planification de l'intervention."
                )
            })

        return attrs