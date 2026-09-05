from . import views
from django.urls import path
from .views import (
    FamilleDetailView,
    FamilleListCreateView,
    FamilleArchiveView,
    FamilleRestoreView,
    AttributDynamiqueListCreateView,
    AttributDynamiqueDetailView,
    AttributDynamiqueArchiveView,
    AttributDynamiqueRestoreView,
)


urlpatterns = [
    #urls pour les familles
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

    #urls pour les attributs dynamiques
    path(
    "attributs/",
    AttributDynamiqueListCreateView.as_view(),
    name="attribut-list-create",
),
#for get details,patch and delete attribut dynamique
    path(
    "attributs/<int:attribut_id>/",
    AttributDynamiqueDetailView.as_view(),
    name="attribut-detail",
),
    path(
        "attributs/<int:attribut_id>/archive/",
        AttributDynamiqueArchiveView.as_view(),
        name="attribut-archive",
    ),
    path(
    "attributs/<int:attribut_id>/restore/",
    AttributDynamiqueRestoreView.as_view(),
    name="attribut-restore",
),

    #urls pour les options d'attributs dynamiques (list)
    path(
        "attributs/<int:attribut_id>/options/",
        views.OptionAttributListCreateView.as_view(),
        name="options-attribut",
    ),

    path(
        "attributs/<int:attribut_id>/options/<int:option_id>/",
        views.OptionAttributDetailView.as_view(),
        name="option-attribut-detail",
    ),

    path(
        "attributs/<int:attribut_id>/options/<int:option_id>/archive/",
        views.ArchiverOptionAttributView.as_view(),
        name="archiver-option-attribut",
    ),

    path(
        "attributs/<int:attribut_id>/options/<int:option_id>/restore/",
        views.RestaurerOptionAttributView.as_view(),
        name="restaurer-option-attribut",
    ),
]