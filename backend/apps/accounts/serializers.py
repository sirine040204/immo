from django.db import transaction
from rest_framework import serializers

from .models import Entreprise, User


class CompanyAdminRegistrationSerializer(serializers.Serializer):
    # User information
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    # Company information
    nom_entreprise = serializers.CharField(max_length=255)
    numero_fiscal = serializers.CharField(max_length=100)
    forme_juridique = serializers.CharField(max_length=100)
    secteur_activite = serializers.CharField(max_length=150)
    email_notifications = serializers.EmailField()
    numero_telephone = serializers.CharField(max_length=30)

    description = serializers.CharField(required=False, allow_blank=True)
    documents_justificatifs = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    logo = serializers.CharField(required=False, allow_blank=True)
    adresse = serializers.CharField(required=False, allow_blank=True)
    site_web = serializers.URLField(required=False, allow_blank=True)
    devise = serializers.CharField(max_length=10, required=False, allow_blank=True)
    langue = serializers.CharField(max_length=10, required=False, allow_blank=True)

    delai_rappel_maintenance_defaut = serializers.IntegerField(
        required=False,
        allow_null=True,
    )
    delai_rappel_document_defaut = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    @transaction.atomic
    def create(self, validated_data):
        company = Entreprise.objects.create(
            nom_entreprise=validated_data["nom_entreprise"],
            numero_fiscal=validated_data["numero_fiscal"],
            forme_juridique=validated_data["forme_juridique"],
            secteur_activite=validated_data["secteur_activite"],
            email_notifications=validated_data["email_notifications"],
            numero_telephone=validated_data["numero_telephone"],
            description=validated_data.get("description", ""),
            documents_justificatifs=validated_data.get(
                "documents_justificatifs",
                "",
            ),
            logo=validated_data.get("logo", ""),
            adresse=validated_data.get("adresse", ""),
            site_web=validated_data.get("site_web", ""),
            devise=validated_data.get("devise", ""),
            langue=validated_data.get("langue", ""),
            delai_rappel_maintenance_defaut=validated_data.get(
                "delai_rappel_maintenance_defaut"
            ),
            delai_rappel_document_defaut=validated_data.get(
                "delai_rappel_document_defaut"
            ),
            statut=Entreprise.Statut.EN_ATTENTE,
        )

        user = User.objects.create_user(
            email=validated_data["email"],
            password=validated_data["mot_de_passe"],
            nom=validated_data["nom"],
            prenom=validated_data["prenom"],
            telephone=validated_data.get("telephone", ""),
            entreprise=company,
            is_company_admin=True,
            is_approved=False,
            statut=User.Statut.EN_ATTENTE,
        )

        return user