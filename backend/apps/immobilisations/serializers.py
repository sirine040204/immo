from rest_framework import serializers
from .models import AttributDynamique
from .models import Famille
from .models import OptionAttribut
from .models import Immobilisation
from django.utils import timezone

#famille
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

#attributdynamique
class AttributDynamiqueSerializer(serializers.ModelSerializer):
    code = serializers.CharField(
    max_length=100,
    required=True,
    allow_blank=False,
    )
    class Meta:
        model = AttributDynamique
        fields = [
            "id_attribut",
            "famille",
            "libelle",
            "code",
            "type_donnee",
            "obligatoire",
            "valeur_defaut",
            "placeholder",
            "valeur_min",
            "valeur_max",
            "longueur_min",
            "longueur_max",
            "ordre_affichage",
            "statut",
        ]
        read_only_fields = [
            "id_attribut",
            "famille",
            "statut",
        ]

    def validate(self, attrs):
        instance = self.instance

        valeur_min = attrs.get(
            "valeur_min",
            instance.valeur_min if instance else None
        )
        valeur_max = attrs.get(
            "valeur_max",
            instance.valeur_max if instance else None
        )

        longueur_min = attrs.get(
            "longueur_min",
            instance.longueur_min if instance else None
        )
        longueur_max = attrs.get(
            "longueur_max",
            instance.longueur_max if instance else None
        )

        type_donnee = attrs.get(
            "type_donnee",
            instance.type_donnee if instance else None
        )

        if (
            valeur_min is not None
            and valeur_max is not None
            and valeur_min > valeur_max
        ):
            raise serializers.ValidationError({
                "valeur_min": (
                    "valeur_min doit être inférieure ou égale à valeur_max."
                )
            })

        if (
            longueur_min is not None
            and longueur_max is not None
            and longueur_min > longueur_max
        ):
            raise serializers.ValidationError({
                "longueur_min": (
                    "longueur_min doit être inférieure ou égale à longueur_max."
                )
            })

        if type_donnee in [
            AttributDynamique.TypeDonnee.NOMBRE,
            AttributDynamique.TypeDonnee.DECIMAL,
        ]:
            if longueur_min is not None or longueur_max is not None:
                raise serializers.ValidationError({
                    "longueur_min": (
                        "Les contraintes de longueur ne sont pas utilisées "
                        "pour un attribut numérique."
                    )
                })

        if type_donnee == AttributDynamique.TypeDonnee.TEXTE:
            if valeur_min is not None or valeur_max is not None:
                raise serializers.ValidationError({
                    "valeur_min": (
                        "Les contraintes numériques ne sont pas utilisées "
                        "pour un attribut de type TEXTE."
                    )
                })

        return attrs
        
#option pour l'attribut dynamique de type liste
class OptionAttributSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionAttribut
        fields = [
            "id",
            "attribut",
            "libelle",
            "code",
            "ordre",
            "statut",
        ]
        read_only_fields = [
            "id",
            "attribut",
            "statut",
        ]

    def validate(self, attrs):
        attribut = self.instance.attribut if self.instance else self.context.get("attribut")

        if attribut is None:
            raise serializers.ValidationError({
                "attribut": "L'attribut dynamique est obligatoire."
            })

        if attribut.type_donnee != AttributDynamique.TypeDonnee.LISTE:
            raise serializers.ValidationError({
                "attribut": "Les options ne sont autorisées que pour un attribut de type LISTE."
            })

        return attrs

 # immobilisation
class ImmobilisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Immobilisation
        fields = [
            "id_immobilisation",
            "entreprise",
            "famille",
            "code",
            "designation",
            "description",
            "statut",
            "date_acquisition",
            "valeur_brute",
            "tva_recuperable",
            "numero_facture",
            "taux_amortissement",
            "mode_calcul",
            "amortissement_anterieur",
            "numero_serie",
            "date_mise_en_service",
            "date_fin_garantie",
            "etat_physique",
            "date_cession",
            "prix_cession",
            "motif_sortie",
            "cree_par",
            "date_creation",
            "modifie_par",
            "date_derniere_modification",
            "date_derniere_maintenance",
            "date_prochaine_maintenance",
        ]

        read_only_fields = [
            "id_immobilisation",
            "entreprise",
            "statut",
            "cree_par",
            "date_creation",
            "modifie_par",
            "date_derniere_modification",
        ]

    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code de l'immobilisation est obligatoire."
            )

        queryset = Immobilisation.objects.filter(
            code__iexact=value
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Une immobilisation avec ce code existe déjà."
            )

        return value

    def validate_date_acquisition(self, value):
        today = timezone.localdate()

        if value > today:
            raise serializers.ValidationError(
                "La date d'acquisition ne peut pas être dans le futur."
            )

        return value

    def validate_valeur_brute(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                "La valeur brute doit être strictement positive."
            )

        return value

    def validate_tva_recuperable(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "La TVA récupérable ne peut pas être négative."
            )

        return value

    def validate_taux_amortissement(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Le taux d'amortissement ne peut pas être négatif."
            )

        return value

    def validate_amortissement_anterieur(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "L'amortissement antérieur ne peut pas être négatif."
            )

        return value

    def validate_prix_cession(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Le prix de cession ne peut pas être négatif."
            )

        return value

    def validate(self, attrs):
        instance = self.instance

        # Récupération des valeurs existantes en cas de PATCH
        famille = attrs.get(
            "famille",
            instance.famille if instance else None
        )

        date_acquisition = attrs.get(
            "date_acquisition",
            instance.date_acquisition if instance else None
        )

        date_mise_en_service = attrs.get(
            "date_mise_en_service",
            instance.date_mise_en_service if instance else None
        )

        date_fin_garantie = attrs.get(
            "date_fin_garantie",
            instance.date_fin_garantie if instance else None
        )

        date_cession = attrs.get(
            "date_cession",
            instance.date_cession if instance else None
        )

        prix_cession = attrs.get(
            "prix_cession",
            instance.prix_cession if instance else None
        )

        motif_sortie = attrs.get(
            "motif_sortie",
            instance.motif_sortie if instance else ""
        )

        # Vérification de la famille
        if famille is None:
            raise serializers.ValidationError({
                "famille": "La famille est obligatoire."
            })

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

        if famille.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError({
                "famille": "Cette famille n'appartient pas à votre entreprise."
            })

        if (
            famille.statut == Famille.Statut.ARCHIVEE
            and (self.instance is None or "famille" in attrs)
        ):
            raise serializers.ValidationError({
                "famille": (
                    "Une famille archivée ne peut pas être utilisée "
                    "pour une nouvelle immobilisation."
                )
            })

        # Cohérence des dates
        if (
            date_acquisition is not None
            and date_mise_en_service is not None
            and date_mise_en_service < date_acquisition
        ):
            raise serializers.ValidationError({
                "date_mise_en_service": (
                    "La date de mise en service ne peut pas être "
                    "antérieure à la date d'acquisition."
                )
            })

        if (
            date_fin_garantie is not None
            and date_mise_en_service is not None
            and date_fin_garantie < date_mise_en_service
        ):
            raise serializers.ValidationError({
                "date_fin_garantie": (
                    "La date de fin de garantie ne peut pas être "
                    "antérieure à la date de mise en service."
                )
            })

        # Cohérence des informations de sortie
        sortie_fields_present = (
            date_cession is not None
            or prix_cession is not None
            or bool(motif_sortie)
        )

        if sortie_fields_present:
            if date_cession is None:
                raise serializers.ValidationError({
                    "date_cession": (
                        "La date de cession est obligatoire "
                        "lorsqu'une information de sortie est renseignée."
                    )
                })

            if not motif_sortie:
                raise serializers.ValidationError({
                    "motif_sortie": (
                        "Le motif de sortie est obligatoire "
                        "lorsqu'une information de sortie est renseignée."
                    )
                })

        return attrs

    def create(self, validated_data):
        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["entreprise"] = request.user.entreprise
        validated_data["cree_par"] = request.user
        validated_data["modifie_par"] = request.user

        return super().create(validated_data)

    def update(self, instance, validated_data):
        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        validated_data["modifie_par"] = request.user

        return super().update(instance, validated_data)