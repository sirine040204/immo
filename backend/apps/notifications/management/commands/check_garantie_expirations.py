from django.core.management.base import BaseCommand

from ....notifications.services.garantie_expiration_service import (
    create_garantie_expiration_notifications,
)


class Command(BaseCommand):
    help = (
        "Crée les notifications pour les garanties expirées "
        "ou bientôt expirées."
    )

    def handle(self, *args, **options):
        total_created = create_garantie_expiration_notifications()

        self.stdout.write(
            self.style.SUCCESS(
                f"{total_created} notification(s) de garantie créée(s)."
            )
        )