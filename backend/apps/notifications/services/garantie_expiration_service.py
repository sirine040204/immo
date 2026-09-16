from datetime import timedelta

from django.utils import timezone

from ...notifications.models import Notification
from ...notifications.services.notification_service import (
    create_notification,
)
from ...notifications.services.recipient_service import (
    get_recipients_for_immobilisation,
)


def create_garantie_expiration_notifications(days_before=30):
    """
    Creates notifications for active immobilisations whose warranty is:
    - already expired
    - expiring within the specified number of days

    Returns the number of notifications created.
    """

    from ...immobilisations.models import Immobilisation

    today = timezone.localdate()
    limit_date = today + timedelta(days=days_before)

    immobilisations = Immobilisation.objects.filter(
        statut=Immobilisation.Statut.ACTIVE,
        date_fin_garantie__isnull=False,
    ).select_related(
        "entreprise",
        "cree_par",
    )

    total_created = 0

    for immobilisation in immobilisations:
        garantie_date = immobilisation.date_fin_garantie

        if garantie_date < today:
            niveau = Notification.Niveau.URGENT
            titre = "Garantie expirée"
            message = (
                f'La garantie de l’immobilisation '
                f'"{immobilisation.designation}" est expirée depuis '
                f"{garantie_date}."
            )
            statut_garantie = "expiree"

        elif garantie_date <= limit_date:
            niveau = Notification.Niveau.WARNING
            titre = "Garantie bientôt expirée"
            message = (
                f'La garantie de l’immobilisation '
                f'"{immobilisation.designation}" expirera le '
                f"{garantie_date}."
            )
            statut_garantie = "bientot"

        else:
            continue

        recipients = get_recipients_for_immobilisation(
            immobilisation
        )

        notifications = create_notification(
            entreprise=immobilisation.entreprise,
            destinataires=recipients,
            type_notification=(
                Notification.Type.GARANTIE_EXPIRATION
            ),
            niveau=niveau,
            titre=titre,
            message=message,
            cle_unique=(
                f"immobilisation-"
                f"{immobilisation.id_immobilisation}-"
                f"garantie-"
                f"{garantie_date}-"
                f"{statut_garantie}"
            ),
            immobilisation=immobilisation,
        )

        total_created += len(notifications)

    return total_created