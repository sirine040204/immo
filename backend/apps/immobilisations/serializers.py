from rest_framework import serializers
from .models import AttributDynamique
from .models import Famille

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

 