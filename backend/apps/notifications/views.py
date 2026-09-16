from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..notifications.models import Notification
from ..notifications.serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    Returns notifications belonging only to the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = Notification.objects.filter(
            destinataire=request.user,
            entreprise=request.user.entreprise,
        ).select_related(
            "immobilisation",
            "document",
            "intervention",
            "cout",
        )

        serializer = NotificationSerializer(
            notifications,
            many=True,
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class NotificationDetailView(APIView):
    """
    Returns one notification belonging to the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        notification = Notification.objects.filter(
            id_notification=pk,
            destinataire=request.user,
            entreprise=request.user.entreprise,
        ).first()

        if notification is None:
            return Response(
                {
                    "detail": "Notification introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = NotificationSerializer(notification)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class NotificationReadView(APIView):
    """
    Marks one notification as read.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        notification = Notification.objects.filter(
            id_notification=pk,
            destinataire=request.user,
            entreprise=request.user.entreprise,
        ).first()

        if notification is None:
            return Response(
                {
                    "detail": "Notification introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.lu = True
        notification.date_lecture = timezone.now()
        notification.save(
            update_fields=[
                "lu",
                "date_lecture",
            ]
        )

        serializer = NotificationSerializer(notification)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class NotificationUnreadView(APIView):
    """
    Marks one notification as unread.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):

        notification = Notification.objects.filter(
            id_notification=pk,
            destinataire=request.user,
            entreprise=request.user.entreprise,
        ).first()

        if notification is None:
            return Response(
                {
                    "detail": "Notification introuvable."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        notification.lu = False
        notification.date_lecture = None
        notification.save(
            update_fields=[
                "lu",
                "date_lecture",
            ]
        )

        serializer = NotificationSerializer(notification)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class NotificationReadAllView(APIView):
    """
    Marks all notifications of the authenticated user as read.
    """

    permission_classes = [IsAuthenticated]

    def patch(self, request):

        updated_count = Notification.objects.filter(
            destinataire=request.user,
            entreprise=request.user.entreprise,
            lu=False,
        ).update(
            lu=True,
            date_lecture=timezone.now(),
        )

        return Response(
            {
                "message": "Toutes les notifications ont été marquées comme lues.",
                "nombre_modifie": updated_count,
            },
            status=status.HTTP_200_OK,
        )