from django.db import models
from ..accounts.models import Entreprise
from django.contrib.auth import get_user_model
User = get_user_model()
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
        
#option pour l'attribut dynamique de type liste
class OptionAttribut(models.Model):
    class Statut(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        ARCHIVEE = "ARCHIVEE", "Archivée"

    id = models.BigAutoField(primary_key=True)

    attribut = models.ForeignKey(
        AttributDynamique,
        on_delete=models.PROTECT,
        related_name="options",
    )

    libelle = models.CharField(max_length=255)

    code = models.CharField(max_length=100)

    ordre = models.PositiveIntegerField(default=0)

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIVE,
    )

    class Meta:
        db_table = "option_attribut"
        ordering = ["ordre", "id"]

    def __str__(self):
        return self.libelle

#immobilisation
class Immobilisation(models.Model):
    class Statut(models.TextChoices):
        CREEE = "CREEE", "Créée"
        ACTIVE = "ACTIVE", "Active"
        EN_SERVICE = "EN_SERVICE", "En service"
        HORS_SERVICE = "HORS_SERVICE", "Hors service"
        REFORMEE = "REFORMEE", "Réformée"
        ARCHIVEE = "ARCHIVEE", "Archivée"

    class ModeCalcul(models.TextChoices):
        LINEAIRE = "LINEAIRE", "Linéaire"
        DEGRESSIF = "DEGRESSIF", "Dégressif"

    class MotifSortie(models.TextChoices):
        VENTE = "VENTE", "Vente"
        MISE_AU_REBUT = "MISE_AU_REBUT", "Mise au rebut"
        DESTRUCTION = "DESTRUCTION", "Destruction"
        DON = "DON", "Don"
        REMPLACEMENT = "REMPLACEMENT", "Remplacement"
        AUTRE = "AUTRE", "Autre"

    id_immobilisation = models.BigAutoField(primary_key=True)

    entreprise = models.ForeignKey(
        Entreprise,
        on_delete=models.PROTECT,
        related_name="immobilisations",
    )

    famille = models.ForeignKey(
        Famille,
        on_delete=models.PROTECT,
        related_name="immobilisations",
    )

    # Informations générales
    code = models.CharField(
        max_length=100,
        unique=True,
    )
    designation = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.CREEE,
    )

    # Informations d'acquisition
    date_acquisition = models.DateField()
    valeur_brute = models.DecimalField(
        max_digits=15,
        decimal_places=2,
    )
    tva_recuperable = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )
    numero_facture = models.CharField(
        max_length=100,
        blank=True,
    )

    # Informations comptables
    taux_amortissement = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
    )

    mode_calcul = models.CharField(
        max_length=20,
        choices=ModeCalcul.choices,
        default=ModeCalcul.LINEAIRE,
    )

    amortissement_anterieur = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0,
    )

    # Informations techniques
    numero_serie = models.CharField(
        max_length=100,
        blank=True,
    )

    date_mise_en_service = models.DateField(
        null=True,
        blank=True,
    )

    date_fin_garantie = models.DateField(
        null=True,
        blank=True,
    )

    etat_physique = models.CharField(
        max_length=100,
        blank=True,
    )

    # Sortie
    date_cession = models.DateField(
        null=True,
        blank=True,
    )

    prix_cession = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        null=True,
        blank=True,
    )

    motif_sortie = models.CharField(
        max_length=30,
        choices=MotifSortie.choices,
        blank=True,
    )

    # Audit
    cree_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="immobilisations_creees",
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
    )

    modifie_par = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="immobilisations_modifiees",
    )

    date_derniere_modification = models.DateTimeField(
        auto_now=True,
    )

    # Maintenance
    date_derniere_maintenance = models.DateField(
        null=True,
        blank=True,
    )

    date_prochaine_maintenance = models.DateField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "immobilisation"
        ordering = ["-date_creation", "-id_immobilisation"]

    def __str__(self):
        return f"{self.code} - {self.designation}"