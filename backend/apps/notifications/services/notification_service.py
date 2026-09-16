# apps/notifications/services/notification_service.py

from django.db import transaction

from ...notifications.models import Notification

from .recipient_service import get_valid_user


def build_recipient_unique_key(base_key, user):
    """
    Builds a unique key for one event and one recipient.

    Example:
        COST-5-VALIDATED-user-12
    """

    return f"{base_key}-user-{user.pk}"


@transaction.atomic
def create_notification(
    entreprise,
    destinataires,
    type_notification,
    niveau,
    titre,
    message,
    cle_unique,
    immobilisation=None,
    document=None,
    intervention=None,
    cout=None,
):
    """
    Creates one notification per recipient.

    The recipient ID is added to cle_unique because
    Notification.cle_unique is globally unique.
    """

    notifications_created = []

    for destinataire in destinataires:

        destinataire = get_valid_user(
            user=destinataire,
            entreprise=entreprise,
        )

        if destinataire is None:
            continue

        recipient_unique_key = build_recipient_unique_key(
            base_key=cle_unique,
            user=destinataire,
        )

        notification, created = Notification.objects.get_or_create(
            cle_unique=recipient_unique_key,
            defaults={
                "entreprise": entreprise,
                "destinataire": destinataire,
                "type_notification": type_notification,
                "niveau": niveau,
                "titre": titre,
                "message": message,
                "immobilisation": immobilisation,
                "document": document,
                "intervention": intervention,
                "cout": cout,
                "email_envoye": False,
            },
        )

        if created:
            notifications_created.append(notification)

    return notifications_created


def create_single_notification(
    entreprise,
    destinataire,
    type_notification,
    niveau,
    titre,
    message,
    cle_unique,
    immobilisation=None,
    document=None,
    intervention=None,
    cout=None,
):
    """
    Convenience function for notifying one user.
    """

    return create_notification(
        entreprise=entreprise,
        destinataires=[destinataire],
        type_notification=type_notification,
        niveau=niveau,
        titre=titre,
        message=message,
        cle_unique=cle_unique,
        immobilisation=immobilisation,
        document=document,
        intervention=intervention,
        cout=cout,
    )