from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone

from django.shortcuts import get_object_or_404

from .models import CoutImmobilisation
from .serializers import CoutImmobilisationSerializer

from ..accounts.permissions import (
    HasPermission,
    user_has_permission,
)


# ============================================================
# COUTS D'IMMOBILISATION
# ============================================================


# GET /api/v1/costs/
# POST /api/v1/costs/
class CoutImmobilisationListCreateView(APIView):
    """
    GET:
        Liste les coûts appartenant aux immobilisations
        de l'entreprise de l'utilisateur connecté.

    POST:
        Crée un coût pour une immobilisation
        appartenant à l'entreprise de l'utilisateur connecté.
    """

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "COUT_IMMOBILISATION_CONSULTER",
        "POST": "COUT_IMMOBILISATION_AJOUTER",
    }

    def get(self, request):

        entreprise = request.user.entreprise

        queryset = (
            CoutImmobilisation.objects
            .filter(
                immobilisation__entreprise=entreprise
            )
            .select_related(
                "immobilisation",
                "document",
                "cree_par",
                "modifie_par",
                "valide_par",
            )
            .order_by(
                "-date_creation",
                "-id_cout",
            )
        )

        # --------------------------------------------------------
        # Filtre par immobilisation
        # --------------------------------------------------------

        immobilisation_id = request.query_params.get(
            "immobilisation"
        )

        if immobilisation_id:
            queryset = queryset.filter(
                immobilisation_id=immobilisation_id
            )

        # --------------------------------------------------------
        # Filtre par type de coût
        # --------------------------------------------------------

        type_cout = request.query_params.get(
            "type_cout"
        )

        if type_cout:
            queryset = queryset.filter(
                type_cout=type_cout
            )

        # --------------------------------------------------------
        # Filtre par statut
        # --------------------------------------------------------

        statut = request.query_params.get(
            "statut"
        )

        if statut:
            queryset = queryset.filter(
                statut=statut
            )

        serializer = CoutImmobilisationSerializer(
            queryset,
            many=True,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = CoutImmobilisationSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        if serializer.is_valid():

            cout = serializer.save()

            return Response(
                CoutImmobilisationSerializer(
                    cout,
                    context={
                        "request": request,
                    },
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# ============================================================
# DETAIL D'UN COÛT
# ============================================================


# GET /api/v1/costs/<int:id_cout>/
# PUT /api/v1/costs/<int:id_cout>/
# PATCH /api/v1/costs/<int:id_cout>/
# DELETE /api/v1/costs/<int:id_cout>/
class CoutImmobilisationDetailView(APIView):
    """
    GET:
        Récupère un coût.

    PUT:
        Modifie complètement un coût.

    PATCH:
        Modifie partiellement un coût.

    DELETE:
        Supprime un coût.

        - Permission normale :
          uniquement si le coût est en BROUILLON.

        - Permission force :
          quel que soit le statut du coût.
    """

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "COUT_IMMOBILISATION_CONSULTER",
        "PUT": "COUT_IMMOBILISATION_MODIFIER",
        "PATCH": "COUT_IMMOBILISATION_MODIFIER",
        "DELETE": [
            "COUT_IMMOBILISATION_SUPPRIMER",
            "COUT_IMMOBILISATION_SUPPRIMER_FORCE",
        ],
    }

    def get_cout(self, request, id_cout):
        """
        Récupère un coût uniquement si l'immobilisation
        appartient à l'entreprise de l'utilisateur connecté.
        """

        return get_object_or_404(
            CoutImmobilisation.objects.select_related(
                "immobilisation",
                "document",
                "cree_par",
                "modifie_par",
                "valide_par",
            ),
            id_cout=id_cout,
            immobilisation__entreprise=request.user.entreprise,
        )

    def get(self, request, id_cout):

        cout = self.get_cout(
            request,
            id_cout,
        )

        serializer = CoutImmobilisationSerializer(
            cout,
            context={
                "request": request,
            },
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def put(self, request, id_cout):

        cout = self.get_cout(
            request,
            id_cout,
        )

        serializer = CoutImmobilisationSerializer(
            cout,
            data=request.data,
            partial=False,
            context={
                "request": request,
            },
        )

        if serializer.is_valid():

            updated_cout = serializer.save()

            return Response(
                CoutImmobilisationSerializer(
                    updated_cout,
                    context={
                        "request": request,
                    },
                ).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, id_cout):

        cout = self.get_cout(
            request,
            id_cout,
        )

        serializer = CoutImmobilisationSerializer(
            cout,
            data=request.data,
            partial=True,
            context={
                "request": request,
            },
        )

        if serializer.is_valid():

            updated_cout = serializer.save()

            return Response(
                CoutImmobilisationSerializer(
                    updated_cout,
                    context={
                        "request": request,
                    },
                ).data,
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, id_cout):

        cout = self.get_cout(
            request,
            id_cout,
        )

        user = request.user

        has_normal_delete_permission = user_has_permission(
            user,
            "COUT_IMMOBILISATION_SUPPRIMER",
        )

        has_force_delete_permission = user_has_permission(
            user,
            "COUT_IMMOBILISATION_SUPPRIMER_FORCE",
        )

        # --------------------------------------------------------
        # Cas 1 : permission force
        # --------------------------------------------------------

        if has_force_delete_permission:

            cout.delete()

            return Response(
                {
                    "message": (
                        "Coût d'immobilisation supprimé "
                        "avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------------
        # Cas 2 : permission normale + coût en brouillon
        # --------------------------------------------------------

        if (
            has_normal_delete_permission
            and cout.statut
            == CoutImmobilisation.Statut.BROUILLON
        ):

            cout.delete()

            return Response(
                {
                    "message": (
                        "Coût d'immobilisation supprimé "
                        "avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        # --------------------------------------------------------
        # Cas 3 : permission normale mais mauvais statut
        # --------------------------------------------------------

        if (
            has_normal_delete_permission
            and cout.statut
            != CoutImmobilisation.Statut.BROUILLON
        ):

            return Response(
                {
                    "detail": (
                        "Seul un coût en brouillon peut "
                        "être supprimé avec cette permission. "
                        "Une permission de suppression forcée "
                        "est nécessaire pour ce statut."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # --------------------------------------------------------
        # Cas 4 : aucune permission de suppression
        # --------------------------------------------------------

        return Response(
            {
                "detail": (
                    "Vous ne possédez pas la permission "
                    "nécessaire pour supprimer ce coût."
                )
            },
            status=status.HTTP_403_FORBIDDEN,
        )

# ============================================================
# WORKFLOW D'UN COÛT
# ============================================================


# POST /api/v1/costs/<int:id_cout>/submit/
# POST /api/v1/costs/<int:id_cout>/validate/
# POST /api/v1/costs/<int:id_cout>/reject/
class CoutImmobilisationWorkflowView(APIView):
    """
    Gère le workflow de validation d'un coût.

    submit:
        BROUILLON -> EN_ATTENTE_VALIDATION

    validate:
        EN_ATTENTE_VALIDATION -> VALIDE

    reject:
        EN_ATTENTE_VALIDATION -> REJETE
    """

    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "POST": [
            "COUT_IMMOBILISATION_SOUMETTRE",
            "COUT_IMMOBILISATION_VALIDER",
            "COUT_IMMOBILISATION_REJETER",
        ],
    }

    def get_cout(self, request, id_cout):
        return get_object_or_404(
            CoutImmobilisation.objects.select_related(
                "immobilisation",
                "document",
                "cree_par",
                "modifie_par",
                "valide_par",
            ),
            id_cout=id_cout,
            immobilisation__entreprise=request.user.entreprise,
        )

    def post(self, request, id_cout, action):

        cout = self.get_cout(
            request,
            id_cout,
        )

        user = request.user

        # ========================================================
        # SOUMETTRE
        # BROUILLON -> EN_ATTENTE_VALIDATION
        # ========================================================

        if action == "submit":

            if not user_has_permission(
                user,
                "COUT_IMMOBILISATION_SOUMETTRE",
            ):
                return Response(
                    {
                        "detail": (
                            "Vous ne possédez pas la permission "
                            "nécessaire pour soumettre ce coût."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if cout.statut != CoutImmobilisation.Statut.BROUILLON:
                return Response(
                    {
                        "detail": (
                            "Seul un coût en brouillon peut "
                            "être soumis à validation."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cout.statut = (
                CoutImmobilisation.Statut.EN_ATTENTE_VALIDATION
            )
            cout.modifie_par = user
            cout.date_modification = timezone.now()

            cout.save(
                update_fields=[
                    "statut",
                    "modifie_par",
                    "date_modification",
                ]
            )

            return Response(
                {
                    "message": (
                        "Coût soumis à validation avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        # ========================================================
        # VALIDER
        # EN_ATTENTE_VALIDATION -> VALIDE
        # ========================================================

        if action == "validate":

            if not user_has_permission(
                user,
                "COUT_IMMOBILISATION_VALIDER",
            ):
                return Response(
                    {
                        "detail": (
                            "Vous ne possédez pas la permission "
                            "nécessaire pour valider ce coût."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                cout.statut
                != CoutImmobilisation.Statut.EN_ATTENTE_VALIDATION
            ):
                return Response(
                    {
                        "detail": (
                            "Seul un coût en attente de validation "
                            "peut être validé."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cout.statut = CoutImmobilisation.Statut.VALIDE
            cout.valide_par = user
            cout.date_validation = timezone.now()
            cout.modifie_par = user
            cout.date_modification = timezone.now()
            cout.motif_rejet = None

            cout.save(
                update_fields=[
                    "statut",
                    "valide_par",
                    "date_validation",
                    "modifie_par",
                    "date_modification",
                    "motif_rejet",
                ]
            )

            return Response(
                {
                    "message": (
                        "Coût validé avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        # ========================================================
        # REJETER
        # EN_ATTENTE_VALIDATION -> REJETE
        # ========================================================

        if action == "reject":

            if not user_has_permission(
                user,
                "COUT_IMMOBILISATION_REJETER",
            ):
                return Response(
                    {
                        "detail": (
                            "Vous ne possédez pas la permission "
                            "nécessaire pour rejeter ce coût."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

            if (
                cout.statut
                != CoutImmobilisation.Statut.EN_ATTENTE_VALIDATION
            ):
                return Response(
                    {
                        "detail": (
                            "Seul un coût en attente de validation "
                            "peut être rejeté."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            motif_rejet = request.data.get("motif_rejet")

            if not motif_rejet:
                return Response(
                    {
                        "motif_rejet": (
                            "Le motif du rejet est obligatoire."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            cout.statut = CoutImmobilisation.Statut.REJETE
            cout.motif_rejet = motif_rejet
            cout.valide_par = None
            cout.date_validation = None
            cout.modifie_par = user
            cout.date_modification = timezone.now()

            cout.save(
                update_fields=[
                    "statut",
                    "motif_rejet",
                    "valide_par",
                    "date_validation",
                    "modifie_par",
                    "date_modification",
                ]
            )

            return Response(
                {
                    "message": (
                        "Coût rejeté avec succès."
                    )
                },
                status=status.HTTP_200_OK,
            )

        # ========================================================
        # ACTION INCONNUE
        # ========================================================

        return Response(
            {
                "detail": "Action de workflow inconnue."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )