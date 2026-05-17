from django.urls import include, path #type: ignore
from rest_framework.routers import DefaultRouter

from apps.forms.views import FormPublicView, FormViewSet

router = DefaultRouter()
router.register(r"", FormViewSet, basename="forms")

urlpatterns = [
    path("<int:form_id>/public/", FormPublicView.as_view(), name="forms-public"),
    path("", include(router.urls)),
]
