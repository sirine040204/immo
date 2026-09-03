from django.db import models
from apps.accounts.models import Entreprise


class Famille(models.Model):

    class Statut(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVEE = "ARCHIVEE", "Archivée"

    id_famille = models.BigAutoField(primary_key=True)

    code = models.CharField(max_length=100)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=500, blank=True)

    taux_amortissement = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.ACTIVE,
    )

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.CASCADE,
        related_name="familles",
    )

    class Meta:
        db_table = "famille"
        constraints = [
            models.UniqueConstraint(
                fields=["entreprise", "code"],
                name="unique_famille_code_par_entreprise",
            ),
        ]

    def __str__(self):
        return f"{self.code} - {self.nom}"