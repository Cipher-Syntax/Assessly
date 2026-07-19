from django.urls import path #type: ignore

from apps.responses import views

urlpatterns = [
    path(
        "forms/<uuid:form_id>/draft/",
        views.DraftView.as_view(),
        name="responses-draft",
    ),
    path(
        "forms/<uuid:form_id>/submit/",
        views.SubmitView.as_view(),
        name="responses-submit",
    ),
    path(
        "forms/<uuid:form_id>/attempts/",
        views.AttemptsView.as_view(),
        name="responses-attempts",
    ),
    path(
        "forms/<uuid:form_id>/",
        views.ResponseListView.as_view(),
        name="responses-list",
    ),
    path(
        "forms/<uuid:form_id>/export/csv/",
        views.ResponseExportView.as_view(),
        name="responses-export-csv",
    ),
    path(
        "<int:response_id>/",
        views.ResponseDetailView.as_view(),
        name="responses-detail",
    ),
    path(
        "sessions/<int:session_id>/events/",
        views.ResponseEventView.as_view(),
        name="responses-events",
    ),
]
