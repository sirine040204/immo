from django.utils import datastructures
from django.db import transaction
from rest_framework import serializers
from decimal import Decimal
from .models import AttributDynamique
from .models import Famille
from .models import OptionAttribut
from .models import Immobilisation
from .models import ValeurAttribut
from .models import ReleveUsage
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
    def validate_code(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Le code de l'attribut dynamique est obligatoire."
            )

        queryset = AttributDynamique.objects.filter(
            code__iexact=value
        )

        if self.instance is not None:
            queryset = queryset.exclude(
                pk=self.instance.pk
            )

        if queryset.exists():
            raise serializers.ValidationError(
                "Un attribut dynamique avec ce code existe déjà."
            )

        return value
    
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
        # Empêcher le changement de type si des valeurs existent déjà
        if (
            self.instance is not None
            and "type_donnee" in attrs
            and attrs["type_donnee"] != self.instance.type_donnee
            and self.instance.valeurs.exists()
        ):
            raise serializers.ValidationError({
                "type_donnee": (
                    "Le type de donnée ne peut pas être modifié "
                    "car cet attribut possède déjà des valeurs."
                )
            })

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
        attribut = (
            self.instance.attribut
            if self.instance
            else self.context.get("attribut")
        )

        if attribut is None:
            raise serializers.ValidationError({
                "attribut": "L'attribut dynamique est obligatoire."
            })

        if attribut.type_donnee != AttributDynamique.TypeDonnee.LISTE:
            raise serializers.ValidationError({
                "attribut": (
                    "Les options ne sont autorisées que pour "
                    "un attribut de type LISTE."
                )
            })

        code = attrs.get("code")

        if code is not None:
            code = code.strip()

            if not code:
                raise serializers.ValidationError({
                    "code": "Le code de l'option est obligatoire."
                })

            queryset = OptionAttribut.objects.filter(
                attribut=attribut,
                code__iexact=code,
            )

            if self.instance is not None:
                queryset = queryset.exclude(pk=self.instance.pk)

            if queryset.exists():
                raise serializers.ValidationError({
                    "code": (
                        "Une option avec ce code existe déjà "
                        "pour cet attribut."
                    )
                })

            attrs["code"] = code

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

# valeur attribut
class ValeurAttributSerializer(serializers.ModelSerializer):
    def create(self, validated_data):
        with transaction.atomic():
            valeur_attribut = super().create(validated_data)

            ReleveUsage.objects.create(
                immobilisation=valeur_attribut.immobilisation,
                attribut=valeur_attribut.attribut,
                option=valeur_attribut.option,
                valeur=valeur_attribut.valeur,
            )

            return valeur_attribut


    def update(self, instance, validated_data):
        ancienne_option_id = instance.option_id
        ancienne_valeur = instance.valeur

        with transaction.atomic():
            valeur_attribut = super().update(instance, validated_data)

            nouvelle_option_id = valeur_attribut.option_id
            nouvelle_valeur = valeur_attribut.valeur

            valeur_modifiee = (
                ancienne_option_id != nouvelle_option_id
                or ancienne_valeur != nouvelle_valeur
            )

            if valeur_modifiee:
                ReleveUsage.objects.create(
                    immobilisation=valeur_attribut.immobilisation,
                    attribut=valeur_attribut.attribut,
                    option=valeur_attribut.option,
                    valeur=valeur_attribut.valeur,
                )

            return valeur_attribut

    class Meta:
        model = ValeurAttribut
        fields = [
            "id",
            "immobilisation",
            "attribut",
            "option",
            "valeur",
        ]
        read_only_fields = ["id"]
        validators = []

    def get_extra_kwargs(self):
        extra_kwargs = super().get_extra_kwargs()

        if self.instance is not None:
            extra_kwargs["immobilisation"] = {
                "read_only": True
            }
            extra_kwargs["attribut"] = {
                "read_only": True
            }

        return extra_kwargs

    def validate(self, attrs):
        instance = self.instance

        immobilisation = attrs.get(
            "immobilisation",
            instance.immobilisation if instance else None
        )

        attribut = attrs.get(
            "attribut",
            instance.attribut if instance else None
        )

        option = attrs.get(
            "option",
            instance.option if instance else None
        )

        valeur = attrs.get(
            "valeur",
            instance.valeur if instance else None
        )

        # Vérification de l'immobilisation
        if immobilisation is None:
            raise serializers.ValidationError({
                "immobilisation": "L'immobilisation est obligatoire."
            })

        # Vérification de l'attribut
        if attribut is None:
            raise serializers.ValidationError({
                "attribut": "L'attribut dynamique est obligatoire."
            })

        # Vérification de l'entreprise de l'utilisateur
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

        # Isolation entreprise : immobilisation
        if immobilisation.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError({
                "immobilisation": (
                    "Cette immobilisation n'appartient pas à votre entreprise."
                )
            })

        # Isolation entreprise : attribut
        if attribut.famille.entreprise_id != entreprise.id_entreprise:
            raise serializers.ValidationError({
                "attribut": (
                    "Cet attribut n'appartient pas à votre entreprise."
                )
            })

        # L'attribut doit appartenir à la même famille
        # que l'immobilisation
        if attribut.famille_id != immobilisation.famille_id:
            raise serializers.ValidationError({
                "attribut": (
                    "Cet attribut n'appartient pas à la famille "
                    "de cette immobilisation."
                )
            })

        # Un attribut archivé ne peut plus recevoir de nouvelle valeur
        if (
            attribut.statut == AttributDynamique.Statut.ARCHIVEE
            and (
                instance is None
                or "attribut" in attrs
                or "valeur" in attrs
                or "option" in attrs
            )
        ):
            raise serializers.ValidationError({
                "attribut": (
                    "Un attribut archivé ne peut pas recevoir "
                    "de nouvelle valeur."
                )
            })

        type_donnee = attribut.type_donnee

        # ============================================================
        # TYPE LISTE
        # ============================================================
        if type_donnee == AttributDynamique.TypeDonnee.LISTE:

            if option is None:
                raise serializers.ValidationError({
                    "option": (
                        "Une option est obligatoire pour un attribut "
                        "de type LISTE."
                    )
                })

            # Une liste utilise option, pas valeur
            if valeur not in [None, ""]:
                raise serializers.ValidationError({
                    "valeur": (
                        "Le champ valeur ne doit pas être renseigné "
                        "pour un attribut de type LISTE."
                    )
                })

            # L'option doit appartenir au même attribut
            if option.attribut_id != attribut.id_attribut:
                raise serializers.ValidationError({
                    "option": (
                        "Cette option n'appartient pas à cet attribut."
                    )
                })

            # Une option archivée ne peut pas être choisie
            # pour une nouvelle/modification de valeur
            if option.statut == OptionAttribut.Statut.ARCHIVEE:
                if instance is None or option.id != instance.option_id:
                    raise serializers.ValidationError({
                        "option": (
                            "Une option archivée ne peut pas être "
                            "sélectionnée."
                        )
                    })

        # ============================================================
        # TYPES NON LISTE
        # ============================================================
        else:

            if option is not None:
                raise serializers.ValidationError({
                    "option": (
                        "Le champ option ne doit pas être renseigné "
                        "pour un attribut qui n'est pas de type LISTE."
                    )
                })

            if valeur in [None, ""]:
                if attribut.obligatoire:
                    raise serializers.ValidationError({
                        "valeur": (
                            "La valeur est obligatoire pour cet attribut."
                        )
                    })

                return attrs

            # --------------------------------------------------------
            # TEXTE
            # --------------------------------------------------------
            if type_donnee == AttributDynamique.TypeDonnee.TEXTE:

                if not isinstance(valeur, str):
                    raise serializers.ValidationError({
                        "valeur": "La valeur doit être du texte."
                    })

                longueur = len(valeur)

                if (
                    attribut.longueur_min is not None
                    and longueur < attribut.longueur_min
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur doit contenir au moins "
                            f"{attribut.longueur_min} caractères."
                        )
                    })

                if (
                    attribut.longueur_max is not None
                    and longueur > attribut.longueur_max
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur ne doit pas dépasser "
                            f"{attribut.longueur_max} caractères."
                        )
                    })

            # --------------------------------------------------------
            # NOMBRE
            # --------------------------------------------------------
            elif type_donnee == AttributDynamique.TypeDonnee.NOMBRE:

                try:
                    nombre = Decimal(str(valeur))
                except (ValueError, TypeError, ArithmeticError):
                    raise serializers.ValidationError({
                        "valeur": "La valeur doit être un nombre entier."
                    })

                if nombre != nombre.to_integral_value():
                    raise serializers.ValidationError({
                        "valeur": "La valeur doit être un nombre entier."
                    })

                nombre = nombre.to_integral_value()

                if (
                    attribut.valeur_min is not None
                    and nombre < attribut.valeur_min
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur doit être supérieure ou égale "
                            f"à {attribut.valeur_min}."
                        )
                    })

                if (
                    attribut.valeur_max is not None
                    and nombre > attribut.valeur_max
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur doit être inférieure ou égale "
                            f"à {attribut.valeur_max}."
                        )
                    })
            # --------------------------------------------------------
            # DECIMAL
            # --------------------------------------------------------
            elif type_donnee == AttributDynamique.TypeDonnee.DECIMAL:

                try:
                    nombre = Decimal(str(valeur))
                except (ValueError, TypeError, ArithmeticError):
                    raise serializers.ValidationError({
                        "valeur": "La valeur doit être un nombre décimal."
                    })

                if (
                    attribut.valeur_min is not None
                    and nombre < attribut.valeur_min
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur doit être supérieure ou égale "
                            f"à {attribut.valeur_min}."
                        )
                    })

                if (
                    attribut.valeur_max is not None
                    and nombre > attribut.valeur_max
                ):
                    raise serializers.ValidationError({
                        "valeur": (
                            f"La valeur doit être inférieure ou égale "
                            f"à {attribut.valeur_max}."
                        )
                    })

            # --------------------------------------------------------
            # DATE
            # --------------------------------------------------------
            elif type_donnee == AttributDynamique.TypeDonnee.DATE:

                try:
                    date_value = serializers.DateField().to_internal_value(
                        valeur
                    )
                except serializers.ValidationError:
                    raise serializers.ValidationError({
                        "valeur": (
                            "La valeur doit être une date valide "
                            "au format YYYY-MM-DD."
                        )
                    })

            # --------------------------------------------------------
            # BOOLEEN
            # --------------------------------------------------------
            elif type_donnee == AttributDynamique.TypeDonnee.BOOLEEN:

                if isinstance(valeur, bool):
                    pass

                elif str(valeur).lower() in ["true", "false"]:
                    pass

                else:
                    raise serializers.ValidationError({
                        "valeur": (
                            "La valeur doit être true ou false."
                        )
                    })

        # ============================================================
        # UN SEUL VALEUR ATTRIBUT PAR IMMOBILISATION + ATTRIBUT
        # ============================================================
        queryset = ValeurAttribut.objects.filter(
            immobilisation=immobilisation,
            attribut=attribut,
        )

        if instance is not None:
            queryset = queryset.exclude(pk=instance.pk)

        if queryset.exists():
            raise serializers.ValidationError({
                "attribut": (
                    "Une valeur existe déjà pour cet attribut "
                    "et cette immobilisation."
                )
            })

        return attrs

# Read only serialiser pour l'historisation
class ReleveUsageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReleveUsage
        fields = [
            "id",
            "immobilisation",
            "attribut",
            "option",
            "valeur",
            "date_releve",
        ]
        read_only_fields = fields