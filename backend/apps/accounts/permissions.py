from rest_framework.permissions import BasePermission


def user_has_permission(user, permission_code):
    """
    Vérifie si l'utilisateur possède une permission.

    - Super Admin : tous les droits sur l'application.
    - Company Admin : tous les droits dans sa propre entreprise.
    - Employé : droits accordés par son rôle.
    """

    if not user or not user.is_authenticated:
        return False

    # Super Admin
    if user.is_superuser:
        return True

    # Company Admin
    if user.is_company_admin:
        return True

    # Employé sans rôle
    if not user.role:
        return False

    return user.role.role_permissions.filter(
        permission__code=permission_code
    ).exists()


class HasPermission(BasePermission):
    """
    Permission DRF basée sur le code de permission
    défini par la vue.
    """

    required_permission = None

    def has_permission(self, request, view):

        permission_code = getattr(
            view,
            "required_permission",
            self.required_permission,
        )

        if isinstance(permission_code, dict):
            permission_code = permission_code.get(
                request.method
            )

        if not permission_code:
            return False

        return user_has_permission(
            request.user,
            permission_code,
        )