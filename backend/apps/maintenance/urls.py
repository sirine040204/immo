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
]