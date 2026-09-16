# apps/notifications/services/recipient_service.py

from django.contrib.auth import get_user_model


User = get_user_model()


def get_company_admins(entreprise):
    """
    Returns active company administrators belonging
    to the specified enterprise.
    """

    return User.objects.filter(
        entreprise=entreprise,
        is_company_admin=True,
        is_active=True,
    )


def get_users_with_permission(entreprise, permission_code):
    """
    Returns active users from the same enterprise
    who have the specified permission.
    """

    return User.objects.filter(
        entreprise=entreprise,
        is_active=True,
        role__role_permissions__permission__code=permission_code,
    ).distinct()


def get_valid_user(user, entreprise):
    """
    Checks whether a user can receive a notification
    for the specified enterprise.
    """

    if user is None:
        return None

    if user.entreprise_id != entreprise.id_entreprise:
        return None

    if not user.is_active:
        return None

    return user


def merge_users(*user_sources):
    """
    Combines users from several QuerySets or lists
    without duplicates.
    """

    users_by_id = {}

    for source in user_sources:
        if source is None:
            continue

        for user in source:
            users_by_id[user.pk] = user

    return list(users_by_id.values())


def get_recipients_for_cost_validation(cout):
    """
    Recipients for cost workflow notifications.

    Includes:
    - Company administrators
    - Users with the cost validation permission
    """

    entreprise = cout.immobilisation.entreprise

    admins = get_company_admins(entreprise)

    validators = get_users_with_permission(
        entreprise=entreprise,
        permission_code="COUT_IMMOBILISATION_VALIDER",
    )

    recipients = merge_users(
        admins,
        validators,
    )

    return [
        user
        for user in recipients
        if get_valid_user(user, entreprise) is not None
    ]


def get_recipients_for_intervention(intervention):
    """
    Recipients for maintenance/intervention notifications.

    Includes:
    - Company administrators
    - The user who requested the intervention
    - Users who can modify interventions
    """

    entreprise = intervention.entreprise

    admins = get_company_admins(entreprise)

    intervention_managers = get_users_with_permission(
        entreprise=entreprise,
        permission_code="INTERVENTION_MODIFIER",
    )

    requester = intervention.demande_par

    recipients = merge_users(
        admins,
        intervention_managers,
        [requester],
    )

    return [
        user
        for user in recipients
        if get_valid_user(user, entreprise) is not None
    ]


def get_recipients_for_document(document):
    """
    Recipients for document notifications.

    Includes:
    - Company administrators
    - The user who added the document
    """

    entreprise = document.entreprise

    admins = get_company_admins(entreprise)

    creator = document.ajoute_par

    recipients = merge_users(
        admins,
        [creator],
    )

    return [
        user
        for user in recipients
        if get_valid_user(user, entreprise) is not None
    ]


def get_recipients_for_immobilisation(immobilisation):
    """
    Recipients for asset notifications.

    Includes:
    - Company administrators
    - The user who created the asset
    """

    entreprise = immobilisation.entreprise

    admins = get_company_admins(entreprise)

    creator = immobilisation.cree_par

    recipients = merge_users(
        admins,
        [creator],
    )

    return [
        user
        for user in recipients
        if get_valid_user(user, entreprise) is not None
    ]


def get_creator_for_cost(cout):
    """
    Returns the user who created the cost.
    """

    return cout.cree_par


def get_creator_for_document(document):
    """
    Returns the user who added the document.
    """

    return document.ajoute_par


def get_creator_for_intervention(intervention):
    """
    Returns the user who requested the intervention.
    """

    return intervention.demande_par


def get_creator_for_immobilisation(immobilisation):
    """
    Returns the user who created the asset.
    """

    return immobilisation.cree_par