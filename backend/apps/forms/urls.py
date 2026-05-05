from django.urls import include, path #type: ignore
from rest_framework.routers import DefaultRouter

from apps.forms.views import FormViewSet

router = DefaultRouter()
router.register(r"", FormViewSet, basename="forms")

urlpatterns = [
    path("", include(router.urls)),
]
