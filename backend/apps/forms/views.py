from django.db.models import Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404

from apps.forms.models import Form
from apps.forms.permissions import FormAccessPermission, FormOwnerPermission, get_editor_form_ids
from apps.forms.serializers import (
    FormCreateSerializer,
    FormDetailSerializer,
    FormListSerializer,
    FormUpdateSerializer,
    PublishSerializer,
)
from apps.forms.services import form_service


class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.select_related("draft_version", "published_version")
    permission_classes = [IsAuthenticated, FormAccessPermission]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Form.objects.none()
        editor_form_ids = get_editor_form_ids(user)
        if editor_form_ids:
            return self.queryset.filter(Q(owner=user) | Q(id__in=editor_form_ids)).distinct()
        return self.queryset.filter(owner=user)

    def get_object(self):
        queryset = self.queryset
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = get_object_or_404(queryset, **{self.lookup_field: lookup_value})
        self.check_object_permissions(self.request, obj)
        return obj

    def get_permissions(self):
        if self.action in {"destroy", "publish"}:
            return [IsAuthenticated(), FormOwnerPermission()]
        return [IsAuthenticated(), FormAccessPermission()]

    def get_serializer_class(self):
        if self.action == "list":
            return FormListSerializer
        if self.action == "create":
            return FormCreateSerializer
        if self.action in {"update", "partial_update"}:
            return FormUpdateSerializer
        if self.action == "publish":
            return PublishSerializer
        return FormDetailSerializer

    def list(self, request, *args, **kwargs):
        queryset = (
            Form.objects.filter(owner=request.user)
            .select_related("draft_version", "published_version")
        )
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def publish(self, request, *args, **kwargs):
        form = self.get_object()
        published = form_service.publish_form(form, request.user)
        serializer = PublishSerializer(published)
        return Response(serializer.data, status=status.HTTP_200_OK)