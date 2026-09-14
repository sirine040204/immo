from django.db import models
from django.conf import settings

from ..accounts.models import Entreprise
from ..immobilisations.models import Immobilisation, Famille

from django.contrib.auth import get_user_model

User = get_user_model()
#type document
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

#document
class Document(models.Model):

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    # =========================
    # IDENTIFICATION
    # =========================

    id = models.BigAutoField(
        primary_key=True
    )

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.PROTECT,
        related_name="documents"
    )

    immobilisation = models.ForeignKey(
        Immobilisation,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="documents"
    )

    type_document = models.ForeignKey(
        TypeDocument,
        on_delete=models.PROTECT,
        related_name="documents"
    )

    nom = models.CharField(
        max_length=255
    )

    description = models.TextField(
        blank=True
    )

    fichier = models.FileField(
        upload_to="documents/%Y/%m/",
        max_length=500
    )

    # =========================
    # DATES
    # =========================

    date_document = models.DateField()

    date_debut_validite = models.DateField(
        null=True,
        blank=True
    )

    date_fin_validite = models.DateField(
        null=True,
        blank=True
    )

    # =========================
    # STATUT
    # =========================

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIF
    )

    # =========================
    # TRAÇABILITÉ
    # =========================

    date_ajout = models.DateTimeField(
        auto_now_add=True
    )

    ajoute_par = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="documents_ajoutes"
    )

    class Meta:
        db_table = "document"

        ordering = [
            "-date_ajout",
            "-id"
        ]

    def __str__(self):
        return self.nom

#TypeDocumentFamille
class TypeDocumentFamille(models.Model):

    id_type_document_famille = models.BigAutoField(
        primary_key=True
    )

    type_document = models.ForeignKey(
        TypeDocument,
        on_delete=models.PROTECT,
        related_name="types_familles",
    )

    famille = models.ForeignKey(
        Famille,
        on_delete=models.PROTECT,
        related_name="types_documents",
    )

    obligatoire = models.BooleanField(
        default=False
    )

    class Meta:
        db_table = "type_document_famille"

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "type_document",
                    "famille",
                ],
                name="unique_type_document_famille",
            ),
        ]

    def __str__(self):
        return (
            f"{self.famille.nom} - "
            f"{self.type_document.nom}"
        )