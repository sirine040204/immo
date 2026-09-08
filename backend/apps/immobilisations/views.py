from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from ..accounts.permissions import HasPermission
from .models import (
    Famille,
    AttributDynamique,
    OptionAttribut,
    Immobilisation,
    ValeurAttribut,
    ReleveUsage,
)
from .serializers import (
    FamilleSerializer,
    FamilleArchiveSerializer,
    FamilleRestoreSerializer,
    AttributDynamiqueSerializer,
    OptionAttributSerializer,
    ImmobilisationSerializer,
    ValeurAttributSerializer,
    ReleveUsageSerializer,
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

#options pour l'attribut dynamique de type liste

#GET /api/v1/immobilisations/attributs/<attribut_id>/options/
#POST /api/v1/immobilisations/attributs/<attribut_id>/options/
class OptionAttributListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "OPTION_CONSULTER",
        "POST": "OPTION_AJOUTER",
    }

    def get_attribut(self, request, attribut_id):
        try:
            return AttributDynamique.objects.get(
                id_attribut=attribut_id,
                famille__entreprise=request.user.entreprise,
            )
        except AttributDynamique.DoesNotExist:
            return None

    def get(self, request, attribut_id):
        attribut = self.get_attribut(request, attribut_id)

        if attribut is None:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        options = OptionAttribut.objects.filter(
            attribut=attribut
        )

        serializer = OptionAttributSerializer(
            options,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request, attribut_id):
        attribut = self.get_attribut(request, attribut_id)

        if attribut is None:
            return Response(
                {"detail": "Attribut dynamique introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if attribut.statut == AttributDynamique.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Impossible d'ajouter une option "
                        "à un attribut archivé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OptionAttributSerializer(
            data=request.data,
            context={
                "request": request,
                "attribut": attribut,
            },
        )

        if serializer.is_valid():
            option = serializer.save(
                attribut=attribut
            )

            return Response(
                OptionAttributSerializer(
                    option,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
#détail d'une option d'attribut dynamique
#GET /api/v1/immobilisations/attributs/<attribut_id>/options/<option_id>/
#PATCH /api/v1/immobilisations/attributs/<attribut_id>/options/<option_id>/
#DELETE /api/v1/immobilisations/attributs/<attribut_id>/options/<option_id>/
class OptionAttributDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "OPTION_CONSULTER",
        "PATCH": "OPTION_MODIFIER",
        "DELETE": "OPTION_SUPPRIMER",
    }

    def get_object(self, request, attribut_id, option_id):
        try:
            return OptionAttribut.objects.get(
                id=option_id,
                attribut_id=attribut_id,
                attribut__famille__entreprise=request.user.entreprise,
            )
        except OptionAttribut.DoesNotExist:
            return None

    def get(self, request, attribut_id, option_id):
        option = self.get_object(request, attribut_id, option_id)

        if option is None:
            return Response(
                {"detail": "Option introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = OptionAttributSerializer(
            option,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, attribut_id, option_id):
        option = self.get_object(request, attribut_id, option_id)

        if option is None:
            return Response(
                {"detail": "Option introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if option.statut == OptionAttribut.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Impossible de modifier "
                        "une option archivée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if option.attribut.statut == AttributDynamique.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Impossible de modifier une option "
                        "dont l'attribut est archivé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OptionAttributSerializer(
            option,
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

    def delete(self, request, attribut_id, option_id):
        option = self.get_object(request, attribut_id, option_id)

        if option is None:
            return Response(
                {"detail": "Option introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if option.statut == OptionAttribut.Statut.ACTIVE:
            return Response(
                {
                    "detail": (
                        "Une option active doit être archivée "
                        "avant de pouvoir être supprimée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        option.delete()

        return Response(
            {
                "detail": "Option supprimée avec succès.",
            },
            status=status.HTTP_204_NO_CONTENT,
        )
#archive une option d'attribut dynamique
#POST /api/v1/immobilisations/attributs/<attribut_id>/options/<option_id>/archive/
class ArchiverOptionAttributView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "POST": "OPTION_ARCHIVER",
    }

    def post(self, request, attribut_id, option_id):
        try:
            option = OptionAttribut.objects.get(
                id=option_id,
                attribut_id=attribut_id,
                attribut__famille__entreprise=request.user.entreprise,
            )
        except OptionAttribut.DoesNotExist:
            return Response(
                {"detail": "Option introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if option.statut == OptionAttribut.Statut.ARCHIVEE:
            return Response(
                {"detail": "Cette option est déjà archivée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        option.statut = OptionAttribut.Statut.ARCHIVEE
        option.save(update_fields=["statut"])

        return Response(
            {"detail": "Option archivée avec succès."},
            status=status.HTTP_200_OK,
        )
#restaurer une option d'attribut dynamique
#POST /api/v1/immobilisations/attributs/<attribut_id>/options/<option_id>/restore/
class RestaurerOptionAttributView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "POST": "OPTION_RESTAURER",
    }

    def post(self, request, attribut_id, option_id):
        try:
            option = OptionAttribut.objects.get(
                id=option_id,
                attribut_id=attribut_id,
                attribut__famille__entreprise=request.user.entreprise,
            )
        except OptionAttribut.DoesNotExist:
            return Response(
                {"detail": "Option introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if option.attribut.statut == AttributDynamique.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Impossible de restaurer une option "
                        "lorsque son attribut est archivé."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if option.statut == OptionAttribut.Statut.ACTIVE:
            return Response(
                {"detail": "Cette option est déjà active."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        option.statut = OptionAttribut.Statut.ACTIVE
        option.save(update_fields=["statut"])

        return Response(
            {"detail": "Option restaurée avec succès."},
            status=status.HTTP_200_OK,
        )

# immobilisation
#GET /api/v1/immobilisations/immobilisations/
#POST /api/v1/immobilisations/immobilisations/
class ImmobilisationListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
        "POST": "IMMOBILISATION_AJOUTER",
    }

    def get(self, request):
        immobilisations = (
            Immobilisation.objects
            .filter(
                entreprise=request.user.entreprise
            )
            .select_related(
                "famille",
                "cree_par",
                "modifie_par",
            )
            .order_by(
                "-date_creation",
                "-id_immobilisation",
            )
        )

        serializer = ImmobilisationSerializer(
            immobilisations,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ImmobilisationSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            immobilisation = serializer.save()

            return Response(
                ImmobilisationSerializer(
                    immobilisation,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
# GET /api/v1/immobilisations/immobilisations/<id>/
# PATCH /api/v1/immobilisations/immobilisations/<id>/
class ImmobilisationDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
        "PATCH": "IMMOBILISATION_MODIFIER",
    }

    def get_object(self, request, immobilisation_id):
        try:
            return (
                Immobilisation.objects
                .select_related(
                    "famille",
                    "cree_par",
                    "modifie_par",
                )
                .get(
                    id_immobilisation=immobilisation_id,
                    entreprise=request.user.entreprise,
                )
            )
        except Immobilisation.DoesNotExist:
            return None

    def get(self, request, immobilisation_id):
        immobilisation = self.get_object(
            request,
            immobilisation_id,
        )

        if immobilisation is None:
            return Response(
                {
                    "detail": "Immobilisation introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ImmobilisationSerializer(
            immobilisation,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, immobilisation_id):
        immobilisation = self.get_object(
            request,
            immobilisation_id,
        )

        if immobilisation is None:
            return Response(
                {
                    "detail": "Immobilisation introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if (
            immobilisation.statut
            == Immobilisation.Statut.ARCHIVEE
        ):
            return Response(
                {
                    "detail": (
                        "Une immobilisation archivée "
                        "ne peut pas être modifiée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ImmobilisationSerializer(
            immobilisation,
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
# Archiver une immobilisation
# POST /api/v1/immobilisations/immobilisations/<id>/archive/
class ArchiverImmobilisationView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "IMMOBILISATION_ARCHIVER"

    def post(self, request, immobilisation_id):
        try:
            immobilisation = Immobilisation.objects.get(
                id_immobilisation=immobilisation_id,
                entreprise=request.user.entreprise,
            )
        except Immobilisation.DoesNotExist:
            return Response(
                {"detail": "Immobilisation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if immobilisation.statut == Immobilisation.Statut.ARCHIVEE:
            return Response(
                {"detail": "Cette immobilisation est déjà archivée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        immobilisation.statut = Immobilisation.Statut.ARCHIVEE
        immobilisation.modifie_par = request.user
        immobilisation.save(
            update_fields=[
                "statut",
                "modifie_par",
                "date_derniere_modification",
            ]
        )

        return Response(
            {
                "detail": "Immobilisation archivée avec succès.",
                "immobilisation_id": immobilisation.id_immobilisation,
            },
            status=status.HTTP_200_OK,
        )
# Restaurer une immobilisation
# POST /api/v1/immobilisations/immobilisations/<id>/restore/
class RestaurerImmobilisationView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = "IMMOBILISATION_RESTAURER"

    def post(self, request, immobilisation_id):
        try:
            immobilisation = Immobilisation.objects.get(
                id_immobilisation=immobilisation_id,
                entreprise=request.user.entreprise,
            )
        except Immobilisation.DoesNotExist:
            return Response(
                {"detail": "Immobilisation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if immobilisation.statut != Immobilisation.Statut.ARCHIVEE:
            return Response(
                {
                    "detail": (
                        "Seule une immobilisation archivée "
                        "peut être restaurée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        immobilisation.statut = Immobilisation.Statut.ACTIVE
        immobilisation.modifie_par = request.user
        immobilisation.save(
            update_fields=[
                "statut",
                "modifie_par",
                "date_derniere_modification",
            ]
        )

        return Response(
            {
                "detail": "Immobilisation restaurée avec succès.",
                "immobilisation_id": immobilisation.id_immobilisation,
            },
            status=status.HTTP_200_OK,
        )
# Activer une immobilisation
# POST /api/v1/immobilisations/immobilisations/<int:immobilisation_id>/activer/
class ActiverImmobilisationView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "IMMOBILISATION_MODIFIER"

    def post(self, request, immobilisation_id):
        try:
            immobilisation = Immobilisation.objects.get(
                id_immobilisation=immobilisation_id,
                entreprise=request.user.entreprise,
            )
        except Immobilisation.DoesNotExist:
            return Response(
                {"detail": "Immobilisation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if immobilisation.statut != Immobilisation.Statut.CREEE:
            return Response(
                {
                    "detail": (
                        "Seule une immobilisation créée peut être activée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        immobilisation.statut = Immobilisation.Statut.ACTIVE
        immobilisation.modifie_par = request.user

        immobilisation.save(
            update_fields=[
                "statut",
                "modifie_par",
                "date_derniere_modification",
            ]
        )

        return Response(
            {
                "detail": "Immobilisation activée avec succès.",
                "immobilisation_id": immobilisation.id_immobilisation,
            },
            status=status.HTTP_200_OK,
        )
# Supprimer définitivement une immobilisation
# DELETE /api/v1/immobilisations/immobilisations/<int:immobilisation_id>/
class SupprimerImmobilisationView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "IMMOBILISATION_SUPPRIMER"

    def delete(self, request, immobilisation_id):
        try:
            immobilisation = Immobilisation.objects.get(
                id_immobilisation=immobilisation_id,
                entreprise=request.user.entreprise,
            )
        except Immobilisation.DoesNotExist:
            return Response(
                {"detail": "Immobilisation introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if immobilisation.statut != Immobilisation.Statut.CREEE:
            return Response(
                {
                    "detail": (
                        "Seule une immobilisation créée et inutilisée "
                        "peut être supprimée définitivement."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        immobilisation_id = immobilisation.id_immobilisation
        immobilisation.delete()

        return Response(
            {
                "detail": "Immobilisation supprimée définitivement.",
                "immobilisation_id": immobilisation_id,
            },
            status=status.HTTP_200_OK,
        )

# valeur attribut

# GET /api/v1/immobilisations/valeurs-attributs/
# POST /api/v1/immobilisations/valeurs-attributs/
class ValeurAttributListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
        "POST": "IMMOBILISATION_MODIFIER",
    }

    def get(self, request):
        valeurs = (
            ValeurAttribut.objects
            .filter(
                immobilisation__entreprise=request.user.entreprise
            )
            .select_related(
                "immobilisation",
                "attribut",
                "option",
            )
            .order_by("id")
        )

        serializer = ValeurAttributSerializer(
            valeurs,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def post(self, request):
        serializer = ValeurAttributSerializer(
            data=request.data,
            context={"request": request},
        )

        if serializer.is_valid():
            valeur = serializer.save()

            return Response(
                ValeurAttributSerializer(
                    valeur,
                    context={"request": request},
                ).data,
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


# GET /api/v1/immobilisations/valeurs-attributs/<int:valeur_id>/
# PATCH /api/v1/immobilisations/valeurs-attributs/<int:valeur_id>/
# DELETE /api/v1/immobilisations/valeurs-attributs/<int:valeur_id>/
class ValeurAttributDetailView(APIView):
    permission_classes = [
        IsAuthenticated,
        HasPermission,
    ]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
        "PATCH": "IMMOBILISATION_MODIFIER",
        "DELETE": "IMMOBILISATION_MODIFIER",
    }

    def get_object(self, request, valeur_id):
        try:
            return (
                ValeurAttribut.objects
                .select_related(
                    "immobilisation",
                    "attribut",
                    "option",
                )
                .get(
                    id=valeur_id,
                    immobilisation__entreprise=request.user.entreprise,
                )
            )
        except ValeurAttribut.DoesNotExist:
            return None

    def get(self, request, valeur_id):
        valeur = self.get_object(
            request,
            valeur_id,
        )

        if valeur is None:
            return Response(
                {
                    "detail": "Valeur d'attribut introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ValeurAttributSerializer(
            valeur,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request, valeur_id):
        valeur = self.get_object(
            request,
            valeur_id,
        )

        if valeur is None:
            return Response(
                {
                    "detail": "Valeur d'attribut introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Une immobilisation archivée ne peut plus être modifiée
        if (
            valeur.immobilisation.statut
            == Immobilisation.Statut.ARCHIVEE
        ):
            return Response(
                {
                    "detail": (
                        "Une valeur d'attribut appartenant "
                        "à une immobilisation archivée "
                        "ne peut pas être modifiée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = ValeurAttributSerializer(
            valeur,
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

    def delete(self, request, valeur_id):
        valeur = self.get_object(
            request,
            valeur_id,
        )

        if valeur is None:
            return Response(
                {
                    "detail": "Valeur d'attribut introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        # Une immobilisation archivée ne peut plus être modifiée
        if (
            valeur.immobilisation.statut
            == Immobilisation.Statut.ARCHIVEE
        ):
            return Response(
                {
                    "detail": (
                        "Une valeur d'attribut appartenant "
                        "à une immobilisation archivée "
                        "ne peut pas être supprimée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if valeur.attribut.obligatoire:
            return Response(
                {
                    "detail": (
                        "La valeur d'un attribut obligatoire "
                        "ne peut pas être supprimée."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        valeur_id = valeur.id
        valeur.delete()

        return Response(
            {
                "detail": "Valeur d'attribut supprimée avec succès.",
                "valeur_id": valeur_id,
            },
            status=status.HTTP_200_OK,
        )
#lister les releves d'usage
#GET /api/v1/immobilisations/releves-usages/
class ReleveUsageListView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
    }

    def get(self, request):
        releves = (
            ReleveUsage.objects
            .filter(
                immobilisation__entreprise=request.user.entreprise
            )
            .select_related(
                "immobilisation",
                "attribut",
                "option",
            )
            .order_by("date_releve", "id")
        )

        serializer = ReleveUsageSerializer(
            releves,
            many=True,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
#recuperer un releve d'usage 
# GET /api/v1/immobilisations/releves-usages/<int:releve_id>/
# DELETE /api/v1/immobilisations/releves-usages/<int:releve_id>/
class ReleveUsageDetailView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]

    required_permission = {
        "GET": "IMMOBILISATION_CONSULTER",
        "DELETE": "RELEVE_USAGE_SUPPRIMER",
    }

    def get_object(self, request, releve_id):
        try:
            return (
                ReleveUsage.objects
                .select_related(
                    "immobilisation",
                    "attribut",
                    "option",
                )
                .get(
                    id=releve_id,
                    immobilisation__entreprise=request.user.entreprise,
                )
            )
        except ReleveUsage.DoesNotExist:
            return None

    def get(self, request, releve_id):
        releve = self.get_object(request, releve_id)

        if releve is None:
            return Response(
                {"detail": "Relevé d'usage introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = ReleveUsageSerializer(
            releve,
            context={"request": request},
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )
    def delete(self, request, releve_id):
        releve = self.get_object(request, releve_id)

        if releve is None:
            return Response(
                {"detail": "Relevé d'usage introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        releve.delete()

        return Response(
            {
                "detail": "Relevé d'usage supprimé avec succès.",
                "releve_id": releve_id,
            },
            status=status.HTTP_200_OK,
        )