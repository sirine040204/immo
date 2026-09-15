from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone

from ..immobilisations.models import Immobilisation
from ..documents.models import Document


class CoutImmobilisation(models.Model):

    # ============================================================
    # TYPES DE COÛTS
    # ============================================================

    class TypeCout(models.TextChoices):
        ACQUISITION = "ACQUISITION", "Acquisition"
        FRAIS_ACQUISITION = (
            "FRAIS_ACQUISITION",
            "Frais d'acquisition",
        )
        ENTRETIEN = "ENTRETIEN", "Entretien"
        REPARATION = "REPARATION", "Réparation"
        ASSURANCE = "ASSURANCE", "Assurance"
        CONTROLE_TECHNIQUE = (
            "CONTROLE_TECHNIQUE",
            "Contrôle technique",
        )
        AUTRE = "AUTRE", "Autre"

    # ============================================================
    # STATUTS
    # ============================================================

    class Statut(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"

        EN_ATTENTE_VALIDATION = (
            "EN_ATTENTE_VALIDATION",
            "En attente de validation",
        )

        VALIDE = "VALIDE", "Validé"

        REJETE = "REJETE", "Rejeté"

    # ============================================================
    # IDENTIFICATION
    # ============================================================

    id_cout = models.BigAutoField(
        primary_key=True
    )

    immobilisation = models.ForeignKey(
        Immobilisation,
        on_delete=models.PROTECT,
        related_name="couts",
    )

    type_cout = models.CharField(
        max_length=30,
        choices=TypeCout.choices,
    )

    libelle = models.CharField(
        max_length=255,
    )

    date_cout = models.DateField()

    # ============================================================
    # INFORMATIONS FINANCIÈRES
    # ============================================================

    montant_ht = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[
            MinValueValidator(Decimal("0.01")),
        ],
    )

    taux_tva = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=Decimal("0.00"),
        validators=[
            MinValueValidator(Decimal("0.00")),
            MaxValueValidator(Decimal("100.00")),
        ],
    )

    montant_tva = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        editable=False,
    )

    montant_ttc = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal("0.00"),
        editable=False,
    )

    # ============================================================
    # DOCUMENT JUSTIFICATIF
    # ============================================================

    document = models.ForeignKey(
        Document,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="couts",
    )

    # ============================================================
    # STATUT ET COMMENTAIRE
    # ============================================================

    statut = models.CharField(
        max_length=30,
        choices=Statut.choices,
        default=Statut.BROUILLON,
    )

    commentaire = models.TextField(
        blank=True,
    )

    # ============================================================
    # AUDIT — CRÉATION
    # ============================================================

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    cree_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="couts_crees",
    )

    # ============================================================
    # AUDIT — MODIFICATION
    # ============================================================

    modifie_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="couts_modifies",
    )

    date_modification = models.DateTimeField(
        auto_now=True,
    )

    # ============================================================
    # AUDIT — VALIDATION
    # ============================================================

    valide_par = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="couts_valides",
    )

    date_validation = models.DateTimeField(
        null=True,
        blank=True,
    )

    motif_rejet = models.TextField(
        null=True,
        blank=True,
    )

    # ============================================================
    # MÉTADONNÉES
    # ============================================================

    class Meta:
        db_table = "cout_immobilisation"

        ordering = [
            "-date_creation",
            "-id_cout",
        ]

        indexes = [
            models.Index(
                fields=[
                    "immobilisation",
                    "type_cout",
                ],
                name="idx_cout_immob_type",
            ),
            models.Index(
                fields=[
                    "immobilisation",
                    "statut",
                ],
                name="idx_cout_immob_statut",
            ),
            models.Index(
                fields=[
                    "date_cout",
                ],
                name="idx_cout_date",
            ),
        ]

    def __str__(self):
        return (
            f"{self.immobilisation.code} - "
            f"{self.libelle} - "
            f"{self.montant_ttc}"
        )

    # ============================================================
    # CALCULS FINANCIERS
    # ============================================================

    def calculer_montants(self):
        """
        Calcule automatiquement la TVA et le montant TTC.

        montant_tva = montant_ht * taux_tva / 100
        montant_ttc = montant_ht + montant_tva
        """

        self.montant_tva = (
            self.montant_ht * self.taux_tva / Decimal("100")
        ).quantize(Decimal("0.01"))

        self.montant_ttc = (
            self.montant_ht + self.montant_tva
        ).quantize(Decimal("0.01"))

    # ============================================================
    # SAUVEGARDE
    # ============================================================

    def save(self, *args, **kwargs):
        self.calculer_montants()
        super().save(*args, **kwargs)