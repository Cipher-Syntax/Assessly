from apps.permissions.models import FormAccessSettings, FormRole
from apps.permissions.services import role_service, token_service


def get_request_token(request):
    header_token = request.headers.get("X-Form-Access-Token")
    if header_token:
        return header_token
    return request.query_params.get("token")


def _get_or_create_access_settings(form):
    settings_obj, _created = FormAccessSettings.objects.get_or_create(form=form)
    return settings_obj


def resolve_access(user, form, scope, token=None):
    if user and getattr(user, "is_authenticated", False) and form.owner_id == user.id:
        return True

    role = role_service.get_role(form, user)
    if role == scope:
        return True

    access_settings = _get_or_create_access_settings(form)
    if scope == FormRole.Role.RESPONDER:
        if access_settings.responder_access_mode == FormAccessSettings.ResponderAccessMode.PUBLIC:
            return True
        if access_settings.responder_access_mode == FormAccessSettings.ResponderAccessMode.LINK:
            return token_service.validate_token(form, scope, token)
    if scope == FormRole.Role.EDITOR:
        if access_settings.editor_access_mode == FormAccessSettings.EditorAccessMode.LINK:
            return token_service.validate_token(form, scope, token)

    return False


def get_form_role(user, form):
    if user and getattr(user, "is_authenticated", False) and form.owner_id == user.id:
        return "owner"
    return role_service.get_role(form, user)


def get_editor_form_ids(user):
    if not user or not getattr(user, "is_authenticated", False):
        return []
    return list(
        FormRole.objects.filter(user=user, role=FormRole.Role.EDITOR)
        .values_list("form_id", flat=True)
    )
