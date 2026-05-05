from django.urls import path #type: ignore

from apps.permissions import views

urlpatterns = [
    path(
        "forms/<int:form_id>/settings/",
        views.AccessSettingsView.as_view(),
        name="permissions-settings",
    ),
    path(
        "forms/<int:form_id>/roles/",
        views.RoleListCreateView.as_view(),
        name="permissions-roles",
    ),
    path(
        "forms/<int:form_id>/roles/<int:user_id>/",
        views.RoleDeleteView.as_view(),
        name="permissions-roles-delete",
    ),
    path(
        "forms/<int:form_id>/tokens/",
        views.AccessTokenListCreateView.as_view(),
        name="permissions-tokens",
    ),
    path(
        "forms/<int:form_id>/tokens/<int:token_id>/revoke/",
        views.AccessTokenRevokeView.as_view(),
        name="permissions-tokens-revoke",
    ),
    path(
        "forms/<int:form_id>/tokens/<int:token_id>/rotate/",
        views.AccessTokenRotateView.as_view(),
        name="permissions-tokens-rotate",
    ),
]
