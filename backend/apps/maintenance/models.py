from django.db import models

from ..accounts.models import Entreprise
from ..immobilisations.models import Famille, Immobilisation
from django.contrib.auth import get_user_model

User = get_user_model()
#type entretien
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

#modele entretien
class ModeleEntretien(models.Model):

    class TypePlanification(models.TextChoices):
        TEMPS = "TEMPS", "Temps"
        USAGE = "USAGE", "Usage"
        DATE_FIXE = "DATE_FIXE", "Date fixe"
        MANUELLE = "MANUELLE", "Manuelle"

    class UnitePeriodicite(models.TextChoices):
        JOURS = "JOURS", "Jours"
        SEMAINES = "SEMAINES", "Semaines"
        MOIS = "MOIS", "Mois"
        ANNEES = "ANNEES", "Années"

    class UniteUsage(models.TextChoices):
        KM = "KM", "Kilomètres"
        HEURES = "HEURES", "Heures"
        CYCLES = "CYCLES", "Cycles"

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    # =========================
    # IDENTIFICATION
    # =========================

    id = models.BigAutoField(primary_key=True)

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.PROTECT,
        related_name="modeles_entretien"
    )

    famille = models.ForeignKey(
        Famille,
        on_delete=models.PROTECT,
        related_name="modeles_entretien"
    )

    type_entretien = models.ForeignKey(
        TypeEntretien,
        on_delete=models.PROTECT,
        related_name="modeles_entretien"
    )

    code = models.CharField(max_length=100)

    nom = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    # =========================
    # PLANIFICATION
    # =========================

    type_planification = models.CharField(
        max_length=20,
        choices=TypePlanification.choices
    )

    periodicite = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    unite_periodicite = models.CharField(
        max_length=10,
        choices=UnitePeriodicite.choices,
        null=True,
        blank=True
    )

    seuil_usage = models.PositiveIntegerField(
        null=True,
        blank=True
    )

    unite_usage = models.CharField(
        max_length=10,
        choices=UniteUsage.choices,
        null=True,
        blank=True
    )

    date_fixe = models.DateField(
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

    class Meta:
        db_table = "modele_entretien"

        constraints = [
            models.UniqueConstraint(
                fields=["entreprise", "code"],
                name="unique_modele_entretien_code_par_entreprise"
            ),
        ]

        ordering = ["nom", "id"]

    def __str__(self):
        return f"{self.code} - {self.nom}"

#EtapeEntretien
class EtapeEntretien(models.Model):

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    id = models.BigAutoField(primary_key=True)

    modele_entretien = models.ForeignKey(
        ModeleEntretien,
        on_delete=models.PROTECT,
        related_name="etapes"
    )

    libelle = models.CharField(max_length=255)

    description = models.TextField(blank=True)

    ordre = models.PositiveIntegerField()

    obligatoire = models.BooleanField(default=True)

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIF
    )

    class Meta:
        db_table = "etape_entretien"
        constraints = [
            models.UniqueConstraint(
                fields=["modele_entretien", "ordre"],
                name="unique_etape_ordre_par_modele"
            ),
        ]
        ordering = ["ordre", "id"]

    def __str__(self):
        return f"{self.ordre} - {self.libelle}"

#Intervention
class Intervention(models.Model):

    class Priorite(models.TextChoices):
        FAIBLE = "FAIBLE", "Faible"
        NORMALE = "NORMALE", "Normale"
        HAUTE = "HAUTE", "Haute"
        URGENTE = "URGENTE", "Urgente"

    class Statut(models.TextChoices):
        BROUILLON = "BROUILLON", "Brouillon"
        PLANIFIEE = "PLANIFIEE", "Planifiée"
        EN_COURS = "EN_COURS", "En cours"
        TERMINEE = "TERMINEE", "Terminée"
        ANNULEE = "ANNULEE", "Annulée"

    # =========================
    # IDENTIFICATION
    # =========================

    id = models.BigAutoField(primary_key=True)

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.PROTECT,
        related_name="interventions"
    )

    immobilisation = models.ForeignKey(
        Immobilisation,
        on_delete=models.PROTECT,
        related_name="interventions"
    )

    modele_entretien = models.ForeignKey(
        ModeleEntretien,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="interventions"
    )

    type_entretien = models.ForeignKey(
        TypeEntretien,
        on_delete=models.PROTECT,
        related_name="interventions"
    )

    demande_par = models.ForeignKey(
        User,
        on_delete=models.PROTECT,
        related_name="interventions_demandees"
    )

    # =========================
    # DATES
    # =========================

    date_demande = models.DateField(
        auto_now_add=True
    )

    date_prevue = models.DateField(
        null=True,
        blank=True
    )

    date_debut = models.DateField(
        null=True,
        blank=True
    )

    date_fin = models.DateField(
        null=True,
        blank=True
    )

    # =========================
    # INFORMATIONS
    # =========================

    priorite = models.CharField(
        max_length=10,
        choices=Priorite.choices,
        default=Priorite.NORMALE
    )

    motif = models.TextField(
        blank=True
    )

    # =========================
    # STATUT
    # =========================

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.BROUILLON
    )

    class Meta:
        db_table = "intervention"
        ordering = ["-date_demande", "-id"]

    def __str__(self):
        return f"Intervention #{self.id} - {self.immobilisation}"