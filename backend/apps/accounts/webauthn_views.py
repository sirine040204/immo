import base64
import json
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from webauthn import (
    generate_registration_options,
    verify_registration_response,
    generate_authentication_options,
    verify_authentication_response,
    options_to_json,
    base64url_to_bytes,
)
from webauthn.helpers.structs import (
    AuthenticatorSelectionCriteria,
    UserVerificationRequirement,
    PublicKeyCredentialDescriptor,
    PublicKeyCredentialType,
)
from webauthn.helpers.exceptions import InvalidRegistrationResponse, InvalidAuthenticationResponse
from .models import User, Passkey
from rest_framework_simplejwt.tokens import RefreshToken

RP_ID = "localhost"
RP_NAME = "AssetFlow"
ORIGIN = "http://localhost:3000"

class WebAuthnRegisterOptionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        existing_passkeys = Passkey.objects.filter(user=user)
        # Fix base64url encoding for credential_id
        exclude_credentials = []
        for p in existing_passkeys:
            # We add '=' padding back if needed
            cid = p.credential_id
            padding = 4 - (len(cid) % 4)
            if padding < 4:
                cid += '=' * padding
            exclude_credentials.append(
                PublicKeyCredentialDescriptor(
                    id=base64.urlsafe_b64decode(cid),
                    type=PublicKeyCredentialType.PUBLIC_KEY
                )
            )

        options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=str(user.id_utilisateur).encode("utf-8"),
            user_name=user.email,
            exclude_credentials=exclude_credentials,
            authenticator_selection=AuthenticatorSelectionCriteria(
                user_verification=UserVerificationRequirement.PREFERRED
            ),
        )

        user.webauthn_challenge = base64.b64encode(options.challenge).decode("utf-8")
        user.save()

        # options_to_json returns a JSON string, so we load it to a dict
        return Response(json.loads(options_to_json(options)), status=status.HTTP_200_OK)


class WebAuthnRegisterVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        data = request.data

        expected_challenge = base64.b64decode(user.webauthn_challenge)

        try:
            verification = verify_registration_response(
                credential=data,
                expected_challenge=expected_challenge,
                expected_rp_id=RP_ID,
                expected_origin=ORIGIN,
            )

            Passkey.objects.create(
                user=user,
                credential_id=data.get("id"),  # Keep original base64url string
                public_key=base64.b64encode(verification.credential_public_key).decode('utf-8'),
                sign_count=verification.sign_count,
            )

            user.webauthn_challenge = ""
            user.save()

            return Response({"message": "Passkey enregistré avec succès."}, status=status.HTTP_201_CREATED)

        except InvalidRegistrationResponse as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WebAuthnLoginOptionsView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"error": "Email requis."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        if not user.is_active or not user.is_approved:
            return Response({"error": "Compte inactif ou non approuvé."}, status=status.HTTP_403_FORBIDDEN)

        if not Passkey.objects.filter(user=user).exists():
            return Response({"error": "Vous n'avez pas encore activé Face ID. Veuillez vous connecter avec votre mot de passe et l'activer dans votre profil (Paramètres)."}, status=status.HTTP_400_BAD_REQUEST)

        options = generate_authentication_options(
            rp_id=RP_ID,
            user_verification=UserVerificationRequirement.PREFERRED,
        )

        user.webauthn_challenge = base64.b64encode(options.challenge).decode("utf-8")
        user.save()

        return Response(json.loads(options_to_json(options)), status=status.HTTP_200_OK)


class WebAuthnLoginVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")
        response_data = request.data.get("data")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({"error": "Utilisateur non trouvé."}, status=status.HTTP_404_NOT_FOUND)

        expected_challenge = base64.b64decode(user.webauthn_challenge)
        credential_id = response_data.get("id")

        try:
            passkey = Passkey.objects.get(user=user, credential_id=credential_id)
        except Passkey.DoesNotExist:
            return Response({"error": "Clé non trouvée."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            verification = verify_authentication_response(
                credential=response_data,
                expected_challenge=expected_challenge,
                expected_rp_id=RP_ID,
                expected_origin=ORIGIN,
                credential_public_key=base64.b64decode(passkey.public_key),
                credential_current_sign_count=passkey.sign_count,
            )

            passkey.sign_count = verification.new_sign_count
            passkey.save()

            user.webauthn_challenge = ""
            user.save()

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Connexion réussie.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                },
                status=status.HTTP_200_OK
            )

        except InvalidAuthenticationResponse as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
