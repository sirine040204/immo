from django.db import migrations


def seed_permissions(apps, schema_editor):

    Permission = apps.get_model("accounts", "Permission")

    permissions = [
        {
            "code": "ROLE_CONSULTER",
            "nom": "Consulter les rôles",
            "description": "Permet de consulter les rôles de son entreprise.",
        },
        {
            "code": "ROLE_CREER",
            "nom": "Créer un rôle",
            "description": "Permet de créer un rôle dans son entreprise.",
        },
        {
            "code": "ROLE_MODIFIER",
            "nom": "Modifier un rôle",
            "description": "Permet de modifier un rôle de son entreprise.",
        },
        {
            "code": "ROLE_ARCHIVER",
            "nom": "Archiver un rôle",
            "description": "Permet d'archiver un rôle de son entreprise.",
        },
        {
            "code": "EMPLOYE_CONSULTER",
            "nom": "Consulter les employés",
            "description": "Permet de consulter les employés de son entreprise.",
        },
        {
            "code": "EMPLOYE_CREER",
            "nom": "Créer un employé",
            "description": "Permet d'inviter un employé dans son entreprise.",
        },
        {
            "code": "EMPLOYE_MODIFIER",
            "nom": "Modifier un employé",
            "description": "Permet de modifier les informations autorisées d'un employé.",
        },
        {
            "code": "EMPLOYE_ARCHIVER",
            "nom": "Archiver un employé",
            "description": "Permet d'archiver un employé de son entreprise.",
        },
    ]

    for permission_data in permissions:
        Permission.objects.get_or_create(
            code=permission_data["code"],
            defaults={
                "nom": permission_data["nom"],
                "description": permission_data["description"],
            },
        )


def remove_permissions(apps, schema_editor):

    Permission = apps.get_model("accounts", "Permission")

    codes = [
        "ROLE_CONSULTER",
        "ROLE_CREER",
        "ROLE_MODIFIER",
        "ROLE_ARCHIVER",
        "EMPLOYE_CONSULTER",
        "EMPLOYE_CREER",
        "EMPLOYE_MODIFIER",
        "EMPLOYE_ARCHIVER",
    ]

    Permission.objects.filter(
        code__in=codes
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0005_alter_role_entreprise"),
    ]

    operations = [
        migrations.RunPython(
            seed_permissions,
            reverse_code=remove_permissions,
        ),
    ]