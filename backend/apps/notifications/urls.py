from django.urls import path

from ..notifications.views import (
    NotificationListView,
    NotificationDetailView,
    NotificationReadView,
    NotificationUnreadView,
    NotificationReadAllView,
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