from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers

from ..accounts.permissions import HasPermission

from .models import Famille, AttributDynamique

from .serializers import (
    FamilleSerializer,
    FamilleArchiveSerializer,
    FamilleRestoreSerializer,
    AttributDynamiqueSerializer,
)

#famille

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

#attributdynamique

#List the user's company attributes
#GET  /api/v1/immobilisations/attributs/
#Create a new attribute
#POST /api/v1/immobilisations/attributs/
class AttributDynamiqueListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "ATTRIBUT_CONSULTER",
        "POST": "ATTRIBUT_AJOUTER",
    }

    def get(self, request):
        attributs = AttributDynamique.objects.filter(
            famille__entreprise=request.user.entreprise
        )

        serializer = AttributDynamiqueSerializer(
            attributs,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        famille_id = request.data.get("famille")

        if not famille_id:
            return Response(
                {"famille": "La famille est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            famille = Famille.objects.get(
                id_famille=famille_id,
                entreprise=request.user.entreprise,
            )
        except Famille.DoesNotExist:
            return Response(
                {"famille": "Famille introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if famille.statut == Famille.Statut.ARCHIVEE:
            return Response(
                {"famille": "Une famille archivée ne peut pas recevoir de nouvel attribut."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttributDynamiqueSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            serializer.save(famille=famille)

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#Get an attribute
#GET /api/v1/immobilisations/attributs/<attribut_id>/
#Modify an attribute
#PATCH /api/v1/immobilisations/attributs/<attribut_id>/
#Delete an attribute
#DELETE /api/v1/immobilisations/attributs/<attribut_id>/
class AttributDynamiqueDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "ATTRIBUT_CONSULTER",
        "PATCH": "ATTRIBUT_MODIFIER",
        "DELETE": "ATTRIBUT_SUPPRIMER",
    }

    def get_object(self, request, attribut_id):
        try:
            return AttributDynamique.objects.get(
                id_attribut=attribut_id,
                famille__entreprise=request.user.entreprise,
            )
        except AttributDynamique.DoesNotExist:
            return None

    def get(self, request, attribut_id):
        attribut = self.get_object(request, attribut_id)

        if attribut is None:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = AttributDynamiqueSerializer(
            attribut,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    def patch(self, request, attribut_id):
        attribut = self.get_object(request, attribut_id)

        if attribut is None:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if attribut.statut == AttributDynamique.Statut.ARCHIVEE:
            return Response(
                {"detail": "Un attribut dynamique archivé ne peut pas être modifié."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = AttributDynamiqueSerializer(
            attribut,
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
    def delete(self, request, attribut_id):
        attribut = self.get_object(request, attribut_id)

        if attribut is None:
            return Response(
            {"detail": "Attribut dynamique introuvable."},
            status=status.HTTP_404_NOT_FOUND,
        )

        if attribut.statut == AttributDynamique.Statut.ACTIVE:
            return Response(
                {
                    "detail": (
                        "Un attribut dynamique actif doit être archivé "
                        "avant de pouvoir être supprimé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        attribut.delete()

        return Response(
            {
                "message": "L'attribut dynamique a été supprimé.",
                "attribut_id": attribut_id,
            },
            status=status.HTTP_200_OK,
        )
#Archive an attribute
#POST /api/v1/immobilisations/attributs/<attribut_id>/archive/
class AttributDynamiqueArchiveView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "ATTRIBUT_ARCHIVER"

    def post(self, request, attribut_id):
        try:
            attribut = AttributDynamique.objects.get(
                id_attribut=attribut_id,
                famille__entreprise=request.user.entreprise,
            )
        except AttributDynamique.DoesNotExist:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if attribut.statut == AttributDynamique.Statut.ARCHIVEE:
            return Response(
                {"detail": "L'attribut dynamique est déjà archivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attribut.statut = AttributDynamique.Statut.ARCHIVEE
        attribut.save(update_fields=["statut"])

        serializer = AttributDynamiqueSerializer(
            attribut,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
#Restore an attribute
#POST /api/v1/immobilisations/attributs/<attribut_id>/restore/
class AttributDynamiqueRestoreView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "ATTRIBUT_RESTAURER"

    def post(self, request, attribut_id):
        try:
            attribut = AttributDynamique.objects.get(
                id_attribut=attribut_id,
                famille__entreprise=request.user.entreprise,
            )
        except AttributDynamique.DoesNotExist:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if attribut.statut == AttributDynamique.Statut.ACTIVE:
            return Response(
                {"detail": "L'attribut dynamique est déjà actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        attribut.statut = AttributDynamique.Statut.ACTIVE
        attribut.save(update_fields=["statut"])

        serializer = AttributDynamiqueSerializer(
            attribut,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )