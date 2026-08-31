from django.db import migrations


def seed_company_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")

    permissions = [
        {
            "code": "ENTREPRISE_CONSULTER",
            "nom": "Consulter les informations de l'entreprise",
        },
        {
            "code": "ENTREPRISE_MODIFIER",
            "nom": "Modifier les informations de l'entreprise",
        },
    ]

    for permission in permissions:
        Permission.objects.get_or_create(
            code=permission["code"],
            defaults={
                "nom": permission["nom"],
            },
        )


def reverse_company_permissions(apps, schema_editor):
    Permission = apps.get_model("accounts", "Permission")

    Permission.objects.filter(
        code__in=[
            "ENTREPRISE_CONSULTER",
            "ENTREPRISE_MODIFIER",
        ]
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_seed_initial_permissions"),
    ]

    operations = [
        migrations.RunPython(
            seed_company_permissions,
            reverse_company_permissions,
        ),
    ]