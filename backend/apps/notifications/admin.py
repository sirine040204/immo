from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):

    list_display = (
        "id_notification",
        "titre",
        "destinataire",
        "entreprise",
        "type_notification",
        "niveau",
        "lu",
        "email_envoye",
        "date_creation",
    )

    list_filter = (
        "type_notification",
        "niveau",
        "lu",
        "email_envoye",
        "entreprise",
    )

    search_fields = (
        "titre",
        "message",
        "destinataire__email",
        "destinataire__nom",
        "destinataire__prenom",
    )

    readonly_fields = (
        "date_creation",
        "date_lecture",
        "date_envoi_email",
    )