from django.urls import path

from ..notifications.views import (
    NotificationListView,
    NotificationDetailView,
    NotificationReadView,
    NotificationUnreadView,
    NotificationReadAllView,
    NotificationDeleteAllReadView,
)


urlpatterns = [
    path(
        "",
        NotificationListView.as_view(),
        name="notification-list",
    ),

    path(
        "read-all/",
        NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),

    path(
        "delete-read/",
        NotificationDeleteAllReadView.as_view(),
        name="notification-delete-read",
    ),

    path(
        "<int:pk>/read/",
        NotificationReadView.as_view(),
        name="notification-read",
    ),

    path(
        "<int:pk>/unread/",
        NotificationUnreadView.as_view(),
        name="notification-unread",
    ),

    path(
        "<int:pk>/",
        NotificationDetailView.as_view(),
        name="notification-detail",
    ),
]