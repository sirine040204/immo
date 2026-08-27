from django.urls import path

from .views import (
    CompanyAdminRegistrationView,
    LoginView,
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
]