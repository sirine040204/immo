from django.urls import path

from .views import (
    CompanyAdminRegistrationView,
    LoginView,
    CompanyApprovalView,
    EmployeeInvitationView,
    EmployeeActivationView,
    RolePermissionCreateView,
    EmployeeListView,
    RoleListCreateView,
    RoleDetailView,
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

    path(
    "employees/invite/",
    EmployeeInvitationView.as_view(),
    name="employee-invite",
    ),
    path(
    "employees/activate/",
    EmployeeActivationView.as_view(),
    name="employee-activate",
    ),
    path(
    "roles/<int:role_id>/permissions/",
    RolePermissionCreateView.as_view(),
    name="role-permission-create",
),
    path(
        "employees/",
        EmployeeListView.as_view(),
        name="employee-list",
),
    path(
        "roles/",
        RoleListCreateView.as_view(),
        name="role-list-create",
    ),
    path(
        "roles/<int:role_id>/",
        RoleDetailView.as_view(),
        name="role-detail",
    ),
    
]
