from django.db import models

from ..accounts.models import Entreprise


class TypeEntretien(models.Model):

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    id = models.BigAutoField(primary_key=True)

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.PROTECT,
        related_name="types_entretien"
    )

    code = models.CharField(max_length=100)

    nom = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIF
    )

    class Meta:
        db_table = "type_entretien"
        constraints = [
            models.UniqueConstraint(
                fields=["entreprise", "code"],
                name="unique_type_entretien_code_par_entreprise"
            ),
        ]
        ordering = ["nom", "id"]

    def __str__(self):
        return f"{self.code} - {self.nom}"