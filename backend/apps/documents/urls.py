from django.urls import path

from .views import (
    TypeDocumentListCreateView,
    TypeDocumentDetailView,
    TypeDocumentArchiveView,
    TypeDocumentRestoreView,
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
]