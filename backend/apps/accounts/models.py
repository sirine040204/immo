from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.contrib.auth.base_user import BaseUserManager
from django.db import models
from django.utils import timezone


class Entreprise(models.Model):

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        ACCEPTEE = "ACCEPTEE", "Acceptée"
        REJETEE = "REJETEE", "Rejetée"
        ACTIVE = "ACTIVE", "Active"
        DESACTIVE = "DESACTIVE", "Désactivée"

    id_entreprise = models.BigAutoField(primary_key=True)
    nom_entreprise = models.CharField(max_length=255)
    numero_fiscal = models.CharField(max_length=100)
    forme_juridique = models.CharField(max_length=100)
    secteur_activite = models.CharField(max_length=150)
    email_notifications = models.EmailField()
    numero_telephone = models.CharField(max_length=30)
    date_creation = models.DateTimeField(default=timezone.now)
    description = models.TextField(blank=True)

    documents_justificatifs = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )

    logo = models.CharField(max_length=500, blank=True)
    adresse = models.TextField(blank=True)
    site_web = models.URLField(blank=True)
    devise = models.CharField(max_length=10, blank=True)
    langue = models.CharField(max_length=10, blank=True)

    delai_rappel_maintenance_defaut = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    delai_rappel_document_defaut = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    class Meta:
        db_table = "entreprise"

    def __str__(self):
        return self.nom_entreprise


class Role(models.Model):

    class Statut(models.TextChoices):
        ACTIF = "ACTIF", "Actif"
        ARCHIVE = "ARCHIVE", "Archivé"

    id = models.BigAutoField(primary_key=True)
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=10,
        choices=Statut.choices,
        default=Statut.ACTIF,
    )

    date_creation = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "role"

    def __str__(self):
        return self.nom


class Permission(models.Model):

    id = models.BigAutoField(primary_key=True)
    code = models.CharField(max_length=100, unique=True)
    nom = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "permission"

    def __str__(self):
        return self.nom


class RolePermission(models.Model):

    role = models.ForeignKey(
        Role,
        on_delete=models.CASCADE,
        db_column="role_id",
        related_name="role_permissions",
    )

    permission = models.ForeignKey(
        Permission,
        on_delete=models.CASCADE,
        db_column="permission_id",
        related_name="role_permissions",
    )

    class Meta:
        db_table = "role_permission"
        constraints = [
            models.UniqueConstraint(
                fields=["role", "permission"],
                name="unique_role_permission",
            )
        ]


class UserManager(BaseUserManager):

    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")

        email = self.normalize_email(email)

        user = self.model(
            email=email,
            **extra_fields,
        )

        user.set_password(password)
        user.save(using=self._db)

        return user

    def create_superuser(self, email, password=None, **extra_fields):

        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_approved", True)

        extra_fields.setdefault(
            "statut",
            User.Statut.ACTIVE,
        )

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Le super admin doit être staff.")

        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Le super admin doit être superuser.")

        return self.create_user(
            email=email,
            password=password,
            **extra_fields,
        )


class User(AbstractBaseUser, PermissionsMixin):

    class Statut(models.TextChoices):
        EN_ATTENTE = "EN_ATTENTE", "En attente"
        ACCEPTEE = "ACCEPTEE", "Acceptée"
        REJETEE = "REJETEE", "Rejetée"
        ACTIVE = "ACTIVE", "Active"
        DESACTIVE = "DESACTIVE", "Désactivée"

    id_utilisateur = models.BigAutoField(primary_key=True)

    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)

    email = models.EmailField(unique=True)

    telephone = models.CharField(
        max_length=30,
        blank=True,
    )

    role = models.ForeignKey(
        Role,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="utilisateurs",
    )

    entreprise = models.ForeignKey(
        Entreprise,
        #on_delete=models.SET_NULL,
        on_delete=models.CASCADE,   #business rule
        null=True,
        blank=True,
        related_name="utilisateurs",
    )

    statut = models.CharField(
        max_length=20,
        choices=Statut.choices,
        default=Statut.EN_ATTENTE,
    )

    is_company_admin = models.BooleanField(default=False)

    is_approved = models.BooleanField(default=False)

    date_creation = models.DateTimeField(default=timezone.now)

    derniere_connexion = models.DateTimeField(
        null=True,
        blank=True,
    )

    is_staff = models.BooleanField(default=False)

    is_active = models.BooleanField(default=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        db_table = "utilisateur"

    def __str__(self):
        return self.email

class EmployeeActivation(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="activation",
    )

    token = models.UUIDField(
        unique=True,
        editable=False,
    )

    expires_at = models.DateTimeField()

    used = models.BooleanField(default=False)

    class Meta:
        db_table = "employee_activation"

    def __str__(self):
        return f"Activation - {self.user.email}"