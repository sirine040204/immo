from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from .permissions import HasPermission, user_has_permission
from rest_framework.permissions import IsAuthenticated
from .models import Entreprise, EmployeeActivation, Role, Permission, RolePermission, User 
from .serializers import CompanyApprovalSerializer

from .serializers import (
    CompanyAdminRegistrationSerializer,
    LoginSerializer,
    EmployeeInvitationSerializer,
    EmployeeActivationSerializer,
    RoleSerializer,
    RolePermissionSerializer,
    EmployeeListSerializer,
    EmployeeUpdateSerializer,
    CompanyProfileSerializer,
    CompanyRejectionSerializer,
    CompanySuspensionSerializer,
    CompanyReactivationSerializer,
)
#register
#POST /api/v1/accounts/register/
class CompanyAdminRegistrationView(APIView):

    def post(self, request):
        serializer = CompanyAdminRegistrationSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Votre demande d'inscription a été envoyée.",
                    "user_id": user.id_utilisateur,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#login
#POST /api/v1/accounts/login/
class LoginView(APIView):

    def post(self, request):
        serializer = LoginSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            return Response(
                {
                    "message": "Connexion réussie.",
                    "access": serializer.validated_data["access"],
                    "refresh": serializer.validated_data["refresh"],
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#superadmin approves company
#POST /api/v1/accounts/companies/<actual_id>/approve/
class CompanyApprovalView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if not request.user.is_superuser:
            return Response(
                {
                    "detail": "Seul le Super Admin peut approuver une entreprise."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            company = Entreprise.objects.get(
                id_entreprise=company_id,
                statut=Entreprise.Statut.EN_ATTENTE,
            )
        except Entreprise.DoesNotExist:
            return Response(
                {
                    "detail": "Entreprise introuvable ou déjà traitée."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyApprovalSerializer(
            context={"company": company}
        )

        serializer.save()

        return Response(
            {
                "message": "L'entreprise a été approuvée.",
                "company_id": company.id_entreprise,
            },
            status=status.HTTP_200_OK,
        )
# Super Admin rejects company
# POST /api/v1/accounts/companies/<actual_id>/reject/
class CompanyRejectionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if not request.user.is_superuser:
            return Response(
                {
                    "detail": "Seul le Super Admin peut rejeter une entreprise."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            company = Entreprise.objects.get(
                id_entreprise=company_id,
                statut=Entreprise.Statut.EN_ATTENTE,
            )
        except Entreprise.DoesNotExist:
            return Response(
                {
                    "detail": "Entreprise introuvable ou déjà traitée."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyRejectionSerializer(
            context={"company": company}
        )

        serializer.save()

        return Response(
            {
                "message": "L'entreprise a été rejetée.",
                "company_id": company.id_entreprise,
            },
            status=status.HTTP_200_OK,
        )
# Super Admin suspends company
# POST /api/v1/accounts/companies/<actual_id>/suspend/
class CompanySuspensionView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if not request.user.is_superuser:
            return Response(
                {
                    "detail": "Seul le Super Admin peut désactiver une entreprise."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            company = Entreprise.objects.get(
                id_entreprise=company_id,
                statut=Entreprise.Statut.ACTIVE,
            )
        except Entreprise.DoesNotExist:
            return Response(
                {
                    "detail": "Entreprise introuvable ou déjà désactivée."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanySuspensionSerializer(
            context={"company": company}
        )

        serializer.save()

        return Response(
            {
                "message": "L'entreprise a été désactivée.",
                "company_id": company.id_entreprise,
            },
            status=status.HTTP_200_OK,
        )
# Super Admin reactivates company
# POST /api/v1/accounts/companies/<actual_id>/reactivate/
class CompanyReactivationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, company_id):

        if not request.user.is_superuser:
            return Response(
                {
                    "detail": "Seul le Super Admin peut réactiver une entreprise."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            company = Entreprise.objects.get(
                id_entreprise=company_id,
                statut=Entreprise.Statut.DESACTIVE,
            )
        except Entreprise.DoesNotExist:
            return Response(
                {
                    "detail": "Entreprise introuvable ou déjà active."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyReactivationSerializer(
            context={"company": company}
        )

        serializer.save()

        return Response(
            {
                "message": "L'entreprise a été réactivée.",
                "company_id": company.id_entreprise,
            },
            status=status.HTTP_200_OK,
        )
#company admin invites employee
#POST /api/v1/accounts/employees/invite/
class EmployeeInvitationView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("AUTH USER =", request.user)
        print("USER ID =", request.user.id_utilisateur)
        print("IS COMPANY ADMIN =", request.user.is_company_admin)
        print("ENTREPRISE ID =", request.user.entreprise_id)


        serializer = EmployeeInvitationSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            user = serializer.save()
            return Response(
                {
                    "message": "L'employé a été créé avec succès.",
                    "user_id": user.id_utilisateur,
                },
                status=status.HTTP_201_CREATED, 
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#employee activates his account
# POST /api/v1/accounts/employees/activate/
class EmployeeActivationView(APIView):

    #GET /api/v1/accounts/employees/activate/?token=<token>
    def get(self, request):

        token = request.query_params.get("token")

        if not token:
            return Response(
                {
                    "detail": "Token d'activation manquant."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            activation = EmployeeActivation.objects.select_related(
                "user"
            ).get(token=token)
        except EmployeeActivation.DoesNotExist:
            return Response(
                {
                    "detail": "Token d'activation invalide."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if activation.used:
            return Response(
                {
                    "detail": "Ce lien d'activation a déjà été utilisé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if activation.expires_at < timezone.now():
            return Response(
                {
                    "detail": "Ce lien d'activation a expiré."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "Lien d'activation valide.",
                "email": activation.user.email,
            },
            status=status.HTTP_200_OK,
        )
        
    #POST /api/v1/accounts/employees/activate/ (without token)
    def post(self, request):

        serializer = EmployeeActivationSerializer(
            data=request.data
        )

        if serializer.is_valid():
            user = serializer.save()

            return Response(
                {
                    "message": "Votre compte a été activé avec succès.",
                    "user_id": user.id_utilisateur,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#company admin create role permission (associate a permission with a role)for his company
#POST /api/v1/accounts/roles/<role_id>/permissions/
#company admin list permissions of a role
#GET /api/v1/accounts/roles/<role_id>/permissions/
class RolePermissionCreateView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, role_id):

        # 1. Vérifier que le rôle appartient
        #    à l'entreprise de l'utilisateur.
        try:
            role = Role.objects.get(
                id=role_id,
                entreprise=request.user.entreprise,
            )
        except Role.DoesNotExist:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Récupérer les permissions du rôle.
        role_permissions = RolePermission.objects.filter(
            role=role
        ).select_related("permission").order_by(
            "permission__code"
        )

        # 3. Sérialiser les associations.
        serializer = RolePermissionSerializer(
            role_permissions,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, role_id):

        # 1. Vérifier que l'utilisateur possède le droit
        #    de modifier les permissions des rôles.
        if not request.user.is_company_admin:
            return Response(
                {
                    "detail": "Seul le Company Admin peut gérer les permissions des rôles."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Le rôle doit appartenir à l'entreprise de l'utilisateur.
        try:
            role = Role.objects.get(
                id=role_id,
                entreprise=request.user.entreprise,
                statut=Role.Statut.ACTIF,
            )
        except Role.DoesNotExist:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 3. Vérifier que le permission ID existe.
        permission_id = request.data.get("permission")

        if not permission_id:
            return Response(
                {
                    "permission": [
                        "Ce champ est obligatoire."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            permission = Permission.objects.get(
                id=permission_id
            )
        except Permission.DoesNotExist:
            return Response(
                {
                    "permission": [
                        "Cette permission n'existe pas."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 4. Éviter les doublons.
        if RolePermission.objects.filter(
            role=role,
            permission=permission,
        ).exists():
            return Response(
                {
                    "detail": "Cette permission est déjà attribuée à ce rôle."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 5. Créer l'association.
        role_permission = RolePermission.objects.create(
            role=role,
            permission=permission,
        )

        serializer = RolePermissionSerializer(
            role_permission
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )
#company admin remove permission from his role
#DELETE /api/v1/accounts/roles/<role_id>/permissions/<permission_id>/
class RolePermissionDeleteView(APIView):

    permission_classes = [
        IsAuthenticated,
    ]

    def delete(self, request, role_id, permission_id):

        # 1. Vérifier que l'utilisateur peut gérer
        #    les permissions des rôles.
        if not user_has_permission(
            request.user,
            "ROLE_MODIFIER",
        ):
            return Response(
                {
                    "detail": (
                        "Vous n'avez pas la permission "
                        "de modifier les permissions des rôles."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Vérifier que le rôle appartient
        #    à l'entreprise de l'utilisateur.
        try:
            role = Role.objects.get(
                id=role_id,
                entreprise=request.user.entreprise,
                statut=Role.Statut.ACTIF,
            )
        except Role.DoesNotExist:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 3. Vérifier que l'association existe.
        try:
            role_permission = RolePermission.objects.get(
                role=role,
                permission_id=permission_id,
            )
        except RolePermission.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Cette permission n'est pas "
                        "attribuée à ce rôle."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 4. Supprimer uniquement l'association.
        role_permission.delete()

        return Response(
            {
                "message": (
                    "La permission a été retirée du rôle avec succès."
                ),
                "role_id": role.id,
                "permission_id": permission_id,
            },
            status=status.HTTP_200_OK,
        )
#company admin list his employees
#GET /api/v1/accounts/employees/
class EmployeeListView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "EMPLOYE_CONSULTER"

    def get(self, request):

        employees = User.objects.filter(
            entreprise=request.user.entreprise,
            is_company_admin=False,
        ).select_related("role").order_by("nom", "prenom")

        serializer = EmployeeListSerializer(
            employees,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
#company admin get an employee details
#GET /api/v1/accounts/employees/<employee_id>/
#company admin update an employee information
# PATCH /api/v1/accounts/employees/<employee_id>/
class EmployeeDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "EMPLOYE_CONSULTER",
        "PATCH": "EMPLOYE_MODIFIER",
        "DELETE": "EMPLOYE_ARCHIVER",
    }

    def get(self, request, employee_id):

        # 1. Récupérer uniquement un employé
        #    appartenant à la même entreprise.
        try:
            employee = User.objects.select_related(
                "role"
            ).get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "Employé introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Sérialiser l'employé.
        serializer = EmployeeListSerializer(employee)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, employee_id):

        # 1. Récupérer uniquement un employé
        #    appartenant à la même entreprise.
        try:
            employee = User.objects.select_related(
                "role"
            ).get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "Employé introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Un employé désactivé ne peut pas être modifié
        #    par cette API administrative.
        if employee.statut == User.Statut.DESACTIVE:
            return Response(
                {
                    "detail": (
                        "Impossible de modifier "
                        "un employé désactivé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Valider et appliquer les modifications.
        serializer = EmployeeUpdateSerializer(
            employee,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            employee = serializer.save()

            # Recharger le rôle après modification
            # pour avoir role_nom correctement.
            employee = User.objects.select_related(
                "role"
            ).get(
                id_utilisateur=employee.id_utilisateur
            )

            return Response(
                EmployeeListSerializer(employee).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
    def delete(self, request, employee_id):

        # 1. Récupérer uniquement un employé
        #    appartenant à la même entreprise.
        try:
            employee = User.objects.get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "Employé introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 2. Vérifier que l'employé est actuellement actif.
        if employee.statut == User.Statut.DESACTIVE:
            return Response(
                {
                    "detail": "Cet employé est déjà désactivé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Désactiver l'employé au lieu de le supprimer.
        employee.statut = User.Statut.DESACTIVE
        employee.save(update_fields=["statut"])

        return Response(
            {
                "message": "L'employé a été archivé avec succès.",
                "user_id": employee.id_utilisateur,
            },
            status=status.HTTP_200_OK,
        )   
#company admin list and create roles for his company
# GET /api/v1/accounts/roles/
# POST /api/v1/accounts/roles/
class RoleListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "ROLE_CONSULTER",
        "POST": "ROLE_CREER",
    }

    def get(self, request):

        roles = Role.objects.filter(
            entreprise=request.user.entreprise,
            statut=Role.Statut.ACTIF,
        ).order_by("nom")

        serializer = RoleSerializer(
            roles,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = RoleSerializer(
            data=request.data
        )

        if serializer.is_valid():

            role = serializer.save(
                entreprise=request.user.entreprise
            )

            return Response(
                RoleSerializer(role).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#company admin get, update, delete roles for his company
# GET /api/v1/accounts/roles/<role_id>/
# PATCH /api/v1/accounts/roles/<role_id>/
# DELETE /api/v1/accounts/roles/<role_id>/
class RoleDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "ROLE_CONSULTER",
        "PATCH": "ROLE_MODIFIER",
        "DELETE": "ROLE_ARCHIVER",
    }

    def get_role(self, request, role_id):

        try:
            return Role.objects.get(
                id=role_id,
                entreprise=request.user.entreprise,
            )
        except Role.DoesNotExist:
            return None

    def get(self, request, role_id):

        role = self.get_role(
            request,
            role_id,
        )

        if role is None:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = RoleSerializer(role)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, role_id):

        role = self.get_role(
            request,
            role_id,
        )

        if role is None:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if role.statut == Role.Statut.ARCHIVE:
            return Response(
                {
                    "detail": "Impossible de modifier un rôle archivé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = RoleSerializer(
            role,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():

            role = serializer.save()

            return Response(
                RoleSerializer(role).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, role_id):

        role = self.get_role(
            request,
            role_id,
        )

        if role is None:
            return Response(
                {
                    "detail": "Rôle introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if role.statut == Role.Statut.ARCHIVE:
            return Response(
                {
                    "detail": "Ce rôle est déjà archivé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        employees_using_role = User.objects.filter(
            role=role,
            is_company_admin=False,
            is_active=True,
        ).exists()

        if employees_using_role:
            return Response(
                {
                    "detail": (
                        "Impossible d'archiver ce rôle car "
                        "il est encore attribué à un employé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        role.statut = Role.Statut.ARCHIVE
        role.save(
            update_fields=["statut"]
        )

        return Response(
            {
                "message": "Le rôle a été archivé avec succès.",
                "role_id": role.id,
            },
            status=status.HTTP_200_OK,
        )
#company admin get his company profile
#company admin update his company profile
# GET /api/v1/accounts/companies/me/
# PATCH /api/v1/accounts/companies/me/
class CompanyProfileView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "ENTREPRISE_CONSULTER",
        "PATCH": "ENTREPRISE_MODIFIER",
    }

    def get(self, request):

        company = request.user.entreprise

        if not company:
            return Response(
                {
                    "detail": "Aucune entreprise associée à cet utilisateur."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyProfileSerializer(company)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):

        company = request.user.entreprise

        if not company:
            return Response(
                {
                    "detail": "Aucune entreprise associée à cet utilisateur."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CompanyProfileSerializer(
            company,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )