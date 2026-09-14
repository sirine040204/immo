from django.urls import path

from .views import (
    TypeDocumentListCreateView,
    TypeDocumentDetailView,
    TypeDocumentArchiveView,
    TypeDocumentRestoreView,
    DocumentListCreateView,
    DocumentDetailView,
    DocumentArchiveView,
    DocumentRestoreView,
    TypeDocumentFamilleListCreateView,
    TypeDocumentFamilleDetailView,
    DocumentDownloadView,
    DocumentExpirationView,
)


urlpatterns = [
    #type document
    path(
        "types/",
        TypeDocumentListCreateView.as_view(),
        name="type-document-list-create",
    ),

    path(
        "types/<int:type_document_id>/",
        TypeDocumentDetailView.as_view(),
        name="type-document-detail",
    ),

    path(
        "types/<int:type_document_id>/archive/",
        TypeDocumentArchiveView.as_view(),
        name="type-document-archive",
    ),

    path(
        "types/<int:type_document_id>/restore/",
        TypeDocumentRestoreView.as_view(),
        name="type-document-restore",
    ),
    #document
    path(
        "",
        DocumentListCreateView.as_view(),
        name="document-list-create"
    ),

    path(
        "<int:document_id>/",
        DocumentDetailView.as_view(),
        name="document-detail"
    ),

    path(
        "<int:document_id>/archive/",
        DocumentArchiveView.as_view(),
        name="document-archive"
    ),

    path(
        "<int:document_id>/restore/",
        DocumentRestoreView.as_view(),
        name="document-restore"
    ),
    # type document famille

    path(
        "types-familles/",
        TypeDocumentFamilleListCreateView.as_view(),
        name="type-document-famille-list-create",
    ),

    path(
        "types-familles/<int:type_document_famille_id>/",
        TypeDocumentFamilleDetailView.as_view(),
        name="type-document-famille-detail",
    ),
    # document download
    path(
        "<int:id>/download/",
        DocumentDownloadView.as_view(),
        name="document-download",
    ),
    # document expiration
    path(
    "expiration/",
    DocumentExpirationView.as_view(),
    name="document-expiration",
),
]