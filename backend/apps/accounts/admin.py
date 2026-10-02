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


from django.contrib import messages
from ..accounts.utils import send_company_status_email

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
    actions = ["approve_companies", "reject_companies", "suspend_companies", "reactivate_companies"]

    @admin.action(description="Approuver les entreprises sélectionnées")
    def approve_companies(self, request, queryset):
        from django.db import transaction
        
        approved_count = 0
        with transaction.atomic():
            # Only process companies that are currently EN_ATTENTE
            for company in queryset.filter(statut=Entreprise.Statut.EN_ATTENTE):
                company.statut = Entreprise.Statut.ACTIVE
                company.save(update_fields=["statut"])
                
                # Activate the company admins
                admins = User.objects.filter(
                    entreprise=company,
                    is_company_admin=True,
                )
                
                admins.update(
                    statut=User.Statut.ACTIVE,
                    is_approved=True,
                )
                
                for admin_user in admins:
                    send_company_status_email(admin_user, company, "APPROUVE")
                    
                approved_count += 1
                
        self.message_user(
            request, 
            f"{approved_count} entreprise(s) approuvée(s) avec succès.", 
            messages.SUCCESS
        )

    @admin.action(description="Rejeter les entreprises sélectionnées")
    def reject_companies(self, request, queryset):
        from django.db import transaction
        
        rejected_count = 0
        with transaction.atomic():
            # Only process companies that are currently EN_ATTENTE
            for company in queryset.filter(statut=Entreprise.Statut.EN_ATTENTE):
                company.statut = Entreprise.Statut.REJETEE
                company.save(update_fields=["statut"])
                
                # Reject the company admins
                admins = User.objects.filter(
                    entreprise=company,
                    is_company_admin=True,
                )
                
                admins.update(
                    statut=User.Statut.REJETEE,
                    is_approved=False,
                )
                
                for admin_user in admins:
                    send_company_status_email(admin_user, company, "REJETE")
                    
                rejected_count += 1
                
        self.message_user(
            request, 
            f"{rejected_count} entreprise(s) rejetée(s) avec succès.", 
            messages.WARNING
        )

    @admin.action(description="Suspendre les entreprises sélectionnées")
    def suspend_companies(self, request, queryset):
        from django.db import transaction
        
        suspended_count = 0
        with transaction.atomic():
            # Only process companies that are currently ACTIVE
            for company in queryset.filter(statut=Entreprise.Statut.ACTIVE):
                company.statut = Entreprise.Statut.DESACTIVE
                company.save(update_fields=["statut"])
                
                # NOTE: We specifically DO NOT update the employee/admin status here.
                # The company itself becomes the access-control boundary.
                
                admins = User.objects.filter(entreprise=company, is_company_admin=True)
                for admin_user in admins:
                    send_company_status_email(admin_user, company, "SUSPENDU")
                
                suspended_count += 1
                
        self.message_user(
            request, 
            f"{suspended_count} entreprise(s) suspendue(s) avec succès.", 
            messages.WARNING
        )

    @admin.action(description="Réactiver les entreprises sélectionnées")
    def reactivate_companies(self, request, queryset):
        from django.db import transaction
        
        reactivated_count = 0
        with transaction.atomic():
            # Only process companies that are currently DESACTIVE
            for company in queryset.filter(statut=Entreprise.Statut.DESACTIVE):
                company.statut = Entreprise.Statut.ACTIVE
                company.save(update_fields=["statut"])
                
                # NOTE: We specifically DO NOT update the employee/admin status here.
                # Reactivation restores company access, but individual employee lifecycles are untouched.
                
                admins = User.objects.filter(entreprise=company, is_company_admin=True)
                for admin_user in admins:
                    send_company_status_email(admin_user, company, "REACTIVE")
                    
                reactivated_count += 1
                
        self.message_user(
            request, 
            f"{reactivated_count} entreprise(s) réactivée(s) avec succès.", 
            messages.SUCCESS
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