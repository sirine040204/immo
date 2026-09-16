from rest_framework import serializers

from ..notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    class Meta:
        model = Notification

        fields = [
            "id_notification",
            "entreprise",
            "destinataire",
            "type_notification",
            "niveau",
            "titre",
            "message",
            "lu",
            "date_creation",
            "date_lecture",
            "immobilisation",
            "document",
            "intervention",
            "cout",
        ]

        read_only_fields = fields