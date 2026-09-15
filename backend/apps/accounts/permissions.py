from rest_framework.permissions import BasePermission

from .models import Entreprise


def user_has_permission(user, permission_code):
    """
    Vérifie si l'utilisateur possède une permission.

    - Super Admin : tous les droits sur l'application.
    - Utilisateur d'une entreprise désactivée : aucun droit métier.
    - Company Admin : tous les droits dans sa propre entreprise.
    - Employé : droits accordés par son rôle.

    permission_code peut être :
    - une chaîne : "DOCUMENT_CONSULTER"
    - une liste/tuple : ["DOCUMENT_CONSULTER", "DOCUMENT_ADMIN"]
    """

    if not user or not user.is_authenticated:
        return False

    # Super Admin
    if user.is_superuser:
        return True

    # Utilisateur sans entreprise
    if not user.entreprise:
        return False

    # Entreprise inactive
    if user.entreprise.statut != Entreprise.Statut.ACTIVE:
        return False

    # Company Admin
    if user.is_company_admin:
        return True

    # Employé sans rôle
    if not user.role:
        return False

    # Plusieurs permissions possibles :
    # une seule permission parmi la liste suffit.
    if isinstance(permission_code, (list, tuple, set)):
        return user.role.role_permissions.filter(
            permission__code__in=permission_code
        ).exists()

    # Une seule permission
    return user.role.role_permissions.filter(
        permission__code=permission_code
    ).exists()


class HasPermission(BasePermission):
    """
    Permission DRF basée sur le code de permission
    défini par la vue.

    required_permission peut être :
    - une chaîne
    - une liste de chaînes
    - un dictionnaire HTTP method -> permission ou liste de permissions
    """

    required_permission = None

    def has_permission(self, request, view):

        required_permission = getattr(
            view,
            "required_permission",
            None,
        )

        if isinstance(required_permission, dict):
            permission_code = required_permission.get(
                request.method
            )
        else:
            permission_code = required_permission

        if not permission_code:
            return False

        return user_has_permission(
            request.user,
            permission_code,
        )