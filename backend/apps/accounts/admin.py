from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import CustomUserCreationForm, CustomUserChangeForm

from .models import (
    Entreprise,
    Permission,
    Role,
    RolePermission,
    User,
)


@admin.register(Entreprise)
class EntrepriseAdmin(admin.ModelAdmin):
    list_display = (
        "nom_entreprise",
        "numero_fiscal",
        "statut",
        "date_creation",
    )
    list_filter = ("statut",)
    search_fields = (
        "nom_entreprise",
        "numero_fiscal",
        "email_notifications",
    )


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = (
        "nom",
        "statut",
        "date_creation",
    )
    list_filter = ("statut",)
    search_fields = ("nom",)


@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = (
        "code",
        "nom",
    )
    search_fields = (
        "code",
        "nom",
    )


@admin.register(RolePermission)
class RolePermissionAdmin(admin.ModelAdmin):
    list_display = (
        "role",
        "permission",
    )
    list_filter = ("role", "permission")
    search_fields = (
        "role__nom",
        "permission__code",
        "permission__nom",
    )


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    form = CustomUserChangeForm
    add_form = CustomUserCreationForm

    ordering = ("email",)
    list_display = (
        "email",
        "nom",
        "prenom",
        "entreprise",
        "role",
        "statut",
        "is_company_admin",
        "is_approved",
        "is_staff",
    )
    list_filter = (
        "statut",
        "is_company_admin",
        "is_approved",
        "is_staff",
        "is_superuser",
    )
    search_fields = (
        "email",
        "nom",
        "prenom",
    )

    fieldsets = (
        (
            None,
            {
                "fields": (
                    "email",
                    "password",
                )
            },
        ),
        (
            "Informations personnelles",
            {
                "fields": (
                    "nom",
                    "prenom",
                    "telephone",
                )
            },
        ),
        (
            "Entreprise et rôle",
            {
                "fields": (
                    "entreprise",
                    "role",
                    "is_company_admin",
                )
            },
        ),
        (
            "Statut",
            {
                "fields": (
                    "statut",
                    "is_approved",
                    "is_active",
                )
            },
        ),
        (
            "Permissions Django",
            {
                "fields": (
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (
            "Dates",
            {
                "fields": (
                    "last_login",
                    "derniere_connexion",
                    "date_creation",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "password1",
                    "password2",
                    "nom",
                    "prenom",
                    "is_staff",
                    "is_superuser",
                    "is_approved",
                ),
            },
        ),
    )