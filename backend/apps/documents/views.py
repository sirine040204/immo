from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import timedelta
from django.utils import timezone
from django.shortcuts import get_object_or_404
from rest_framework.parsers import JSONParser, MultiPartParser, FormParser
from django.http import FileResponse

from .models import Document, TypeDocument, TypeDocumentFamille

from ..accounts.permissions import HasPermission

from .serializers import (
    TypeDocumentSerializer,
    TypeDocumentArchiveSerializer,
    TypeDocumentRestoreSerializer,
    TypeDocumentFamilleSerializer,
    DocumentSerializer,
    DocumentExpirationSerializer,
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

#DOCUMENTS

#GET /api/v1/documents/
#POST /api/v1/documents/
class DocumentListCreateView(APIView):
    """
    GET:
        List all documents belonging to the authenticated user's enterprise.

    POST:
        Create a document for the authenticated user's enterprise.
    """

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser
    ]

    permission_classes = [HasPermission]

    required_permission = {
        "GET": "DOCUMENT_CONSULTER",
        "POST": "DOCUMENT_AJOUTER",
    }

    def get(self, request):
        """
        Return all documents of the authenticated user's enterprise.

        Optional filters:
        - type_document
        - immobilisation
        - statut
        """

        entreprise = request.user.entreprise

        queryset = (
            Document.objects
            .filter(entreprise=entreprise)
            .select_related(
                "entreprise",
                "immobilisation",
                "type_document",
                "ajoute_par"
            )
            .order_by("-date_ajout")
        )

        # Filter by type document
        type_document_id = request.query_params.get("type_document")

        if type_document_id:
            queryset = queryset.filter(
                type_document_id=type_document_id
            )

        # Filter by immobilisation
        immobilisation_id = request.query_params.get("immobilisation")

        if immobilisation_id:
            queryset = queryset.filter(
                immobilisation_id=immobilisation_id
            )

        # Filter by status
        statut = request.query_params.get("statut")

        if statut:
            queryset = queryset.filter(
                statut=statut
            )

        serializer = DocumentSerializer(
            queryset,
            many=True,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def post(self, request):
        """
        Create a document.

        The enterprise and creator are automatically taken
        from the authenticated user inside the serializer.
        """

        serializer = DocumentSerializer(
            data=request.data,
            context={
                "request": request
            }
        )

        if serializer.is_valid():
            document = serializer.save()

            return Response(
                DocumentSerializer(
                    document,
                    context={
                        "request": request
                    }
                ).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

#GET /api/v1/documents/<int:document_id>/
#PUT /api/v1/documents/<int:document_id>/
#PATCH /api/v1/documents/<int:document_id>/
#DELETE /api/v1/documents/<int:document_id>/
class DocumentDetailView(APIView):
    """
    GET:
        Retrieve one document.

    PUT:
        Completely update one document.

    PATCH:
        Partially update one document.

    DELETE:
        Permanently delete one document.
    """

    parser_classes = [
        JSONParser,
        MultiPartParser,
        FormParser
    ]

    permission_classes = [HasPermission]

    required_permission = {
        "GET": "DOCUMENT_CONSULTER",
        "PUT": "DOCUMENT_MODIFIER",
        "PATCH": "DOCUMENT_MODIFIER",
        "DELETE": "DOCUMENT_SUPPRIMER",
    }

    def get_document(self, request, document_id):
        """
        Retrieve a document only if it belongs to
        the authenticated user's enterprise.

        This prevents one enterprise from accessing
        another enterprise's documents.
        """

        return get_object_or_404(
            Document.objects.select_related(
                "entreprise",
                "immobilisation",
                "type_document",
                "ajoute_par"
            ),
            id=document_id,
            entreprise=request.user.entreprise
        )

    def get(self, request, document_id):
        document = self.get_document(
            request,
            document_id
        )

        serializer = DocumentSerializer(
            document,
            context={
                "request": request
            }
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK
        )

    def put(self, request, document_id):
        """
        Complete update.

        PUT requires all mandatory fields.
        """

        document = self.get_document(
            request,
            document_id
        )

        old_file_name = None

        if document.fichier:
            old_file_name = document.fichier.name

        serializer = DocumentSerializer(
            document,
            data=request.data,
            context={
                "request": request
            }
        )

        if serializer.is_valid():
            updated_document = serializer.save()

            self.delete_old_file_if_replaced(
                updated_document,
                old_file_name
            )

            return Response(
                DocumentSerializer(
                    updated_document,
                    context={
                        "request": request
                    }
                ).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, document_id):
        """
        Partial update.

        PATCH allows updating only some fields.
        """

        document = self.get_document(
            request,
            document_id
        )

        old_file_name = None

        if document.fichier:
            old_file_name = document.fichier.name

        serializer = DocumentSerializer(
            document,
            data=request.data,
            partial=True,
            context={
                "request": request
            }
        )

        if serializer.is_valid():
            updated_document = serializer.save()

            self.delete_old_file_if_replaced(
                updated_document,
                old_file_name
            )

            return Response(
                DocumentSerializer(
                    updated_document,
                    context={
                        "request": request
                    }
                ).data,
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, document_id):
        """
        Permanently delete a document.
        """

        document = self.get_document(
            request,
            document_id
        )

        file_name = None

        if document.fichier:
            file_name = document.fichier.name

        document.delete()

        if file_name:
            from django.core.files.storage import default_storage

            if default_storage.exists(file_name):
                default_storage.delete(file_name)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )

    @staticmethod
    def delete_old_file_if_replaced(
        document,
        old_file_name
    ):
        """
        Delete the old physical file only when
        a new file has replaced it.
        """

        if not old_file_name:
            return

        if not document.fichier:
            return

        new_file_name = document.fichier.name

        if old_file_name == new_file_name:
            return

        from django.core.files.storage import default_storage

        if default_storage.exists(old_file_name):
            default_storage.delete(old_file_name)

#POST /api/v1/documents/<int:document_id>/archive/
class DocumentArchiveView(APIView):
    """
    Archive an active document.

    The document is not deleted.
    Its status becomes ARCHIVE.
    """

    permission_classes = [HasPermission]

    required_permission = {
        "POST": "DOCUMENT_ARCHIVER",
    }

    def post(self, request, document_id):
        document = get_object_or_404(
            Document,
            id=document_id,
            entreprise=request.user.entreprise
        )

        if document.statut == Document.Statut.ARCHIVE:
            return Response(
                {
                    "message": "Ce document est déjà archivé."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        document.statut = Document.Statut.ARCHIVE
        document.save(
            update_fields=["statut"]
        )

        serializer = DocumentSerializer(
            document,
            context={
                "request": request
            }
        )

        return Response(
            {
                "message": "Document archivé avec succès.",
                "document": serializer.data
            },
            status=status.HTTP_200_OK
        )

#POST /api/v1/documents/<int:document_id>/restore/
class DocumentRestoreView(APIView):
    """
    Restore an archived document.

    Its status becomes ACTIF.
    """

    permission_classes = [HasPermission]

    required_permission = {
        "POST": "DOCUMENT_RESTAURER",
    }

    def post(self, request, document_id):
        document = get_object_or_404(
            Document,
            id=document_id,
            entreprise=request.user.entreprise
        )

        if document.statut == Document.Statut.ACTIF:
            return Response(
                {
                    "message": "Ce document est déjà actif."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        document.statut = Document.Statut.ACTIF
        document.save(
            update_fields=["statut"]
        )

        serializer = DocumentSerializer(
            document,
            context={
                "request": request
            }
        )

        return Response(
            {
                "message": "Document restauré avec succès.",
                "document": serializer.data
            },
            status=status.HTTP_200_OK
        )

#type document famille

# GET /api/v1/documents/types-familles/
# POST /api/v1/documents/types-familles/
class TypeDocumentFamilleListCreateView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_DOCUMENT_FAMILLE_CONSULTER",
        "POST": "TYPE_DOCUMENT_FAMILLE_AJOUTER",
    }

    def get(self, request):

        relations = TypeDocumentFamille.objects.filter(
            type_document__entreprise=request.user.entreprise,
            famille__entreprise=request.user.entreprise,
        ).select_related(
            "type_document",
            "famille",
        )

        serializer = TypeDocumentFamilleSerializer(
            relations,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = TypeDocumentFamilleSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():

            relation = serializer.save()

            return Response(
                TypeDocumentFamilleSerializer(
                    relation,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

# GET /api/v1/documents/types-familles/{id}/
# PUT /api/v1/documents/types-familles/{id}/
# PATCH /api/v1/documents/types-familles/{id}/
# DELETE /api/v1/documents/types-familles/{id}/
class TypeDocumentFamilleDetailView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "TYPE_DOCUMENT_FAMILLE_CONSULTER",
        "PUT": "TYPE_DOCUMENT_FAMILLE_MODIFIER",
        "PATCH": "TYPE_DOCUMENT_FAMILLE_MODIFIER",
        "DELETE": "TYPE_DOCUMENT_FAMILLE_SUPPRIMER",
    }

    def get_object(self, request, type_document_famille_id):

        try:
            return TypeDocumentFamille.objects.select_related(
                "type_document",
                "famille",
            ).get(
                id_type_document_famille=type_document_famille_id,
                type_document__entreprise=request.user.entreprise,
                famille__entreprise=request.user.entreprise,
            )

        except TypeDocumentFamille.DoesNotExist:
            return None

    def get(self, request, type_document_famille_id):

        relation = self.get_object(
            request,
            type_document_famille_id,
        )

        if not relation:
            return Response(
                {
                    "error": (
                        "Association type de document-famille "
                        "introuvable."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeDocumentFamilleSerializer(
            relation,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, type_document_famille_id):

        return self.update(
            request,
            type_document_famille_id,
            partial=False,
        )

    def patch(self, request, type_document_famille_id):

        return self.update(
            request,
            type_document_famille_id,
            partial=True,
        )

    def update(
        self,
        request,
        type_document_famille_id,
        partial=False,
    ):

        relation = self.get_object(
            request,
            type_document_famille_id,
        )

        if not relation:
            return Response(
                {
                    "error": (
                        "Association type de document-famille "
                        "introuvable."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = TypeDocumentFamilleSerializer(
            relation,
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

    def delete(self, request, type_document_famille_id):

        relation = self.get_object(
            request,
            type_document_famille_id,
        )

        if not relation:
            return Response(
                {
                    "error": (
                        "Association type de document-famille "
                        "introuvable."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        relation.delete()

        return Response(
            {
                "message": (
                    "Association type de document-famille "
                    "supprimée avec succès."
                )
            },
            status=status.HTTP_200_OK,
        )

# GET /api/v1/documents/<id>/download/
class DocumentDownloadView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "DOCUMENT_CONSULTER",
    }

    def get(self, request, id):

        entreprise = request.user.entreprise

        # ============================================================
        # 1. RÉCUPÉRER LE DOCUMENT DE L'ENTREPRISE
        # ============================================================

        try:
            document = (
                Document.objects
                .filter(
                    id=id,
                    entreprise=entreprise,
                    statut=Document.Statut.ACTIF,
                )
                .first()
            )

        except Exception:

            return Response(
                {
                    "detail": "Erreur lors de la récupération du document."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if document is None:

            return Response(
                {
                    "detail": (
                        "Document introuvable, archivé ou "
                        "non autorisé."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ============================================================
        # 2. VÉRIFIER QUE LE FICHIER EXISTE
        # ============================================================

        if not document.fichier:

            return Response(
                {
                    "detail": (
                        "Aucun fichier n'est associé à ce document."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not document.fichier.storage.exists(
            document.fichier.name
        ):

            return Response(
                {
                    "detail": (
                        "Le fichier associé à ce document "
                        "n'existe pas sur le serveur."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # ============================================================
        # 3. RETOURNER LE FICHIER
        # ============================================================

        response = FileResponse(
            document.fichier.open("rb"),
            as_attachment=False,
            filename=document.fichier.name.split("/")[-1],
        )

        return response
# GET /api/v1/documents/expiration/
class DocumentExpirationView(APIView):

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "DOCUMENT_CONSULTER",
    }

    def get(self, request):

        entreprise = request.user.entreprise

        today = timezone.localdate()

        date_limite = today + timedelta(days=30)

        # ============================================================
        # 1. RÉCUPÉRER LES DOCUMENTS ACTIFS DE L'ENTREPRISE
        # ============================================================

        documents = (
            Document.objects
            .filter(
                entreprise=entreprise,
                statut=Document.Statut.ACTIF,
            )
            .select_related("type_document")
            .order_by("date_fin_validite")
        )

        expired = []
        expires_soon = []
        valid = []
        sans_echeance = []

        # ============================================================
        # 2. CLASSER LES DOCUMENTS
        # ============================================================

        for document in documents:

            date_fin = document.date_fin_validite

            # --------------------------------------------------------
            # SANS ÉCHÉANCE
            # --------------------------------------------------------

            if date_fin is None:

                data = {
                    "id": document.id,
                    "nom": document.nom,
                    "type_document": (
                        document.type_document.id_type_document
                    ),
                    "date_fin_validite": None,
                    "statut_validite": "SANS_ECHEANCE",
                    "jours_restants": None,
                }

                sans_echeance.append(data)

                continue

            jours_restants = (date_fin - today).days

            data = {
                "id": document.id,
                "nom": document.nom,
                "type_document": (
                    document.type_document.id_type_document
                ),
                "date_fin_validite": date_fin,
                "statut_validite": None,
                "jours_restants": jours_restants,
            }

            # --------------------------------------------------------
            # EXPIRÉ
            # --------------------------------------------------------

            if date_fin < today:

                data["statut_validite"] = "EXPIRE"

                expired.append(data)

            # --------------------------------------------------------
            # EXPIRATION AUJOURD'HUI
            # --------------------------------------------------------

            elif date_fin == today:

                data["statut_validite"] = "EXPIRE"

                expired.append(data)

            # --------------------------------------------------------
            # EXPIRATION DANS LES 30 JOURS
            # --------------------------------------------------------

            elif date_fin <= date_limite:

                data["statut_validite"] = "BIENTOT_EXPIRE"

                expires_soon.append(data)

            # --------------------------------------------------------
            # DOCUMENT VALIDE
            # --------------------------------------------------------

            else:

                data["statut_validite"] = "VALIDE"

                valid.append(data)

        # ============================================================
        # 3. SERIALIZER LES RÉSULTATS
        # ============================================================

        return Response(
            {
                "date_verification": today,

                "expired": DocumentExpirationSerializer(
                    expired,
                    many=True,
                ).data,

                "expires_soon": DocumentExpirationSerializer(
                    expires_soon,
                    many=True,
                ).data,

                "valid": DocumentExpirationSerializer(
                    valid,
                    many=True,
                ).data,

                "sans_echeance": DocumentExpirationSerializer(
                    sans_echeance,
                    many=True,
                ).data,

                "nombre_expired": len(expired),

                "nombre_expires_soon": len(expires_soon),

                "nombre_valid": len(valid),

                "nombre_sans_echeance": len(sans_echeance),

                "nombre_total": documents.count(),
            },
            status=status.HTTP_200_OK,
        )