import json
import math
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .models import User
from rest_framework_simplejwt.tokens import RefreshToken

def euclidean_distance(desc1, desc2):
    if len(desc1) != len(desc2):
        return 999.0
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(desc1, desc2)))

class AIFaceRegisterView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        descriptor = request.data.get("descriptor")

        if not descriptor or not isinstance(descriptor, list) or len(descriptor) != 128:
            return Response({"error": "Descripteur facial invalide."}, status=status.HTTP_400_BAD_REQUEST)

        user.ai_face_descriptor = json.dumps(descriptor)
        user.save()

        return Response({"message": "Visage enregistré avec succès !"}, status=status.HTTP_201_CREATED)

class AIFaceLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        descriptor = request.data.get("descriptor")

        if not email or not descriptor or not isinstance(descriptor, list) or len(descriptor) != 128:
            return Response({"error": "Email et descripteur facial requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active or not user.is_approved:
            return Response({"error": "Compte inactif ou non approuvé."}, status=status.HTTP_403_FORBIDDEN)

        if not user.ai_face_descriptor:
            return Response({"error": "Vous n'avez pas enregistré votre visage. Connectez-vous avec votre mot de passe et activez l'IA Faciale dans votre profil."}, status=status.HTTP_400_BAD_REQUEST)

        saved_descriptor = json.loads(user.ai_face_descriptor)
        distance = euclidean_distance(saved_descriptor, descriptor)

        # 0.6 is the standard threshold for face-api.js models (Euclidean distance)
        # We can be a bit more strict e.g. 0.5 if we want, but 0.55 is a good balance.
        if distance > 0.55:
            return Response({"error": "Visage non reconnu."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "message": "Connexion IA réussie.",
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_200_OK
        )
