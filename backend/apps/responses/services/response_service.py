from django.db import transaction #type: ignore
from django.utils import timezone #type: ignore
from rest_framework import serializers

from apps.permissions.services import token_service
from apps.responses.models import FormResponseSettings, Response, ResponseSession
from apps.responses.services import validation_service


def get_published_version_or_error(form):
    if not form.published_version_id:
        raise serializers.ValidationError(
            {"detail": "Form has no published version.", "code": "form_not_published"}
        )
    return form.published_version


def get_or_create_settings(form):
    settings_obj, _created = FormResponseSettings.objects.get_or_create(form=form)
    return settings_obj


def get_or_create_session(form, form_version, user, session_uuid, token, ip, user_agent):
    if not session_uuid:
        raise serializers.ValidationError({"session_uuid": "This field is required."})

    access_token_hash = token_service.hash_token(token) if token else None
    session, created = ResponseSession.objects.get_or_create(
        form=form,
        session_uuid=session_uuid,
        access_token_hash=access_token_hash,
        defaults={
            "form_version": form_version,
            "user": user if getattr(user, "is_authenticated", False) else None,
            "ip_address": ip,
            "user_agent": user_agent or "",
        },
    )
    if not created:
        if form_version and session.form_version_id != form_version.id:
            session.form_version = form_version
        if user and getattr(user, "is_authenticated", False) and session.user_id != user.id:
            session.user = user
        if ip:
            session.ip_address = ip
        if user_agent:
            session.user_agent = user_agent
        session.save()
    return session


def get_user_draft(form, user):
    if not user or not getattr(user, "is_authenticated", False):
        return None
    return Response.objects.filter(
        form=form,
        user=user,
        status=Response.Status.DRAFT,
    ).first()


def save_draft(form, user, form_version, answers, session):
    if not user or not getattr(user, "is_authenticated", False):
        raise serializers.ValidationError(
            {"detail": "Authentication required to save drafts.", "code": "auth_required"}
        )

    response, created = Response.objects.get_or_create(
        form=form,
        user=user,
        status=Response.Status.DRAFT,
        defaults={
            "form_version": form_version,
            "answers": answers or {},
            "session": session,
        },
    )
    if not created:
        response.form_version = form_version
        response.answers = answers or {}
        response.session = session
        response.save()
    return response


def start_attempt(form, user, form_version, session):
    if user and getattr(user, "is_authenticated", False):
        Response.objects.filter(
            form=form,
            user=user,
            status=Response.Status.DRAFT,
        ).delete()
        return Response.objects.create(
            form=form,
            form_version=form_version,
            user=user,
            session=session,
            status=Response.Status.DRAFT,
            answers={},
        )
    return session


def submit_response(form, user, form_version, session, answers):
    settings_obj = get_or_create_settings(form)
    if not settings_obj.allow_multiple_submissions:
        if user and getattr(user, "is_authenticated", False):
            if Response.objects.filter(
                form=form,
                user=user,
                status=Response.Status.SUBMITTED,
            ).exists():
                raise serializers.ValidationError(
                    {
                        "detail": "Multiple submissions are not allowed for this form.",
                        "code": "multiple_submissions_not_allowed",
                    }
                )
        else:
            if not session:
                raise serializers.ValidationError(
                    {"detail": "Session is required.", "code": "session_required"}
                )
            if Response.objects.filter(
                form=form,
                session=session,
                status=Response.Status.SUBMITTED,
            ).exists():
                raise serializers.ValidationError(
                    {
                        "detail": "Multiple submissions are not allowed for this form.",
                        "code": "multiple_submissions_not_allowed",
                    }
                )

    validation_service.validate_answers(form_version.schema, answers)

    with transaction.atomic():
        response = Response.objects.create(
            form=form,
            form_version=form_version,
            user=user if getattr(user, "is_authenticated", False) else None,
            session=session,
            status=Response.Status.SUBMITTED,
            answers=answers or {},
            submitted_at=timezone.now(),
        )
        if user and getattr(user, "is_authenticated", False):
            Response.objects.filter(
                form=form,
                user=user,
                status=Response.Status.DRAFT,
            ).delete()
    return response
