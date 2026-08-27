from django.urls import path

from .views import (
    CompanyAdminRegistrationView,
    LoginView,
    CompanyApprovalView,
)


urlpatterns = [
    path(
        "register/",
        CompanyAdminRegistrationView.as_view(),
        name="company-admin-register",
    ),

    path(
        "login/",
        LoginView.as_view(),
        name="login",
    ),
    path(
        "companies/<int:company_id>/approve/",
        CompanyApprovalView.as_view(),
        name="company-approve",
    ),
]
