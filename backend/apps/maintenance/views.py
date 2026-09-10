from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics

from .models import TypeEntretien, ModeleEntretien, EtapeEntretien
from .serializers import TypeEntretienSerializer, ModeleEntretienSerializer, EtapeEntretienSerializer
from ..accounts.permissions import HasPermission

#type entretien views

#List the user's company maintenance types
#GET /api/v1/maintenance/types-entretien/
#Create a new maintenance type
#POST /api/v1/maintenance/types-entretien/
class TypeEntretienListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_ENTRETIEN_CONSULTER",
        "POST": "TYPE_ENTRETIEN_AJOUTER",
    }

    def get(self, request):
        types_entretien = (
            TypeEntretien.objects
            .filter(entreprise=request.user.entreprise)
            .order_by("nom")
        )

        serializer = TypeEntretienSerializer(
            types_entretien,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = TypeEntretienSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            type_entretien = serializer.save()

            return Response(
                TypeEntretienSerializer(
                    type_entretien,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

#Get a specific maintenance type
#GET /api/v1/maintenance/types-entretien/<int:type_entretien_id>/
#Update a specific maintenance type
#PATCH /api/v1/maintenance/types-entretien/<int:type_entretien_id>/ 
class TypeEntretienDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_ENTRETIEN_CONSULTER",
        "PATCH": "TYPE_ENTRETIEN_MODIFIER",
    }

    def get_object(self, request, type_entretien_id):
        return TypeEntretien.objects.filter(
            id=type_entretien_id,
            entreprise=request.user.entreprise,
        ).first()

    def get(self, request, type_entretien_id):
        type_entretien = self.get_object(
            request,
            type_entretien_id,
        )

        if type_entretien is None:
            return Response(
                {
                    "detail": "Type d'entretien introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeEntretienSerializer(
            type_entretien,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, type_entretien_id):
        type_entretien = self.get_object(
            request,
            type_entretien_id,
        )

        if type_entretien is None:
            return Response(
                {
                    "detail": "Type d'entretien introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeEntretienSerializer(
            type_entretien,
            data=request.data,
            partial=True,
            context={"request": request},
        )

        if serializer.is_valid():
            type_entretien = serializer.save()

            return Response(
                TypeEntretienSerializer(
                    type_entretien,
                    context={"request": request},
                ).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

#Archive a maintenance type
#POST /api/v1/maintenance/types-entretien/<int:type_entretien_id>/archive/
class TypeEntretienArchiveView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "TYPE_ENTRETIEN_ARCHIVER"

    def post(self, request, type_entretien_id):
        type_entretien = TypeEntretien.objects.filter(
            id=type_entretien_id,
            entreprise=request.user.entreprise,
        ).first()

        if type_entretien is None:
            return Response(
                {
                    "detail": "Type d'entretien introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if type_entretien.statut == TypeEntretien.Statut.ARCHIVE:
            return Response(
                {
                    "detail": "Ce type d'entretien est déjà archivé."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        type_entretien.statut = TypeEntretien.Statut.ARCHIVE
        type_entretien.save(update_fields=["statut"])

        return Response(
            TypeEntretienSerializer(
                type_entretien,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

#Restore an archive maintenance type
#POST /api/v1/maintenance/types-entretien/<int:type_entretien_id>/restore/
class TypeEntretienRestoreView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "TYPE_ENTRETIEN_RESTAURER"

    def post(self, request, type_entretien_id):
        type_entretien = TypeEntretien.objects.filter(
            id=type_entretien_id,
            entreprise=request.user.entreprise,
        ).first()

        if type_entretien is None:
            return Response(
                {
                    "detail": "Type d'entretien introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if type_entretien.statut == TypeEntretien.Statut.ACTIF:
            return Response(
                {
                    "detail": "Ce type d'entretien est déjà actif."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        type_entretien.statut = TypeEntretien.Statut.ACTIF
        type_entretien.save(update_fields=["statut"])

        return Response(
            TypeEntretienSerializer(
                type_entretien,
                context={"request": request},
            ).data,
            status=status.HTTP_200_OK,
        )

#Delete a maintenance type
#DELETE /api/v1/maintenance/types-entretien/<int:type_entretien_id>/delete/
class TypeEntretienDeleteView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "TYPE_ENTRETIEN_SUPPRIMER"

    def delete(self, request, type_entretien_id):
        type_entretien = TypeEntretien.objects.filter(
            id=type_entretien_id,
            entreprise=request.user.entreprise,
        ).first()

        if type_entretien is None:
            return Response(
                {
                    "detail": "Type d'entretien introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        type_entretien.delete()

        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )

#modele entretien
#GET /api/v1/maintenance/modeles-entretien/
#POST /api/v1/maintenance/modeles-entretien/
class ModeleEntretienListCreateView(generics.ListCreateAPIView):
    serializer_class = ModeleEntretienSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "MODELE_ENTRETIEN_CONSULTER",
        "POST": "MODELE_ENTRETIEN_AJOUTER",
    }

    def get_queryset(self):
        return ModeleEntretien.objects.filter(
            entreprise=self.request.user.entreprise
        ).select_related(
            "famille",
            "type_entretien",
        )

#GET /api/v1/maintenance/modeles-entretien/<id>/
#PATCH /api/v1/maintenance/modeles-entretien/<id>/
class ModeleEntretienDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ModeleEntretienSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_url_kwarg = "modele_entretien_id"

    required_permission = {
        "GET": "MODELE_ENTRETIEN_CONSULTER",
        "PATCH": "MODELE_ENTRETIEN_MODIFIER",
    }

    def get_queryset(self):
        return ModeleEntretien.objects.filter(
            entreprise=self.request.user.entreprise
        ).select_related(
            "famille",
            "type_entretien",
        )

#POST /api/v1/maintenance/modeles-entretien/<id>/archive/
class ModeleEntretienArchiveView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "MODELE_ENTRETIEN_ARCHIVER"

    def post(self, request, modele_entretien_id):
        try:
            modele = ModeleEntretien.objects.get(
                id=modele_entretien_id,
                entreprise=request.user.entreprise,
            )
        except ModeleEntretien.DoesNotExist:
            return Response(
                {"detail": "Modèle d'entretien introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if modele.statut == ModeleEntretien.Statut.ARCHIVE:
            return Response(
                {"detail": "Le modèle d'entretien est déjà archivé."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        modele.statut = ModeleEntretien.Statut.ARCHIVE
        modele.save(update_fields=["statut"])

        return Response(
            {"detail": "Modèle d'entretien archivé avec succès."},
            status=status.HTTP_200_OK,
        )

#POST /api/v1/maintenance/modeles-entretien/<id>/restore/
class ModeleEntretienRestoreView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "MODELE_ENTRETIEN_RESTAURER"

    def post(self, request, modele_entretien_id):
        try:
            modele = ModeleEntretien.objects.get(
                id=modele_entretien_id,
                entreprise=request.user.entreprise,
            )
        except ModeleEntretien.DoesNotExist:
            return Response(
                {"detail": "Modèle d'entretien introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if modele.statut == ModeleEntretien.Statut.ACTIF:
            return Response(
                {"detail": "Le modèle d'entretien est déjà actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        modele.statut = ModeleEntretien.Statut.ACTIF
        modele.save(update_fields=["statut"])

        return Response(
            {"detail": "Modèle d'entretien restauré avec succès."},
            status=status.HTTP_200_OK,
        )
#DELETE /api/v1/maintenance/modeles-entretien/<id>/delete/
class ModeleEntretienDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "MODELE_ENTRETIEN_SUPPRIMER"

    def get_queryset(self):
        return ModeleEntretien.objects.filter(
            entreprise=self.request.user.entreprise
        )

    lookup_url_kwarg = "modele_entretien_id"

#etape entretien
#GET /api/v1/maintenance/etapes-entretien/
#POST /api/v1/maintenance/etapes-entretien/
class EtapeEntretienListCreateView(generics.ListCreateAPIView):
    serializer_class = EtapeEntretienSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "ETAPE_ENTRETIEN_CONSULTER",
        "POST": "ETAPE_ENTRETIEN_AJOUTER",
    }

    def get_queryset(self):
        return EtapeEntretien.objects.filter(
            modele_entretien__entreprise=self.request.user.entreprise
        ).select_related(
            "modele_entretien",
        )

#GET /api/v1/maintenance/etapes-entretien/<id>/
#PATCH /api/v1/maintenance/etapes-entretien/<id>/
class EtapeEntretienDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = EtapeEntretienSerializer
    permission_classes = [IsAuthenticated, HasPermission]
    lookup_url_kwarg = "etape_entretien_id"

    required_permission = {
        "GET": "ETAPE_ENTRETIEN_CONSULTER",
        "PATCH": "ETAPE_ENTRETIEN_MODIFIER",
    }

    def get_queryset(self):
        return EtapeEntretien.objects.filter(
            modele_entretien__entreprise=self.request.user.entreprise
        ).select_related(
            "modele_entretien",
        )

#POST /api/v1/maintenance/etapes-entretien/<id>/archive/
class EtapeEntretienArchiveView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "ETAPE_ENTRETIEN_ARCHIVER"

    def post(self, request, etape_entretien_id):
        try:
            etape = EtapeEntretien.objects.get(
                id=etape_entretien_id,
                modele_entretien__entreprise=request.user.entreprise,
            )
        except EtapeEntretien.DoesNotExist:
            return Response(
                {"detail": "Étape d'entretien introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if etape.statut == EtapeEntretien.Statut.ARCHIVE:
            return Response(
                {"detail": "L'étape d'entretien est déjà archivée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        etape.statut = EtapeEntretien.Statut.ARCHIVE
        etape.save(update_fields=["statut"])

        return Response(
            {"detail": "Étape d'entretien archivée avec succès."},
            status=status.HTTP_200_OK,
        )
#POST /api/v1/maintenance/etapes-entretien/<id>/restore/
class EtapeEntretienRestoreView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "ETAPE_ENTRETIEN_RESTAURER"

    def post(self, request, etape_entretien_id):
        try:
            etape = EtapeEntretien.objects.get(
                id=etape_entretien_id,
                modele_entretien__entreprise=request.user.entreprise,
            )
        except EtapeEntretien.DoesNotExist:
            return Response(
                {"detail": "Étape d'entretien introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if etape.statut == EtapeEntretien.Statut.ACTIF:
            return Response(
                {"detail": "L'étape d'entretien est déjà active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        etape.statut = EtapeEntretien.Statut.ACTIF
        etape.save(update_fields=["statut"])

        return Response(
            {"detail": "Étape d'entretien restaurée avec succès."},
            status=status.HTTP_200_OK,
        )
#DELETE /api/v1/maintenance/etapes-entretien/<id>/delete/
class EtapeEntretienDeleteView(generics.DestroyAPIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = "ETAPE_ENTRETIEN_SUPPRIMER"

    lookup_url_kwarg = "etape_entretien_id"

    def get_queryset(self):
        return EtapeEntretien.objects.filter(
            modele_entretien__entreprise=self.request.user.entreprise
        )
