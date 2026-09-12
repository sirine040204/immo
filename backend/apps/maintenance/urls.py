from django.urls import path

from .views import (
    TypeEntretienListCreateView,
    TypeEntretienDetailView,
    TypeEntretienArchiveView,
    TypeEntretienRestoreView,
    TypeEntretienDeleteView,
    ModeleEntretienListCreateView,
    ModeleEntretienDetailView,
    ModeleEntretienArchiveView,
    ModeleEntretienRestoreView,
    ModeleEntretienDeleteView,
    EtapeEntretienListCreateView,
    EtapeEntretienDetailView,
    EtapeEntretienArchiveView,
    EtapeEntretienRestoreView,
    EtapeEntretienDeleteView,
    InterventionListCreateView,
    InterventionDetailView,
    InterventionStatutView,
    SuiviEtapeInterventionListCreateView,
    SuiviEtapeInterventionDetailView,
)



urlpatterns = [
    #type entretien urls
    path(
        "types-entretien/",
        TypeEntretienListCreateView.as_view(),
        name="type-entretien-list-create",
    ),
        path(
        "types-entretien/<int:type_entretien_id>/",
        TypeEntretienDetailView.as_view(),
        name="type-entretien-detail",
    ),
        path(
        "types-entretien/<int:type_entretien_id>/archive/",
        TypeEntretienArchiveView.as_view(),
        name="type-entretien-archive",
    ),
    path(
        "types-entretien/<int:type_entretien_id>/restore/",
        TypeEntretienRestoreView.as_view(),
        name="type-entretien-restore",
    ),
    path(
        "types-entretien/<int:type_entretien_id>/delete/",
        TypeEntretienDeleteView.as_view(),
        name="type-entretien-delete",
    ),
    #modele entretien urls
    path(
    "modeles-entretien/",
    ModeleEntretienListCreateView.as_view(),
    name="modele-entretien-list-create",
    ),

    path(
        "modeles-entretien/<int:modele_entretien_id>/",
        ModeleEntretienDetailView.as_view(),
        name="modele-entretien-detail",
    ),

    path(
        "modeles-entretien/<int:modele_entretien_id>/archive/",
        ModeleEntretienArchiveView.as_view(),
        name="modele-entretien-archive",
    ),

    path(
        "modeles-entretien/<int:modele_entretien_id>/restore/",
        ModeleEntretienRestoreView.as_view(),
        name="modele-entretien-restore",
    ),

    path(
        "modeles-entretien/<int:modele_entretien_id>/delete/",
        ModeleEntretienDeleteView.as_view(),
        name="modele-entretien-delete",
    ),
    #etape entretien urls
    path(
        "etapes-entretien/",
        EtapeEntretienListCreateView.as_view(),
        name="etape-entretien-list-create",
    ),
    path(
        "etapes-entretien/<int:etape_entretien_id>/",
        EtapeEntretienDetailView.as_view(),
        name="etape-entretien-detail",
    ),
    path(
        "etapes-entretien/<int:etape_entretien_id>/archive/",
        EtapeEntretienArchiveView.as_view(),
        name="etape-entretien-archive",
    ),
    path(
        "etapes-entretien/<int:etape_entretien_id>/restore/",
        EtapeEntretienRestoreView.as_view(),
        name="etape-entretien-restore",
    ),
    path(
        "etapes-entretien/<int:etape_entretien_id>/delete/",
        EtapeEntretienDeleteView.as_view(),
        name="etape-entretien-delete",
    ),
    #intervention urls
    path(
        "interventions/",
        InterventionListCreateView.as_view(),
        name="intervention-list-create",
    ),
    path(
        "interventions/<int:pk>/",
        InterventionDetailView.as_view(),
        name="intervention-detail",
    ),
    #intervention status urls
    path(
        "interventions/<int:pk>/statut/",
        InterventionStatutView.as_view(),
        name="intervention-statut",
    ),
        # suivi etape intervention urls
    path(
        "suivis-etapes/",
        SuiviEtapeInterventionListCreateView.as_view(),
        name="suivi-etape-intervention-list-create",
    ),

    path(
        "suivis-etapes/<int:pk>/",
        SuiviEtapeInterventionDetailView.as_view(),
        name="suivi-etape-intervention-detail",
    ),
]