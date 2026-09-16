from django.conf import settings
from django.db import models


class Notification(models.Model):

    class Type(models.TextChoices):
        DOCUMENT_AJOUT = ("DOCUMENT_AJOUT", "Ajout document")
        DOCUMENT_EXPIRATION = (
            "DOCUMENT_EXPIRATION",
            "Expiration document",
        )

        GARANTIE_EXPIRATION = (
            "GARANTIE_EXPIRATION",
            "Expiration garantie",
        )

        MAINTENANCE = (
            "MAINTENANCE",
            "Maintenance",
        )

        COUT_VALIDATION = (
            "COUT_VALIDATION",
            "Validation coût",
        )

        STATUT_CHANGE = (
            "STATUT_CHANGE",
            "Changement de statut",
        )

        AFFECTATION = (
            "AFFECTATION",
            "Affectation",
        )

    class Niveau(models.TextChoices):
        INFO = "INFO", "Information"
        WARNING = "WARNING", "Avertissement"
        URGENT = "URGENT", "Urgent"

    id_notification = models.BigAutoField(
        primary_key=True
    )

    entreprise = models.ForeignKey(
        "accounts.Entreprise",
        on_delete=models.PROTECT,
        related_name="notifications",
    )

    destinataire = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )

    type_notification = models.CharField(
        max_length=50,
        choices=Type.choices,
    )

    niveau = models.CharField(
        max_length=20,
        choices=Niveau.choices,
        default=Niveau.INFO,
    )

    titre = models.CharField(
        max_length=255,
    )

    message = models.TextField()

    lu = models.BooleanField(
        default=False,
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    date_lecture = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Related objects
    immobilisation = models.ForeignKey(
        "immobilisations.Immobilisation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    document = models.ForeignKey(
        "documents.Document",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    intervention = models.ForeignKey(
        "maintenance.Intervention",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    cout = models.ForeignKey(
        "costs.CoutImmobilisation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )

    # Prevent duplicate notifications
    cle_unique = models.CharField(
        max_length=255,
        unique=True,
    )

    # Email tracking
    email_envoye = models.BooleanField(
        default=False,
    )

    date_envoi_email = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "notification"

        ordering = [
            "-date_creation",
            "-id_notification",
        ]

        indexes = [
            models.Index(
                fields=["destinataire", "lu"],
                name="idx_notif_dest_lu",
            ),
            models.Index(
                fields=["entreprise", "date_creation"],
                name="idx_notif_entreprise_date",
            ),
            models.Index(
                fields=["type_notification"],
                name="idx_notif_type",
            ),
        ]

    def __str__(self):
        return f"{self.titre} - {self.destinataire.email}"