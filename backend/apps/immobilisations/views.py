from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from apps.accounts.permissions import HasPermission

from .models import Famille

from .serializers import (
    FamilleSerializer,
    FamilleArchiveSerializer,
    FamilleRestoreSerializer,
)
#List the user's company families
#GET /api/v1/immobilisations/familles/
#Create a new family
#POST /api/v1/immobilisations/familles/
class FamilleListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "FAMILLE_CONSULTER",
        "POST": "FAMILLE_AJOUTER",
    }

    def get(self, request):
        familles = (
            Famille.objects
            .filter(entreprise=request.user.entreprise)
            .order_by("nom")
        )

        serializer = FamilleSerializer(
            familles,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = FamilleSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            famille = serializer.save()

            return Response(
                FamilleSerializer(
                    famille,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#View one family
#GET /api/v1/immobilisations/familles/<int:famille_id>/
#Modify a family
#PATCH /api/v1/immobilisations/familles/<int:famille_id>/
#Delete a family
#DELETE /api/v1/immobilisations/familles/<famille_id>/
class FamilleDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "FAMILLE_CONSULTER",
        "PATCH": "FAMILLE_MODIFIER",
        "DELETE": "FAMILLE_SUPPRIMER",
    }

    def get_object(self, request, famille_id):
        try:
            return Famille.objects.get(
                id_famille=famille_id,
                entreprise=request.user.entreprise,
            )
        except Famille.DoesNotExist:
            return None

    def get(self, request, famille_id):
        famille = self.get_object(request, famille_id)

        if famille is None:
            return Response(
                {
                    "detail": "Famille introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FamilleSerializer(
            famille,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, famille_id):
        famille = self.get_object(request, famille_id)

        if famille is None:
            return Response(
                {
                    "detail": "Famille introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if famille.statut == Famille.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Une famille archivée ne peut pas être modifiée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = FamilleSerializer(
            famille,
            data=request.data,
            partial=True,
            context={"request": request},
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
    def delete(self, request, famille_id):
        famille = self.get_object(request, famille_id)

        if famille is None:
            return Response(
                {
                    "detail": "Famille introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if famille.statut == Famille.Statut.ACTIVE:
            return Response(
                {
                    "detail": (
                        "Une famille active doit être archivée "
                        "avant de pouvoir être supprimée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        famille.delete()

        return Response(
            {
                "message": "La famille a été supprimée.",
                "famille_id": famille_id,
            },
            status=status.HTTP_200_OK,
        )
#Archive a family
#POST /api/v1/immobilisations/familles/<famille_id>/archive/
class FamilleArchiveView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "FAMILLE_ARCHIVER"

    def post(self, request, famille_id):

        try:
            famille = Famille.objects.get(
                id_famille=famille_id,
                entreprise=request.user.entreprise,
            )
        except Famille.DoesNotExist:
            return Response(
                {
                    "detail": "Famille introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FamilleArchiveSerializer(
            context={"famille": famille}
        )

        try:
            serializer.save()
        except serializers.ValidationError as e:
            return Response(
                e.detail,
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "La famille a été archivée.",
                "famille_id": famille.id_famille,
            },
            status=status.HTTP_200_OK,
        )
#Restore a family
#POST /api/v1/immobilisations/familles/<famille_id>/restore/
class FamilleRestoreView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "FAMILLE_RESTAURER"

    def post(self, request, famille_id):

        try:
            famille = Famille.objects.get(
                id_famille=famille_id,
                entreprise=request.user.entreprise,
            )
        except Famille.DoesNotExist:
            return Response(
                {
                    "detail": "Famille introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = FamilleRestoreSerializer(
            context={"famille": famille}
        )

        try:
            serializer.save()
        except serializers.ValidationError as e:
            return Response(
                e.detail,
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message": "La famille a été restaurée.",
                "famille_id": famille.id_famille,
            },
            status=status.HTTP_200_OK,
        )
