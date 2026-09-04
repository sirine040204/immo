from django.db import models
from ..accounts.models import Entreprise

#famille
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
#attribut dynamique
class AttributDynamique(models.Model):
    class TypeDonnee(models.TextChoices):
        TEXTE = "TEXTE", "Texte"
        NOMBRE = "NOMBRE", "Nombre"
        DECIMAL = "DECIMAL", "Décimal"
        DATE = "DATE", "Date"
        BOOLEEN = "BOOLEEN", "Booléen"
        LISTE = "LISTE", "Liste"

    class Statut(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVEE = "ARCHIVEE", "Archivée"

    id_attribut = models.BigAutoField(primary_key=True)

    famille = models.ForeignKey(
        Famille,
        on_delete=models.PROTECT,
        related_name="attributs",
    )

    libelle = models.CharField(max_length=255)

    code = models.CharField(
        max_length=100,
        unique=True,
    )

    type_donnee = models.CharField(
        max_length=10,
        choices=TypeDonnee.choices,
    )

    obligatoire = models.BooleanField(default=False)

    valeur_defaut = models.TextField(
        blank=True,
    )

    placeholder = models.CharField(
        max_length=255,
        blank=True,
    )

    valeur_min = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    valeur_max = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    longueur_min = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    longueur_max = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    ordre_affichage = models.PositiveIntegerField(
        default=0,
    )

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIVE,
    )

    class Meta:
        db_table = "attribut_dynamique"
        ordering = ["ordre_affichage", "id_attribut"]

    def __str__(self):
        return self.libelle