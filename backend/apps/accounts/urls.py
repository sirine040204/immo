from django.urls import path

from .views import CompanyAdminRegistrationView


urlpatterns = [
    path(
        "register/",
        CompanyAdminRegistrationView.as_view(),
        name="company-admin-register",
    ),
]