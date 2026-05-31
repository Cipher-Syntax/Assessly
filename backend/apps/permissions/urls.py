from django.urls import path #type: ignore

from apps.permissions import views

urlpatterns = [
    path(
        "forms/<uuid:form_id>/settings/",
        views.AccessSettingsView.as_view(),
        name="permissions-settings",
    ),
    path(
        "forms/<uuid:form_id>/lookup/",
        views.UserLookupView.as_view(),
        name="permissions-lookup",
    ),
    path(
        "forms/<uuid:form_id>/roles/",
        views.RoleListCreateView.as_view(),
        name="permissions-roles",
    ),
    path(
        "forms/<uuid:form_id>/roles/<int:user_id>/",
        views.RoleDeleteView.as_view(),
        name="permissions-roles-delete",
    ),
    path(
        "forms/<uuid:form_id>/tokens/",
        views.AccessTokenListCreateView.as_view(),
        name="permissions-tokens",
    ),
    path(
        "forms/<uuid:form_id>/tokens/<int:token_id>/revoke/",
        views.AccessTokenRevokeView.as_view(),
        name="permissions-tokens-revoke",
    ),
    path(
        "forms/<uuid:form_id>/tokens/<int:token_id>/rotate/",
        views.AccessTokenRotateView.as_view(),
        name="permissions-tokens-rotate",
    ),
]
