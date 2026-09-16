from datetime import timedelta

from django.utils import timezone

from ...notifications.models import Notification
from ...notifications.services.notification_service import create_notification
from ...notifications.services.recipient_service import (
    get_recipients_for_document,
)


def create_document_expiration_notifications(days_before=30):
    """
    Creates notifications for active documents that are:
    - already expired
    - expiring within the specified number of days

    Returns the number of notifications created.
    """

    today = timezone.localdate()
    limit_date = today + timedelta(days=days_before)

    from ...documents.models import Document

    documents = Document.objects.filter(
        statut=Document.Statut.ACTIF,
        date_fin_validite__isnull=False,
        type_document__a_echeance=True,
    ).select_related(
        "entreprise",
        "type_document",
        "ajoute_par",
    )

    total_created = 0

    for document in documents:
        expiration_date = document.date_fin_validite

        if expiration_date < today:
            niveau = Notification.Niveau.URGENT
            titre = "Document expiré"
            message = (
                f'Le document "{document.nom}" est expiré depuis '
                f"{expiration_date}."
            )
            statut_expiration = "expire"

        elif expiration_date <= limit_date:
            niveau = Notification.Niveau.WARNING
            titre = "Document bientôt expiré"
            message = (
                f'Le document "{document.nom}" expirera le '
                f"{expiration_date}."
            )
            statut_expiration = "bientot"

        else:
            continue

        recipients = get_recipients_for_document(document)

        notifications = create_notification(
            entreprise=document.entreprise,
            destinataires=recipients,
            type_notification=Notification.Type.DOCUMENT_EXPIRATION,
            niveau=niveau,
            titre=titre,
            message=message,
            cle_unique=(
                f"document-{document.id}-expiration-"
                f"{expiration_date}-{statut_expiration}"
            ),
            document=document,
        )

        total_created += len(notifications)

    return total_created