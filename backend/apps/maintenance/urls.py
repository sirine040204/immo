from django.urls import path

from .views import (
    TypeEntretienListCreateView,
    TypeEntretienDetailView,
    TypeEntretienArchiveView,
    TypeEntretienRestoreView,
    TypeEntretienDeleteView,
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
]