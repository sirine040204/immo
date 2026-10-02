from rest_framework import status
from django.utils import timezone
from django.db import transaction
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
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifyOTPSerializer,
    PasswordResetConfirmSerializer,
    GoogleLoginSerializer,
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

# GET /api/v1/accounts/me/
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        if serializer.is_valid():
            user = serializer.save()
            return Response(
                UserProfileSerializer(user).data,
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

        print("INVITATION ERRORS:", serializer.errors)
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
# GET /api/v1/accounts/permissions/
class PermissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_company_admin:
            return Response(
                {"detail": "Seul le Company Admin peut consulter la liste des permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )
            
        permissions = Permission.objects.all().order_by("code")
        data = [
            {
                "id": p.id,
                "code": p.code,
                "nom": p.nom,
                "description": p.description,
            }
            for p in permissions
        ]
        return Response(data, status=status.HTTP_200_OK)

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
#company admin delete an employee
# DELETE /api/v1/accounts/employees/<employee_id>/
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

# POST /api/v1/accounts/employees/<employee_id>/deactivate/
class EmployeeDeactivationView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "EMPLOYE_MODIFIER"

    def post(self, request, employee_id):
        try:
            employee = User.objects.get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response({"detail": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if employee.statut == User.Statut.DESACTIVE:
            return Response({"detail": "Cet employé est déjà désactivé."}, status=status.HTTP_400_BAD_REQUEST)

        employee.statut = User.Statut.DESACTIVE
        employee.is_active = False
        employee.save(update_fields=["statut", "is_active"])

        return Response({"message": "L'employé a été désactivé avec succès."}, status=status.HTTP_200_OK)

# POST /api/v1/accounts/employees/<employee_id>/reactivate/
class EmployeeReactivationView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "EMPLOYE_MODIFIER"

    def post(self, request, employee_id):
        try:
            employee = User.objects.get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response({"detail": "Employé introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if employee.statut == User.Statut.ACTIVE:
            return Response({"detail": "Cet employé est déjà actif."}, status=status.HTTP_400_BAD_REQUEST)

        employee.statut = User.Statut.ACTIVE
        employee.is_active = True
        employee.save(update_fields=["statut", "is_active"])

        return Response({"message": "L'employé a été réactivé avec succès."}, status=status.HTTP_200_OK)

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
        include_archived = request.query_params.get("include_archived", "false").lower() == "true"
        
        if include_archived:
            roles = Role.objects.filter(
                entreprise=request.user.entreprise,
            ).order_by("nom")
        else:
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

# POST /api/v1/accounts/roles/<role_id>/reactivate/
class RoleReactivationView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "ROLE_MODIFIER"

    def post(self, request, role_id):
        try:
            role = Role.objects.get(
                id=role_id,
                entreprise=request.user.entreprise,
            )
        except Role.DoesNotExist:
            return Response({"detail": "Rôle introuvable."}, status=status.HTTP_404_NOT_FOUND)

        if role.statut == Role.Statut.ACTIF:
            return Response({"detail": "Ce rôle est déjà actif."}, status=status.HTTP_400_BAD_REQUEST)

        role.statut = Role.Statut.ACTIF
        role.save(update_fields=["statut"])

        return Response({"message": "Le rôle a été réactivé avec succès."}, status=status.HTTP_200_OK)

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

#company admin cancel pending employee invitation
#DELETE /api/v1/accounts/employees/<employee_id>/cancel-invitation/
class EmployeeInvitationCancelView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "EMPLOYE_SUPPRIMER"

    def delete(self, request, employee_id):

        try:
            employee = User.objects.get(
                id_utilisateur=employee_id,
                entreprise=request.user.entreprise,
                statut=User.Statut.EN_ATTENTE,
                is_company_admin=False,
            )
        except User.DoesNotExist:
            return Response(
                {
                    "detail": "Employé en attente introuvable ou déjà activé."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # 1. Send cancellation email
        from ..accounts.utils import send_invitation_cancelled_email
        send_invitation_cancelled_email(employee)

        # 2. Delete the user (this cascades to EmployeeActivation)
        employee.delete()

        return Response(
            {
                "message": "L'invitation a été annulée et supprimée avec succès."
            },
            status=status.HTTP_200_OK,
        )

# Password Reset Views
# POST /api/v1/accounts/password-reset/request/
class PasswordResetRequestView(APIView):
    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Si l'email existe, un code et un lien ont été envoyés."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# POST /api/v1/accounts/password-reset/verify-otp/
class PasswordResetVerifyOTPView(APIView):
    def post(self, request):
        serializer = PasswordResetVerifyOTPSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data["reset_token"]
            return Response(
                {
                    "message": "OTP valide.",
                    "token": str(reset_token.token)
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# POST /api/v1/accounts/password-reset/confirm/
class PasswordResetConfirmView(APIView):
    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Votre mot de passe a été réinitialisé avec succès."},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

from .serializers import GoogleLoginSerializer
from rest_framework.permissions import AllowAny

# POST /api/v1/accounts/google-login/
class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if serializer.is_valid():
            return Response(
                {
                    "message": "Connexion Google réussie.",
                    "refresh": serializer.validated_data["refresh"],
                    "access": serializer.validated_data["access"],
                },
                status=status.HTTP_200_OK,
            )
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

# ============================================================
# PERMISSION REQUESTS
# ============================================================
from .models import PermissionRequest, Permission
from .serializers import PermissionRequestSerializer, PermissionRequestProcessSerializer

class PermissionRequestMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = PermissionRequest.objects.filter(
            user=request.user
        ).order_by('-date_demande')
            
        serializer = PermissionRequestSerializer(queryset, many=True)
        return Response(serializer.data)

from .permissions import HasPermission

class PermissionRequestListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .permissions import user_has_permission
        if not user_has_permission(request.user, "DEMANDES_GERER"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied({
                "detail": "Vous n'avez pas la permission d'effectuer cette action.",
                "missing_permission_code": "DEMANDES_GERER"
            })

        if request.user.is_company_admin:
            queryset = PermissionRequest.objects.filter(
                user__entreprise=request.user.entreprise
            ).order_by('-date_demande')
        else:
            queryset = PermissionRequest.objects.filter(
                user=request.user
            ).order_by('-date_demande')
            
        serializer = PermissionRequestSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        permission_code = request.data.get('permission_code')
        if not permission_code:
            return Response({"detail": "Le code de permission est requis."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            permission = Permission.objects.get(code=permission_code)
        except Permission.DoesNotExist:
            return Response({"detail": "Permission introuvable."}, status=status.HTTP_404_NOT_FOUND)
            
        # Check if user already has the permission
        if user_has_permission(request.user, permission_code):
            return Response({"detail": "Vous possédez déjà cette permission. Veuillez rafraîchir la page."}, status=status.HTTP_400_BAD_REQUEST)
            
        # Check if a pending request already exists
        if PermissionRequest.objects.filter(user=request.user, permission=permission, statut=PermissionRequest.Statut.PENDING).exists():
            return Response({"detail": "Une demande est déjà en cours pour cette permission."}, status=status.HTTP_400_BAD_REQUEST)
            
        perm_req = PermissionRequest.objects.create(
            user=request.user,

            permission=permission
        )
        
        # Here we could send an email to company admins
        # from django.core.mail import send_mail
        # send_mail(...)
        
        serializer = PermissionRequestSerializer(perm_req)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PermissionRequestProcessView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if not request.user.is_company_admin:
            return Response({"detail": "Seul un administrateur peut traiter les demandes."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            perm_req = PermissionRequest.objects.get(id=pk, user__entreprise=request.user.entreprise)
        except PermissionRequest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        action_input = request.data.get('action')
        if perm_req.statut != PermissionRequest.Statut.PENDING and action_input != 'REVOKE':
            return Response({"detail": "Cette demande a déjà été traitée."}, status=status.HTTP_400_BAD_REQUEST)
            
        if action_input == 'REVOKE' and perm_req.statut != PermissionRequest.Statut.ACCEPTED:
            return Response({"detail": "Seule une demande acceptée peut être révoquée."}, status=status.HTTP_400_BAD_REQUEST)
            
        serializer = PermissionRequestProcessSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        action = serializer.validated_data['action']
        motif = serializer.validated_data.get('motif_rejet', '')
        
        with transaction.atomic():
            if action == 'ACCEPT':
                perm_req.statut = PermissionRequest.Statut.ACCEPTED
                perm_req.user.extra_permissions.add(perm_req.permission)
            elif action == 'REVOKE':
                perm_req.statut = PermissionRequest.Statut.REJECTED
                perm_req.motif_rejet = motif
                perm_req.user.extra_permissions.remove(perm_req.permission)
            else:
                perm_req.statut = PermissionRequest.Statut.REJECTED
                perm_req.motif_rejet = motif
                
            perm_req.date_traitement = timezone.now()
            perm_req.traite_par = request.user
            perm_req.save()
            
            from ..accounts.utils import send_permission_request_processed_email, send_permission_revoked_email
            if action == 'REVOKE':
                send_permission_revoked_email(perm_req.user, perm_req.permission.nom)
            else:
                send_permission_request_processed_email(
                    user=perm_req.user,
                    permission_name=perm_req.permission.nom,
                    action=action,
                    motif=motif
                )
            
        return Response({"detail": "Demande traitée avec succès."}, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if not request.user.is_company_admin:
            return Response({"detail": "Seul un administrateur peut supprimer les demandes."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            perm_req = PermissionRequest.objects.get(id=pk, user__entreprise=request.user.entreprise)
        except PermissionRequest.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        if perm_req.statut == PermissionRequest.Statut.ACCEPTED:
            perm_req.user.extra_permissions.remove(perm_req.permission)
            from ..accounts.utils import send_permission_revoked_email
            send_permission_revoked_email(perm_req.user, perm_req.permission.nom)
            
        perm_req.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class EmployeeExtraPermissionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, employee_id):
        if not request.user.is_company_admin:
            return Response({"detail": "Seul un administrateur peut gérer les permissions individuelles."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            employee = User.objects.get(id_utilisateur=employee_id, entreprise=request.user.entreprise)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        perms = employee.extra_permissions.all()
        # Return a simple list of permissions (or use a basic serializer)
        return Response([
            {"id": p.id, "code": p.code, "nom": p.nom} for p in perms
        ])

    def post(self, request, employee_id):
        if not request.user.is_company_admin:
            return Response({"detail": "Seul un administrateur peut gérer les permissions individuelles."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            employee = User.objects.get(id_utilisateur=employee_id, entreprise=request.user.entreprise)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        permission_id = request.data.get("permission_id")
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response({"detail": "Permission introuvable."}, status=status.HTTP_404_NOT_FOUND)
            
        employee.extra_permissions.add(permission)
        return Response({"id": permission.id, "code": permission.code, "nom": permission.nom}, status=status.HTTP_201_CREATED)


class EmployeeExtraPermissionDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, employee_id, permission_id):
        if not request.user.is_company_admin:
            return Response({"detail": "Seul un administrateur peut gérer les permissions individuelles."}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            employee = User.objects.get(id_utilisateur=employee_id, entreprise=request.user.entreprise)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        try:
            permission = Permission.objects.get(id=permission_id)
        except Permission.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)
            
        employee.extra_permissions.remove(permission)
        
        from ..accounts.utils import send_permission_revoked_email
        send_permission_revoked_email(employee, permission.nom)
        
        return Response(status=status.HTTP_204_NO_CONTENT)