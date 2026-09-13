from django.db import models
from ..accounts.models import Entreprise


class TypeDocument(models.Model):

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    id_type_document = models.BigAutoField(
        primary_key=True
    )

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.CASCADE,
        related_name="types_document",
    )

    code = models.CharField(
        max_length=100
    )

    nom = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    a_echeance = models.BooleanField(
        default=False
    )

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.ACTIF,
    )

    class Meta:
        db_table = "type_document"

        ordering = [
            "code",
            "id_type_document",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "entreprise",
                    "code",
                ],
                name="unique_type_document_code_par_entreprise",
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.nom}"