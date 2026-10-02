import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.core.mail import send_mail
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    Entreprise,
    User,
    Role,
    EmployeeActivation,
    Permission,
    RolePermission,
    PasswordResetToken,
    PermissionRequest,
)
import random
from ..accounts.utils import send_company_status_email
#CompanyAdminRegistrationSerializer
class CompanyAdminRegistrationSerializer(serializers.Serializer):
    # User information
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    telephone = serializers.CharField(max_length=30, required=False, allow_blank=True)
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)
    photo = serializers.CharField(required=False, allow_blank=True)

    # Company information
    nom_entreprise = serializers.CharField(max_length=255)
    numero_fiscal = serializers.CharField(max_length=100)
    forme_juridique = serializers.CharField(max_length=100)
    secteur_activite = serializers.CharField(max_length=150)
    email_notifications = serializers.EmailField()
    numero_telephone = serializers.CharField(max_length=30)

    description = serializers.CharField(required=False, allow_blank=True)
    documents_justificatifs = serializers.CharField()
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
            documents_justificatifs=validated_data["documents_justificatifs"],
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
            photo=validated_data.get("photo", ""),
            entreprise=company,
            is_company_admin=True,
            is_approved=False,
            statut=User.Statut.EN_ATTENTE,
        )

        return user

#LoginSerializer
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs["email"]
        password = attrs["mot_de_passe"]

        user = authenticate(
            request=self.context.get("request"),
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Email ou mot de passe incorrect."
            )

        if not user.is_approved:
            raise serializers.ValidationError(
                "Votre compte n'a pas encore été approuvé."
            )

        if not user.is_active:
            raise serializers.ValidationError(
                "Votre compte est désactivé."
            )

        if user.entreprise and user.entreprise.statut != Entreprise.Statut.ACTIVE:
            raise serializers.ValidationError(
                "Votre entreprise est désactivée."
            )

        refresh = RefreshToken.for_user(user)

        attrs["user"] = user
        attrs["refresh"] = str(refresh)
        attrs["access"] = str(refresh.access_token)

        return attrs

import requests

#GoogleLoginSerializer
class GoogleLoginSerializer(serializers.Serializer):
    token = serializers.CharField()

    def validate(self, attrs):
        token = attrs.get("token")
        
        # Verify access token by fetching user info
        response = requests.get(f"https://www.googleapis.com/oauth2/v3/userinfo?access_token={token}")
        if response.status_code != 200:
            raise serializers.ValidationError("Token Google invalide ou expiré.")
        
        user_info = response.json()
        email = user_info.get('email')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError("Aucun compte associé à cet email. Veuillez vous inscrire.")

        if not user.is_approved:
            raise serializers.ValidationError("Votre compte n'a pas encore été approuvé.")

        if not user.is_active:
            raise serializers.ValidationError("Votre compte est désactivé.")

        if user.entreprise and user.entreprise.statut != Entreprise.Statut.ACTIVE:
            raise serializers.ValidationError("Votre entreprise est désactivée.")

        refresh = RefreshToken.for_user(user)

        attrs["user"] = user
        attrs["refresh"] = str(refresh)
        attrs["access"] = str(refresh.access_token)

        return attrs


#CompanyApprovalSerializer
class CompanyApprovalSerializer(serializers.Serializer):

    def save(self, **kwargs):
        company = self.context["company"]

        with transaction.atomic():

            company.statut = Entreprise.Statut.ACTIVE
            company.save(update_fields=["statut"])

            company_admins = User.objects.filter(
                entreprise=company,
                is_company_admin=True,
            )

            company_admins.update(
                statut=User.Statut.ACTIVE,
                is_approved=True,
            )
            
            for admin_user in company_admins:
                send_company_status_email(admin_user, company, "APPROUVE")

        return company
# CompanyRejectionSerializer
class CompanyRejectionSerializer(serializers.Serializer):

    def save(self, **kwargs):
        company = self.context["company"]

        with transaction.atomic():

            company.statut = Entreprise.Statut.REJETEE
            company.save(update_fields=["statut"])

            company_admins = User.objects.filter(
                entreprise=company,
                is_company_admin=True,
            )

            company_admins.update(
                statut=User.Statut.REJETEE,
                is_approved=False,
            )

            for admin_user in company_admins:
                send_company_status_email(admin_user, company, "REJETE")

        return company
# CompanySuspensionSerializer
class CompanySuspensionSerializer(serializers.Serializer):

    def save(self, **kwargs):
        company = self.context["company"]

        with transaction.atomic():

            company.statut = Entreprise.Statut.DESACTIVE
            company.save(update_fields=["statut"])
            
            company_admins = User.objects.filter(entreprise=company, is_company_admin=True)
            for admin_user in company_admins:
                send_company_status_email(admin_user, company, "SUSPENDU")

        return company
# CompanyReactivationSerializer
class CompanyReactivationSerializer(serializers.Serializer):

    def save(self, **kwargs):
        company = self.context["company"]

        with transaction.atomic():

            company.statut = Entreprise.Statut.ACTIVE
            company.save(update_fields=["statut"])
            
            company_admins = User.objects.filter(entreprise=company, is_company_admin=True)
            for admin_user in company_admins:
                send_company_status_email(admin_user, company, "REACTIVE")

        return company
# UserProfileSerializer
class UserProfileSerializer(serializers.ModelSerializer):
    role_nom = serializers.CharField(source='role.nom', read_only=True)
    entreprise_nom = serializers.CharField(source='entreprise.nom_entreprise', read_only=True)

    class Meta:
        model = User
        fields = [
            'id_utilisateur',
            'email',
            'nom',
            'prenom',
            'telephone',
            'is_company_admin',
            'statut',
            'role',
            'role_nom',
            'entreprise',
            'entreprise_nom',
            'photo'
        ]

class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'nom',
            'prenom',
            'telephone',
            'email',
            'photo',
        ]


#EmployeeInvitationSerializer
class EmployeeInvitationSerializer(serializers.Serializer):

    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    email = serializers.EmailField()

    role = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.none()
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")

        if request and request.user.is_authenticated:
            self.fields["role"].queryset = Role.objects.filter(
                entreprise=request.user.entreprise,
                statut=Role.Statut.ACTIF,
            )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "Cette adresse email est déjà utilisée."
            )

        return value

    def create(self, validated_data):
        company_admin = self.context["request"].user

        user = User.objects.create_user(
            email=validated_data["email"],
            password=None,
            nom=validated_data["nom"],
            prenom=validated_data["prenom"],
            entreprise=company_admin.entreprise,
            role=validated_data["role"],
            is_company_admin=False,
            is_approved=True,
            statut=User.Statut.EN_ATTENTE,
        )

        user.set_unusable_password()
        user.save()

        activation = EmployeeActivation.objects.create(
            user=user,
            token=uuid.uuid4(),
            expires_at=timezone.now() + timedelta(days=7),
        )

        activation_link = (
            "http://localhost:3000/activate-employee"
            f"?token={activation.token}"
        )

        send_mail(
            subject="Activation de votre compte",
            message=(
                f"Bonjour {user.prenom},\n\n"
                "Vous avez été invité à rejoindre votre entreprise.\n\n"
                "Cliquez sur le lien suivant pour activer votre compte :\n"
                f"{activation_link}\n\n"
                "Ce lien est valable pendant 7 jours."
            ),
            from_email=None,
            recipient_list=[user.email],
        )

        return user

# EmployeeActivationSerializer
class EmployeeActivationSerializer(serializers.Serializer):

    token = serializers.UUIDField()
    mot_de_passe = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    def validate(self, attrs):
        token = attrs["token"]

        try:
            activation = EmployeeActivation.objects.select_related(
                "user"
            ).get(
                token=token,
                used=False,
            )
        except EmployeeActivation.DoesNotExist:
            raise serializers.ValidationError(
                "Le lien d'activation est invalide ou a déjà été utilisé."
            )

        if timezone.now() > activation.expires_at:
            raise serializers.ValidationError(
                "Le lien d'activation a expiré."
            )

        attrs["activation"] = activation

        return attrs

    @transaction.atomic
    def save(self, **kwargs):
        activation = self.validated_data["activation"]
        password = self.validated_data["mot_de_passe"]

        user = activation.user

        user.set_password(password)
        user.statut = User.Statut.ACTIVE
        user.is_active = True
        user.save(
            update_fields=[
                "password",
                "statut",
                "is_active",
            ]
        )

        activation.used = True
        activation.save(update_fields=["used"])

        return user

#RoleSerializer
class RoleSerializer(serializers.ModelSerializer):

    class Meta:
        model = Role
        fields = [
            "id",
            "nom",
            "description",
            "statut",
            "date_creation",
        ]
        read_only_fields = [
            "id",
            "statut",
            "date_creation",
        ]

#RolePermissionSerializer
class RolePermissionSerializer(serializers.ModelSerializer):

    permission_code = serializers.CharField(
        source="permission.code",
        read_only=True,
    )

    permission_nom = serializers.CharField(
        source="permission.nom",
        read_only=True,
    )

    class Meta:
        model = RolePermission
        fields = [
            "id",
            "permission",
            "permission_code",
            "permission_nom",
        ]
        read_only_fields = [
            "id",
            "permission_code",
            "permission_nom",
        ]

#EmployeeListSerializer
class EmployeeListSerializer(serializers.ModelSerializer):

    role_nom = serializers.CharField(
        source="role.nom",
        read_only=True,
    )
    invitation_expires_at = serializers.DateTimeField(
        source="activation.expires_at",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            "id_utilisateur",
            "nom",
            "prenom",
            "email",
            "telephone",
            "role",
            "role_nom",
            "statut",
            "date_creation",
            "derniere_connexion",
            "invitation_expires_at",
        ]
        read_only_fields = fields

# EmployeeUpdateSerializer
class EmployeeUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = [
            "nom",
            "prenom",
            "telephone",
            "role",
        ]

    def validate_role(self, role):

        request = self.context.get("request")

        if request is None:
            raise serializers.ValidationError(
                "Contexte de requête manquant."
            )

        if role.entreprise_id != request.user.entreprise_id:
            raise serializers.ValidationError(
                "Le rôle doit appartenir à la même entreprise."
            )

        if role.statut != Role.Statut.ACTIF:
            raise serializers.ValidationError(
                "Le rôle doit être actif."
            )

        return role
#CompanyProfileSerializer
class CompanyProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Entreprise
        fields = [
            "id_entreprise",
            "nom_entreprise",
            "numero_fiscal",
            "forme_juridique",
            "secteur_activite",
            "email_notifications",
            "numero_telephone",
            "date_creation",
            "description",
            "documents_justificatifs",
            "statut",
            "logo",
            "adresse",
            "site_web",
            "devise",
            "langue",
            "delai_rappel_maintenance_defaut",
            "delai_rappel_document_defaut",
        ]

        read_only_fields = [
            "id_entreprise",
            "numero_fiscal",
            "date_creation",
            "statut",
        ]
    
# PasswordResetRequestSerializer
class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    method = serializers.ChoiceField(choices=["OTP", "LINK"], default="OTP")

    def save(self):
        email = self.validated_data["email"]
        method = self.validated_data["method"]
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return None

        otp = str(random.randint(100000, 999999))
        token = uuid.uuid4()

        PasswordResetToken.objects.create(
            user=user,
            otp_code=otp,
            token=token,
            expires_at=timezone.now() + timedelta(minutes=15)
        )

        magic_link = f"http://localhost:3000/reset-password?token={token}"

        if method == "OTP":
            message = (
                f"Bonjour {user.prenom},\n\n"
                f"Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
                f"Voici votre code de vérification à 6 chiffres : {otp}\n\n"
                "Ce code est valable pendant 15 minutes."
            )
        else:
            message = (
                f"Bonjour {user.prenom},\n\n"
                f"Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
                f"Cliquez sur ce lien pour choisir un nouveau mot de passe directement :\n"
                f"{magic_link}\n\n"
                "Ce lien est valable pendant 15 minutes."
            )

        send_mail(
            subject="Réinitialisation de votre mot de passe",
            message=message,
            from_email=None,
            recipient_list=[email],
        )
        return True

# PasswordResetVerifyOTPSerializer
class PasswordResetVerifyOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp_code = serializers.CharField(max_length=6)

    def validate(self, attrs):
        email = attrs["email"]
        otp_code = attrs["otp_code"]

        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(
                user__email=email,
                otp_code=otp_code,
                used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Code OTP invalide ou expiré.")

        attrs["reset_token"] = reset_token
        return attrs

# PasswordResetConfirmSerializer
class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    mot_de_passe = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        token = attrs["token"]
        try:
            reset_token = PasswordResetToken.objects.select_related("user").get(
                token=token,
                used=False,
                expires_at__gt=timezone.now()
            )
        except PasswordResetToken.DoesNotExist:
            raise serializers.ValidationError("Lien magique ou token invalide / expiré.")
        
        attrs["reset_token"] = reset_token
        return attrs

    def save(self, **kwargs):
        reset_token = self.validated_data["reset_token"]
        password = self.validated_data["mot_de_passe"]

        user = reset_token.user
        user.set_password(password)
        user.save(update_fields=["password"])

        reset_token.used = True
        reset_token.save(update_fields=["used"])

        return user

class PermissionRequestSerializer(serializers.ModelSerializer):
    user_nom = serializers.CharField(source='user.nom', read_only=True)
    user_prenom = serializers.CharField(source='user.prenom', read_only=True)
    user_email = serializers.CharField(source='user.email', read_only=True)
    permission_code = serializers.CharField(source='permission.code', read_only=True)
    permission_nom = serializers.CharField(source='permission.nom', read_only=True)

    class Meta:
        model = PermissionRequest
        fields = [
            'id', 'user', 'user_nom', 'user_prenom', 'user_email',
            'permission', 'permission_code', 'permission_nom',
            'statut', 'motif_rejet', 'date_demande', 'date_traitement'
        ]
        read_only_fields = ['id', 'user', 'statut', 'date_demande', 'date_traitement', 'traite_par', 'motif_rejet']


class PermissionRequestProcessSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["ACCEPT", "REJECT", "REVOKE"])
    motif_rejet = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        if attrs.get('action') in ['REJECT', 'REVOKE'] and not attrs.get('motif_rejet'):
            raise serializers.ValidationError({"motif_rejet": "Le motif est obligatoire pour cette action."})
        return attrs