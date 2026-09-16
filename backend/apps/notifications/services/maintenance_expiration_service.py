from datetime import timedelta

from django.utils import timezone

from ...notifications.models import Notification
from ...notifications.services.notification_service import (
    create_notification,
)
from ...notifications.services.recipient_service import (
    get_recipients_for_immobilisation,
)


def create_maintenance_notifications(days_before=30):
    """
    Creates notifications for immobilisations whose next maintenance is:
    - already overdue
    - planned within the specified number of days

    Only active immobilisations are checked.

    Returns the number of notifications created.
    """

    from ...immobilisations.models import Immobilisation

    today = timezone.localdate()
    limit_date = today + timedelta(days=days_before)

    immobilisations = Immobilisation.objects.filter(
        statut=Immobilisation.Statut.ACTIVE,
        date_prochaine_maintenance__isnull=False,
    ).select_related(
        "entreprise",
        "cree_par",
    )

    total_created = 0

    for immobilisation in immobilisations:
        maintenance_date = (
            immobilisation.date_prochaine_maintenance
        )

        if maintenance_date < today:
            niveau = Notification.Niveau.URGENT
            titre = "Maintenance en retard"
            message = (
                f'La maintenance de l’immobilisation '
                f'"{immobilisation.designation}" était prévue le '
                f"{maintenance_date}."
            )
            statut_maintenance = "en-retard"

        elif maintenance_date <= limit_date:
            niveau = Notification.Niveau.WARNING
            titre = "Maintenance bientôt prévue"
            message = (
                f'La prochaine maintenance de l’immobilisation '
                f'"{immobilisation.designation}" est prévue le '
                f"{maintenance_date}."
            )
            statut_maintenance = "bientot"

        else:
            continue

        recipients = get_recipients_for_immobilisation(
            immobilisation
        )

        notifications = create_notification(
            entreprise=immobilisation.entreprise,
            destinataires=recipients,
            type_notification=Notification.Type.MAINTENANCE,
            niveau=niveau,
            titre=titre,
            message=message,
            cle_unique=(
                f"immobilisation-"
                f"{immobilisation.id_immobilisation}-"
                f"maintenance-"
                f"{maintenance_date}-"
                f"{statut_maintenance}"
            ),
            immobilisation=immobilisation,
        )

        total_created += len(notifications)

    return total_created