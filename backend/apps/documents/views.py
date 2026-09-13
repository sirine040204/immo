from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from ..accounts.permissions import HasPermission

from .models import TypeDocument
from .serializers import (
    TypeDocumentSerializer,
    TypeDocumentArchiveSerializer,
    TypeDocumentRestoreSerializer,
)

#type document
#GET /api/v1/documents/types/
#POST /api/v1/documents/types/
class TypeDocumentListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_DOCUMENT_CONSULTER",
        "POST": "TYPE_DOCUMENT_AJOUTER",
    }

    def get(self, request):

        type_documents = TypeDocument.objects.filter(
            entreprise=request.user.entreprise
        )

        serializer = TypeDocumentSerializer(
            type_documents,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = TypeDocumentSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            type_document = serializer.save()

            return Response(
                TypeDocumentSerializer(
                    type_document,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

#GET /api/v1/documents/types/{id}/
#PUT /api/v1/documents/types/{id}/
#PATCH /api/v1/documents/types/{id}/
#DELETE /api/v1/documents/types/{id}/
class TypeDocumentDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_DOCUMENT_CONSULTER",
        "PUT": "TYPE_DOCUMENT_MODIFIER",
        "PATCH": "TYPE_DOCUMENT_MODIFIER",
        "DELETE": "TYPE_DOCUMENT_SUPPRIMER",
    }

    def get_object(self, request, type_document_id):

        try:
            return TypeDocument.objects.get(
                id_type_document=type_document_id,
                entreprise=request.user.entreprise,
            )

        except TypeDocument.DoesNotExist:
            return None

    def get(self, request, type_document_id):

        type_document = self.get_object(
            request,
            type_document_id,
        )

        if not type_document:
            return Response(
                {
                    "error": "Type de document introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeDocumentSerializer(
            type_document,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, type_document_id):

        return self.update(
            request,
            type_document_id,
            partial=False,
        )

    def patch(self, request, type_document_id):

        return self.update(
            request,
            type_document_id,
            partial=True,
        )

    def update(self, request, type_document_id, partial=False):

        type_document = self.get_object(
            request,
            type_document_id,
        )

        if not type_document:
            return Response(
                {
                    "error": "Type de document introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if type_document.statut == TypeDocument.Statut.ARCHIVE:

            return Response(
                {
                    "error": (
                        "Un type de document archivé "
                        "ne peut pas être modifié."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TypeDocumentSerializer(
            type_document,
            data=request.data,
            partial=partial,
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

    def delete(self, request, type_document_id):

        type_document = self.get_object(
            request,
            type_document_id,
        )

        if not type_document:
            return Response(
                {
                    "error": "Type de document introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if type_document.statut == TypeDocument.Statut.ACTIF:

            return Response(
                {
                    "error": (
                        "Un type de document actif ne peut pas "
                        "être supprimé. Archivez-le d'abord."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        type_document.delete()

        return Response(
            {
                "message": "Type de document supprimé avec succès."
            },
            status=status.HTTP_200_OK,
        )

#POST /api/v1/documents/types/{id}/archive/
class TypeDocumentArchiveView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "POST": "TYPE_DOCUMENT_ARCHIVER",
    }

    def post(self, request, type_document_id):

        try:
            type_document = TypeDocument.objects.get(
                id_type_document=type_document_id,
                entreprise=request.user.entreprise,
            )

        except TypeDocument.DoesNotExist:
            return Response(
                {
                    "error": "Type de document introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeDocumentArchiveSerializer(
            data={},
            context={
                "type_document": type_document,
            },
        )

        if serializer.is_valid():

            type_document.statut = TypeDocument.Statut.ARCHIVE
            type_document.save(
                update_fields=["statut"]
            )

            return Response(
                {
                    "message": (
                        "Type de document archivé avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

#POST /api/v1/documents/types/{id}/restore/
class TypeDocumentRestoreView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "POST": "TYPE_DOCUMENT_RESTAURER",
    }

    def post(self, request, type_document_id):

        try:
            type_document = TypeDocument.objects.get(
                id_type_document=type_document_id,
                entreprise=request.user.entreprise,
            )

        except TypeDocument.DoesNotExist:
            return Response(
                {
                    "error": "Type de document introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeDocumentRestoreSerializer(
            data={},
            context={
                "type_document": type_document,
            },
        )

        if serializer.is_valid():

            type_document.statut = TypeDocument.Statut.ACTIF
            type_document.save(
                update_fields=["statut"]
            )

            return Response(
                {
                    "message": (
                        "Type de document restauré avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )