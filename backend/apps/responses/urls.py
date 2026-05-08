from django.urls import path #type: ignore

from apps.responses import views

urlpatterns = [
    path(
        "forms/<int:form_id>/draft/",
        views.DraftView.as_view(),
        name="responses-draft",
    ),
    path(
        "forms/<int:form_id>/submit/",
        views.SubmitView.as_view(),
        name="responses-submit",
    ),
    path(
        "forms/<int:form_id>/attempts/",
        views.AttemptsView.as_view(),
        name="responses-attempts",
    ),
    path(
        "forms/<int:form_id>/",
        views.ResponseListView.as_view(),
        name="responses-list",
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
