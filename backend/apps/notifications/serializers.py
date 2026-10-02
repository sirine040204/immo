from rest_framework import serializers

from ..notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):

    immobilisation_nom = serializers.CharField(source='immobilisation.designation', read_only=True, default=None)
    document_nom = serializers.CharField(source='document.nom', read_only=True, default=None)
    intervention_nom = serializers.SerializerMethodField(read_only=True)
    cout_nom = serializers.CharField(source='cout.libelle', read_only=True, default=None)

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
            "immobilisation_nom",
            "document",
            "document_nom",
            "intervention",
            "intervention_nom",
            "cout",
            "cout_nom",
        ]

        read_only_fields = fields

    def get_intervention_nom(self, obj):
        if obj.intervention:
            return f"Intervention #{obj.intervention.id}"
        return None