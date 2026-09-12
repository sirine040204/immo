from django.db import transaction

from .models import (
    Intervention,
    SuiviEtapeIntervention,
)


@transaction.atomic
def generer_suivis_depuis_modele(intervention):
    """
    Génère les suivis d'étapes à partir des étapes actives
    du modèle d'entretien.
    """

    # No model: nothing to generate
    if intervention.modele_entretien_id is None:
        return []

    # Avoid generating duplicates
    if intervention.suivis_etapes.exists():
        return list(intervention.suivis_etapes.all())

    etapes = (
        intervention.modele_entretien.etapes
        .filter(statut="ACTIF")
        .order_by("ordre", "id")
    )

    suivis = []

    for etape in etapes:
        suivi = SuiviEtapeIntervention.objects.create(
            intervention=intervention,
            etape_entretien=etape,
            libelle=etape.libelle,
            description=etape.description,
            ordre=etape.ordre,
            obligatoire=etape.obligatoire,
            statut=SuiviEtapeIntervention.Statut.A_VALIDER,
            commentaire="",
            date_validation=None,
            validee_par=None,
        )

        suivis.append(suivi)

    return suivis