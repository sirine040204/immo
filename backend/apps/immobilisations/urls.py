from django.urls import path

from .views import (
    FamilleDetailView,
    FamilleListCreateView,
    FamilleArchiveView,
    FamilleRestoreView,
)


urlpatterns = [
    path(
        "familles/",
        FamilleListCreateView.as_view(),
        name="famille-list-create",
    ),
    ##list,update and delete a single family
    # URL pour supprimer une famille (qui doit d'abord être archivée)
    path(
        "familles/<int:famille_id>/",
        FamilleDetailView.as_view(),
        name="famille-detail",
    ),
    path(
    "familles/<int:famille_id>/archive/",
    FamilleArchiveView.as_view(),
    name="famille-archive",
),
    path(
    "familles/<int:famille_id>/restore/",
    FamilleRestoreView.as_view(),
    name="famille-restore",
),
]