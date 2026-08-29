from rest_framework import status
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .models import Entreprise, EmployeeActivation
from .serializers import CompanyApprovalSerializer

from .serializers import (
    CompanyAdminRegistrationSerializer,
    LoginSerializer,
    EmployeeInvitationSerializer,
    EmployeeActivationSerializer,
)

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