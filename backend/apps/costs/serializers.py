from rest_framework import serializers
from django.utils import timezone

from .models import CoutImmobilisation
from ..documents.models import Document
from ..immobilisations.models import Immobilisation


class CoutImmobilisationSerializer(serializers.ModelSerializer):

    class Meta:
        model = CoutImmobilisation

        fields = [
            # Identification
            "id_cout",
            "immobilisation",
            "type_cout",
            "libelle",
            "date_cout",

            # Informations financières
            "montant_ht",
            "taux_tva",
            "montant_tva",
            "montant_ttc",

            # Justificatif
            "document",

            # Statut
            "statut",
            "commentaire",

            # Audit
            "date_creation",
            "cree_par",
            "modifie_par",
            "date_modification",
            "valide_par",
            "date_validation",
            "motif_rejet",
        ]

        read_only_fields = [
            "id_cout",

            # Calculés par le backend
            "montant_tva",
            "montant_ttc",

            # Workflow contrôlé par le backend
            "statut",
            "valide_par",
            "date_validation",
            "motif_rejet",

            # Audit contrôlé par le backend
            "date_creation",
            "cree_par",
            "modifie_par",
            "date_modification",
        ]

    # ============================================================
    # LIBELLÉ
    # ============================================================

    def validate_libelle(self, value):

        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le libellé du coût est obligatoire."
            )

        return value

    # ============================================================
    # DATE DU COÛT
    # ============================================================

    def validate_date_cout(self, value):

        if value > timezone.localdate():
            raise serializers.ValidationError(
                "La date du coût ne peut pas être dans le futur."
            )

        return value

    # ============================================================
    # TAUX DE TVA
    # ============================================================

    def validate_taux_tva(self, value):

        if value < 0:
            raise serializers.ValidationError(
                "Le taux de TVA ne peut pas être négatif."
            )

        if value > 100:
            raise serializers.ValidationError(
                "Le taux de TVA ne peut pas dépasser 100%."
            )

        return value

    # ============================================================
    # VALIDATION GLOBALE
    # ============================================================

    def validate(self, attrs):

        request = self.context.get("request")
        instance = self.instance

        # --------------------------------------------------------
        # Authentification
        # --------------------------------------------------------

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        if not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Utilisateur non authentifié."
            )

        entreprise = getattr(
            request.user,
            "entreprise",
            None,
        )

        if entreprise is None:
            raise serializers.ValidationError(
                "L'utilisateur n'est associé à aucune entreprise."
            )

        # --------------------------------------------------------
        # Valeurs actuelles pour POST / PUT / PATCH
        # --------------------------------------------------------

        immobilisation = attrs.get(
            "immobilisation",
            instance.immobilisation if instance else None,
        )

        document = attrs.get(
            "document",
            instance.document if instance else None,
        )

        type_cout = attrs.get(
            "type_cout",
            instance.type_cout if instance else None,
        )

        date_cout = attrs.get(
            "date_cout",
            instance.date_cout if instance else None,
        )

        montant_ht = attrs.get(
            "montant_ht",
            instance.montant_ht if instance else None,
        )

        # --------------------------------------------------------
        # Immobilisation
        # --------------------------------------------------------

        if immobilisation is None:
            raise serializers.ValidationError({
                "immobilisation": (
                    "L'immobilisation est obligatoire."
                )
            })

        if (
            immobilisation.entreprise_id
            != entreprise.id_entreprise
        ):
            raise serializers.ValidationError({
                "immobilisation": (
                    "Cette immobilisation n'appartient pas "
                    "à votre entreprise."
                )
            })

        # Les coûts historiques sont autorisés même si
        # l'immobilisation est hors service, réformée ou archivée.

        # --------------------------------------------------------
        # Type de coût
        # --------------------------------------------------------

        if not type_cout:
            raise serializers.ValidationError({
                "type_cout": (
                    "Le type de coût est obligatoire."
                )
            })

        valid_types = [
            choice[0]
            for choice in CoutImmobilisation.TypeCout.choices
        ]

        if type_cout not in valid_types:
            raise serializers.ValidationError({
                "type_cout": (
                    "Le type de coût sélectionné est invalide."
                )
            })

        # --------------------------------------------------------
        # Date du coût
        # --------------------------------------------------------

        if date_cout is None:
            raise serializers.ValidationError({
                "date_cout": (
                    "La date du coût est obligatoire."
                )
            })

        if date_cout > timezone.localdate():
            raise serializers.ValidationError({
                "date_cout": (
                    "La date du coût ne peut pas être "
                    "dans le futur."
                )
            })

        # --------------------------------------------------------
        # Montant HT
        # --------------------------------------------------------

        if montant_ht is None:
            raise serializers.ValidationError({
                "montant_ht": (
                    "Le montant HT est obligatoire."
                )
            })

        if montant_ht <= 0:
            raise serializers.ValidationError({
                "montant_ht": (
                    "Le montant HT doit être "
                    "strictement positif."
                )
            })

        # --------------------------------------------------------
        # Document justificatif
        # --------------------------------------------------------

        if document is not None:

            # Le document doit appartenir à la même entreprise.
            if (
                document.entreprise_id
                != entreprise.id_entreprise
            ):
                raise serializers.ValidationError({
                    "document": (
                        "Ce document n'appartient pas "
                        "à votre entreprise."
                    )
                })

            # Seuls les documents actifs sont acceptés.
            if document.statut != Document.Statut.ACTIF:
                raise serializers.ValidationError({
                    "document": (
                        "Seul un document actif peut être "
                        "utilisé comme justificatif."
                    )
                })

            # Si le document est déjà lié à une immobilisation,
            # il doit correspondre à l'immobilisation du coût.
            if (
                document.immobilisation_id is not None
                and document.immobilisation_id
                != immobilisation.id_immobilisation
            ):
                raise serializers.ValidationError({
                    "document": (
                        "Ce document est lié à une autre "
                        "immobilisation."
                    )
                })

        # --------------------------------------------------------
        # Type acquisition
        # --------------------------------------------------------

        if (
            type_cout
            == CoutImmobilisation.TypeCout.ACQUISITION
        ):

            # Nous ne forçons pas :
            #
            # date_cout = immobilisation.date_acquisition
            # montant_ht = immobilisation.valeur_brute
            #
            # Les valeurs peuvent être préremplies par le frontend,
            # mais restent modifiables par l'utilisateur.
            #
            # Les validations générales restent obligatoires.

            pass

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

        validated_data["cree_par"] = request.user
        validated_data["modifie_par"] = request.user

        validated_data["statut"] = (
            CoutImmobilisation.Statut.BROUILLON
        )

        validated_data["valide_par"] = None
        validated_data["date_validation"] = None
        validated_data["motif_rejet"] = None

        return super().create(validated_data)

    # ============================================================
    # MODIFICATION
    # ============================================================

    def update(self, instance, validated_data):

        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        # Seuls les coûts en brouillon sont modifiables.
        if (
            instance.statut
            != CoutImmobilisation.Statut.BROUILLON
        ):
            raise serializers.ValidationError(
                "Seul un coût en brouillon peut être modifié."
            )

        validated_data["modifie_par"] = request.user

        # Protection des champs de workflow.
        validated_data.pop("statut", None)
        validated_data.pop("valide_par", None)
        validated_data.pop("date_validation", None)
        validated_data.pop("motif_rejet", None)

        return super().update(
            instance,
            validated_data,
        )