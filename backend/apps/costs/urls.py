from django.urls import path

from .views import (
    CoutImmobilisationListCreateView,
    CoutImmobilisationDetailView,
    CoutImmobilisationWorkflowView,
)


urlpatterns = [
    # GET  /api/v1/costs/
    # POST /api/v1/costs/
    path(
        "",
        CoutImmobilisationListCreateView.as_view(),
        name="cout-immobilisation-list-create",
    ),

    # GET    /api/v1/costs/<id_cout>/
    # PUT    /api/v1/costs/<id_cout>/
    # PATCH  /api/v1/costs/<id_cout>/
    # DELETE /api/v1/costs/<id_cout>/
    path(
        "<int:id_cout>/",
        CoutImmobilisationDetailView.as_view(),
        name="cout-immobilisation-detail",
    ),
    #LIFECYCLE
    path(
    "<int:id_cout>/submit/",
    CoutImmobilisationWorkflowView.as_view(),
    {"action": "submit"},
    name="cout-immobilisation-submit",
),

    path(
        "<int:id_cout>/validate/",
        CoutImmobilisationWorkflowView.as_view(),
        {"action": "validate"},
        name="cout-immobilisation-validate",
    ),

    path(
        "<int:id_cout>/reject/",
        CoutImmobilisationWorkflowView.as_view(),
        {"action": "reject"},
        name="cout-immobilisation-reject",
    ),
]