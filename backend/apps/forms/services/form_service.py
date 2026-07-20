from django.db import transaction #type: ignore
from django.utils import timezone #type: ignore
from rest_framework.exceptions import PermissionDenied

from apps.forms.models import Form, FormVersion
from apps.forms.services.schema_service import validate_schema

DEFAULT_SCHEMA = {"sections": []}


def _normalize_title(title):
    if title is None:
        return "Untitled form"
    trimmed = str(title).strip()
    return trimmed or "Untitled form"


def _get_or_create_draft(form):
    if form.draft_version_id:
        return form.draft_version
    draft = FormVersion.objects.create(
        form=form,
        version=0,
        status=FormVersion.Status.DRAFT,
        schema=DEFAULT_SCHEMA,
    )
    form.draft_version = draft
    form.save(update_fields=["draft_version"])
    return draft


def create_form(owner, title=None, description=None):
    with transaction.atomic():
        form = Form.objects.create(
            owner=owner,
            title=_normalize_title(title),
            description=description or "",
        )
        from apps.permissions.models import FormAccessSettings

        FormAccessSettings.objects.create(form=form)
        draft = FormVersion.objects.create(
            form=form,
            version=0,
            status=FormVersion.Status.DRAFT,
            schema=DEFAULT_SCHEMA,
        )
        form.draft_version = draft
        form.save(update_fields=["draft_version"])
    return form


def update_draft(form, title=None, description=None, schema=None, settings=None, is_template=None):
    draft = _get_or_create_draft(form)
    if schema is None:
        schema = draft.schema
    validate_schema(schema)

    with transaction.atomic():
        if title is not None:
            form.title = _normalize_title(title)
        if description is not None:
            form.description = description
        if settings is not None:
            form.settings = settings
        if is_template is not None:
            form.is_template = is_template
        form.save()

        draft.schema = schema
        draft.save(update_fields=["schema"])

    return form


def publish_form(form, user):
    if form.owner_id != getattr(user, "id", None):
        raise PermissionDenied("Only owners can publish this form.")

    draft = _get_or_create_draft(form)
    validate_schema(draft.schema)

    with transaction.atomic():
        published = FormVersion.objects.create(
            form=form,
            version=form.next_published_version(),
            status=FormVersion.Status.PUBLISHED,
            schema=draft.schema,
            published_at=timezone.now(),
        )
        form.published_version = published
        form.save(update_fields=["published_version"])

    return published


def clone_form(source_form, user):
    with transaction.atomic():
        new_form = Form.objects.create(
            owner=user,
            title=source_form.title,
            description=source_form.description,
            settings=source_form.settings,
        )
        from apps.permissions.models import FormAccessSettings

        FormAccessSettings.objects.create(form=new_form)
        
        # Get schema to clone
        if source_form.draft_version:
            schema = source_form.draft_version.schema
        elif source_form.published_version:
            schema = source_form.published_version.schema
        else:
            schema = DEFAULT_SCHEMA
            
        draft = FormVersion.objects.create(
            form=new_form,
            version=0,
            status=FormVersion.Status.DRAFT,
            schema=schema,
        )
        new_form.draft_version = draft
        new_form.save(update_fields=["draft_version"])
    return new_form
