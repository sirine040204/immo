from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CompanyAdminRegistrationSerializer,
    LoginSerializer,
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