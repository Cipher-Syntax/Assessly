from importlib import import_module

from rest_framework.permissions import BasePermission

ROLE_OWNER = "owner"
ROLE_EDITOR = "editor"


def _load_permissions_service():
    try:
        return import_module("apps.permissions.services.access_service")
    except Exception:
        return None


def resolve_form_role(user, form):
    service = _load_permissions_service()
    if not service:
        return None
    get_role = getattr(service, "get_form_role", None)
    if not callable(get_role):
        return None
    try:
        return get_role(user, form)
    except Exception:
        return None


def get_editor_form_ids(user):
    service = _load_permissions_service()
    if not service:
        return []
    get_ids = getattr(service, "get_editor_form_ids", None)
    if not callable(get_ids):
        return []
    try:
        return list(get_ids(user))
    except Exception:
        return []


class FormAccessPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False
        if obj.owner_id == user.id:
            return True
        role = resolve_form_role(user, obj)
        return role in {ROLE_OWNER, ROLE_EDITOR}


class FormOwnerPermission(BasePermission):
    def has_object_permission(self, request, view, obj):
        user = getattr(request, "user", None)
        return bool(user and user.is_authenticated and obj.owner_id == user.id)
