from django.http import request
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.db.models import ProtectedError
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics, serializers
from rest_framework.exceptions import ValidationError
from ..accounts.permissions import HasPermission
from django.db import transaction
from .services import generer_suivis_depuis_modele
from ..notifications.models import Notification
from django.db.models import F, Avg, DurationField, ExpressionWrapper
from ..immobilisations.models import Immobilisation
from ..notifications.services.notification_service import (
    create_notification,
    create_single_notification,
)

from ..notifications.services.recipient_service import (
    get_recipients_for_intervention,
    get_creator_for_intervention,
)

from .models import (TypeEntretien,
    ModeleEntretien,
    EtapeEntretien,
    Intervention,
    SuiviEtapeIntervention,
    RapportIntervention,
    )
from .serializers import (TypeEntretienSerializer,
    ModeleEntretienSerializer, 
    EtapeEntretienSerializer,
    InterventionSerializer,
    InterventionStatutSerializer,
    SuiviEtapeInterventionSerializer,
    RapportInterventionSerializer,
    )

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

        if EtapeEntretien.objects.filter(
            modele_entretien=etape.modele_entretien,
            ordre=etape.ordre,
            statut=EtapeEntretien.Statut.ACTIF
        ).exists():
            return Response(
                {"detail": "Impossible de restaurer cette étape car une étape active avec le même ordre existe déjà pour ce modèle."},
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

#Intervention
#GET   /api/v1/maintenance/interventions/
#POST  /api/v1/maintenance/interventions/
class InterventionListCreateView(generics.ListCreateAPIView):
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "INTERVENTION_CONSULTER",
        "POST": "INTERVENTION_AJOUTER",
    }

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return Intervention.objects.none()

        return (
            Intervention.objects
            .filter(entreprise=user.entreprise)
            .select_related(
                "entreprise",
                "immobilisation",
                "modele_entretien",
                "type_entretien",
                "demande_par",
            )
        )
    def perform_create(self, serializer):
        intervention = serializer.save()

        recipients = get_recipients_for_intervention(intervention)

        create_notification(
            entreprise=intervention.entreprise,
            destinataires=recipients,
            type_notification=Notification.Type.MAINTENANCE,
            niveau=Notification.Niveau.INFO,
            titre="Nouvelle intervention créée",
            message=(
                f"Une nouvelle intervention concernant "
                f"l'immobilisation #{intervention.immobilisation_id} "
                f"a été créée par {intervention.demande_par}."
            ),
            cle_unique=f"intervention-{intervention.id}-creation",
            intervention=intervention,
            immobilisation=intervention.immobilisation,
        )

# GET   /api/v1/maintenance/interventions/{id}/
# PATCH /api/v1/maintenance/interventions/{id}/
# DELETE /api/v1/maintenance/interventions/{id}/
class InterventionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = InterventionSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "INTERVENTION_CONSULTER",
        "PATCH": "INTERVENTION_MODIFIER",
        "DELETE": "INTERVENTION_SUPPRIMER",
    }

    # We deliberately expose PATCH, not PUT.
    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return Intervention.objects.none()

        return (
            Intervention.objects
            .filter(entreprise=user.entreprise)
            .select_related(
                "entreprise",
                "immobilisation",
                "modele_entretien",
                "type_entretien",
                "demande_par",
            )
        )

    def perform_destroy(self, instance):
        """
        Une intervention peut être supprimée uniquement si :
        - elle est encore BROUILLON ;
        - elle ne possède aucun suivi d'étape.
        """

        if instance.statut != Intervention.Statut.BROUILLON:
            raise ValidationError({
                "detail": (
                    "Seules les interventions au statut BROUILLON "
                    "peuvent être supprimées."
                )
            })

        if instance.suivis_etapes.exists():
            raise ValidationError({
                "detail": (
                    "Cette intervention ne peut pas être supprimée "
                    "car elle possède un historique de suivi."
                )
            })

        instance.delete()

#PATCH /api/v1/maintenance/interventions/{id}/statut/
class InterventionStatutView(generics.GenericAPIView):
    serializer_class = InterventionStatutSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "PATCH": "INTERVENTION_MODIFIER",
    }

    http_method_names = ["patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return Intervention.objects.none()

        return (
            Intervention.objects
            .filter(entreprise=user.entreprise)
        )

    @transaction.atomic
    def patch(self, request, *args, **kwargs):
        intervention = self.get_object()

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request,
                "intervention": intervention,
            },
        )

        serializer.is_valid(raise_exception=True)

        nouveau_statut = serializer.validated_data["statut"]
        ancien_statut = intervention.statut

        today = timezone.localdate()

        intervention.statut = nouveau_statut

        if nouveau_statut == Intervention.Statut.EN_COURS:
            intervention.date_debut = today

        elif nouveau_statut == Intervention.Statut.TERMINEE:
            intervention.date_fin = today

        intervention.save(
            update_fields=[
                "statut",
                "date_debut",
                "date_fin",
            ]
        )
                # Create a notification only when the status really changes.
        if ancien_statut != nouveau_statut:

            destinataire = get_creator_for_intervention(intervention)

            titres = {
                Intervention.Statut.PLANIFIEE:
                    "Intervention planifiée",

                Intervention.Statut.EN_COURS:
                    "Intervention commencée",

                Intervention.Statut.TERMINEE:
                    "Intervention terminée",

                Intervention.Statut.ANNULEE:
                    "Intervention annulée",
            }

            messages = {
                Intervention.Statut.PLANIFIEE:
                    (
                        f"Votre intervention #{intervention.id} "
                        "a été planifiée."
                    ),

                Intervention.Statut.EN_COURS:
                    (
                        f"Votre intervention #{intervention.id} "
                        "est maintenant en cours."
                    ),

                Intervention.Statut.TERMINEE:
                    (
                        f"Votre intervention #{intervention.id} "
                        "est terminée."
                    ),

                Intervention.Statut.ANNULEE:
                    (
                        f"Votre intervention #{intervention.id} "
                        "a été annulée."
                    ),
            }

            niveaux = {
                Intervention.Statut.PLANIFIEE:
                    Notification.Niveau.INFO,

                Intervention.Statut.EN_COURS:
                    Notification.Niveau.INFO,

                Intervention.Statut.TERMINEE:
                    Notification.Niveau.INFO,

                Intervention.Statut.ANNULEE:
                    Notification.Niveau.WARNING,
            }

            create_single_notification(
                entreprise=intervention.entreprise,
                destinataire=destinataire,
                type_notification=Notification.Type.MAINTENANCE,
                niveau=niveaux[nouveau_statut],
                titre=titres[nouveau_statut],
                message=messages[nouveau_statut],
                cle_unique=(
                    f"intervention-{intervention.id}-"
                    f"statut-{nouveau_statut.lower()}"
                ),
                intervention=intervention,
                immobilisation=intervention.immobilisation,
            )

        # Generate model-based steps only when planning for the first time
        if (
            ancien_statut == Intervention.Statut.BROUILLON
            and nouveau_statut == Intervention.Statut.PLANIFIEE
            and intervention.modele_entretien_id is not None
        ):
            generer_suivis_depuis_modele(intervention)

        return Response(
            InterventionSerializer(
                intervention,
                context={"request": request},
            ).data
        )

# SuiviEtapeIntervention
# GET  /api/v1/maintenance/suivis-etapes/
# POST /api/v1/maintenance/suivis-etapes/
class SuiviEtapeInterventionListCreateView(generics.ListCreateAPIView):
    serializer_class = SuiviEtapeInterventionSerializer
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "SUIVI_ETAPE_INTERVENTION_CONSULTER",
        "POST": "SUIVI_ETAPE_INTERVENTION_AJOUTER",
    }

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return SuiviEtapeIntervention.objects.none()

        queryset = (
            SuiviEtapeIntervention.objects
            .filter(
                intervention__entreprise=user.entreprise
            )
            .select_related(
                "intervention",
                "etape_entretien",
                "validee_par",
            )
        )

        intervention_id = self.request.query_params.get("intervention")

        if intervention_id:
            queryset = queryset.filter(
                intervention_id=intervention_id
            )

        return queryset
# GET    /api/v1/maintenance/suivis-etapes/{id}/
# PATCH  /api/v1/maintenance/suivis-etapes/{id}/
# DELETE /api/v1/maintenance/suivis-etapes/{id}/
class SuiviEtapeInterventionDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = SuiviEtapeInterventionSerializer
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "SUIVI_ETAPE_INTERVENTION_CONSULTER",
        "PATCH": "SUIVI_ETAPE_INTERVENTION_MODIFIER",
        "DELETE": "SUIVI_ETAPE_INTERVENTION_SUPPRIMER",
    }

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return SuiviEtapeIntervention.objects.none()

        return (
            SuiviEtapeIntervention.objects
            .filter(
                intervention__entreprise=user.entreprise
            )
            .select_related(
                "intervention",
                "etape_entretien",
                "validee_par",
            )
        )
# RapportIntervention
# GET  /api/v1/maintenance/rapports-interventions/
# POST /api/v1/maintenance/rapports-interventions/

class RapportInterventionListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = RapportInterventionSerializer
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "RAPPORT_INTERVENTION_CONSULTER",
        "POST": "RAPPORT_INTERVENTION_CREER",
    }

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return RapportIntervention.objects.none()

        return (
            RapportIntervention.objects
            .filter(
                intervention__entreprise=user.entreprise
            )
            .select_related(
                "intervention",
                "intervention__immobilisation",
                "intervention__type_entretien",
                "intervention__modele_entretien",
                "redige_par",
            )
        )

# GET    /api/v1/maintenance/rapports-interventions/{id}/
# PATCH  /api/v1/maintenance/rapports-interventions/{id}/
# DELETE /api/v1/maintenance/rapports-interventions/{id}/

class RapportInterventionDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = RapportInterventionSerializer
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "RAPPORT_INTERVENTION_CONSULTER",
        "PATCH": "RAPPORT_INTERVENTION_MODIFIER",
        "DELETE": "RAPPORT_INTERVENTION_SUPPRIMER",
    }

    http_method_names = [
        "get",
        "patch",
        "delete",
        "head",
        "options",
    ]

    def get_queryset(self):
        user = self.request.user

        if not user.entreprise:
            return RapportIntervention.objects.none()

        return (
            RapportIntervention.objects
            .filter(
                intervention__entreprise=user.entreprise
            )
            .select_related(
                "intervention",
                "intervention__immobilisation",
                "intervention__type_entretien",
                "intervention__modele_entretien",
                "redige_par",
            )
        )

    def perform_destroy(self, instance):
        user = self.request.user

        if not user.is_company_admin:
            raise ValidationError({
                "detail": (
                    "Seul un administrateur de l'entreprise "
                    "peut supprimer un rapport d'intervention."
                )
            })

        instance.delete()

# POST /api/v1/maintenance/ai-chat/
from rest_framework.views import APIView

class AiChatbotView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_message = request.data.get("message", "")
        if not user_message:
            return Response({"error": "Message est requis"}, status=status.HTTP_400_BAD_REQUEST)
            
        import os
        from openai import OpenAI
        from ..immobilisations.models import Immobilisation
        
        api_key = os.getenv("OPENAI_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")
        
        if not api_key and not groq_key:
            # Fallback mock logic for demo
            lower_msg = user_message.lower()
            hs_count = Immobilisation.objects.filter(statut="HORS_SERVICE", entreprise=request.user.entreprise).count()
            active_count = Immobilisation.objects.filter(statut="ACTIVE", entreprise=request.user.entreprise).count()
            from .models import Intervention
            interventions_count = Intervention.objects.filter(entreprise=request.user.entreprise, type_entretien__code__iexact='CORRECTIF').count()

            if "résumé" in lower_msg or "état" in lower_msg or "parc" in lower_msg:
                return Response({"reply": f"Voici un résumé de l'état actuel de votre parc : vous disposez actuellement de {active_count} immobilisation(s) active(s) et de {hs_count} immobilisation(s) hors service. Par ailleurs, nous avons enregistré un total de {interventions_count} intervention(s) corrective(s) (pannes)." })
            elif "hors service" in lower_msg:
                return Response({"reply": f"Vous avez actuellement {hs_count} immobilisation(s) hors service dans votre entreprise."})
            elif "active" in lower_msg:
                return Response({"reply": f"Vous avez {active_count} immobilisation(s) active(s) en ce moment."})
            elif "intervention" in lower_msg or "panne" in lower_msg:
                return Response({"reply": f"Il y a actuellement {interventions_count} intervention(s) corrective(s) ou pannes enregistrées. Souhaitez-vous les consulter en détail ?"})
            else:
                return Response({"reply": "Je suis votre assistant IA (Mode Démo). Je peux vous faire un résumé de l'état de votre parc, ou vous donner le nombre d'immobilisations actives, hors service, ou en panne !"})
        try:
            # If GROQ_API_KEY is present, use it with OpenAI SDK
            if groq_key:
                client = OpenAI(
                    api_key=groq_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                model_name = "openai/gpt-oss-120b"
            else:
                client = OpenAI(api_key=api_key)
                model_name = "gpt-3.5-turbo"
            
            # Enriched implementation for AI context
            hs_count = Immobilisation.objects.filter(statut="HORS_SERVICE", entreprise=request.user.entreprise).count()
            active_count = Immobilisation.objects.filter(statut="ACTIVE", entreprise=request.user.entreprise).count()
            from .models import Intervention
            interventions_count = Intervention.objects.filter(entreprise=request.user.entreprise, type_entretien__code__iexact='CORRECTIF').count()
            
            system_prompt = (
                f"Vous êtes l'assistant virtuel intelligent de gestion de maintenance (GMAO). "
                f"Voici les statistiques actuelles en temps réel de l'entreprise : "
                f"1) {hs_count} machine(s)/véhicule(s) actuellement hors service. "
                f"2) {active_count} machine(s)/véhicule(s) actuellement actifs. "
                f"3) {interventions_count} intervention(s) corrective(s) répertoriée(s) en base. "
                f"Répondez avec ces informations aux questions de l'utilisateur de manière naturelle, serviable et toujours en français."
            )
            
            response = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                max_tokens=250
            )
            reply = response.choices[0].message.content
            return Response({"reply": reply})
        except Exception as e:
            error_msg = str(e)
            if "Incorrect API key" in error_msg or "AuthenticationError" in error_msg or "401" in error_msg:
                return Response({"reply": "Erreur : La clé configurée dans le backend semble invalide. Veuillez vérifier votre clé API."})
            
            if "insufficient_quota" in error_msg or "429" in error_msg or "credit_balance_exhausted" in error_msg:
                return Response({"reply": "Erreur : Votre compte API n'a plus de crédits disponibles. Veuillez recharger votre compte."})
                
            if "model_not_found" in error_msg or "does not exist" in error_msg or "404" in error_msg:
                return Response({"reply": "Erreur : Le modèle d'IA sélectionné est introuvable ou indisponible. Veuillez contacter l'administrateur."})
            
            print("OPENAI EXCEPTION:", e)
            import traceback
            traceback.print_exc()
            return Response({"error": error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaintenanceKPIsView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        entreprise = request.user.entreprise
        
        # --- MTTR (Mean Time To Repair) ---
        corrective_interventions = Intervention.objects.filter(
            entreprise=entreprise,
            type_entretien__code__iexact="CORRECTIF",
            statut=Intervention.Statut.TERMINEE,
            date_debut__isnull=False,
            date_fin__isnull=False
        )
        
        # Calculate the average duration between date_debut and date_fin
        mttr_query = corrective_interventions.annotate(
            duration=ExpressionWrapper(F('date_fin') - F('date_debut'), output_field=DurationField())
        ).aggregate(avg_duration=Avg('duration'))
        
        avg_duration = mttr_query['avg_duration']
        if avg_duration:
            # avg_duration is a timedelta object. Extract hours.
            mttr_hours = avg_duration.total_seconds() / 3600
        else:
            mttr_hours = 0
            
        # --- MTBF (Mean Time Between Failures) ---
        # Total uptime in days = Sum(today - start_date) for all active assets
        active_assets = Immobilisation.objects.filter(
            entreprise=entreprise,
            statut=Immobilisation.Statut.ACTIVE,
            date_acquisition__isnull=False
        )
        
        today = timezone.now().date()
        total_uptime_days = 0
        for asset in active_assets:
            start_date = asset.date_mise_en_service or asset.date_acquisition
            if start_date and start_date <= today:
                total_uptime_days += (today - start_date).days
                
        # Total failures
        total_failures = Intervention.objects.filter(
            entreprise=entreprise,
            type_entretien__code__iexact="CORRECTIF"
        ).count()
        
        if total_failures > 0:
            mtbf_days = total_uptime_days / total_failures
        else:
            # If no failures, mtbf is basically the average uptime
            if active_assets.count() > 0:
                mtbf_days = total_uptime_days / active_assets.count()
            else:
                mtbf_days = 0
                
        return Response({
            "mttr_hours": round(mttr_hours, 1),
            "mtbf_days": round(mtbf_days, 1),
            "mttr_trend": -12,  # Mock trend for now
            "mtbf_trend": 5     # Mock trend for now
        })