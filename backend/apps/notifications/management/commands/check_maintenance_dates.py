from django.core.management.base import BaseCommand

from ....notifications.services.maintenance_expiration_service import (
    create_maintenance_notifications,
)


class Command(BaseCommand):
    help = (
        "Crée les notifications pour les maintenances "
        "en retard ou bientôt prévues."
    )

    def handle(self, *args, **options):
        total_created = create_maintenance_notifications()

        self.stdout.write(
            self.style.SUCCESS(
                f"{total_created} notification(s) de maintenance créée(s)."
            )
        )