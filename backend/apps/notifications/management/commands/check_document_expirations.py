from django.core.management.base import BaseCommand

from ....notifications.services.document_expiration_service import (
    create_document_expiration_notifications,
)


class Command(BaseCommand):
    help = "Create notifications for expired or soon-to-expire documents."

    def handle(self, *args, **options):
        total_created = create_document_expiration_notifications(
            days_before=30
        )

        self.stdout.write(
            self.style.SUCCESS(
                f"{total_created} notification(s) created."
            )
        )