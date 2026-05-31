from rest_framework import status
from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.forms.models import Form
from apps.forms.permissions import get_request_token, resolve_access
from apps.permissions.models import FormRole
from apps.permissions.services import token_service
from apps.responses.models import Response as FormResponse
from apps.responses.models import ResponseSession
from apps.responses.serializers import (
	ResponseAttemptSerializer,
	ResponseDetailSerializer,
	ResponseDraftSerializer,
	ResponseEventSerializer,
	ResponseListSerializer,
	ResponseSubmitSerializer,
)
from apps.responses.services import event_service, response_service


def _get_client_ip(request):
	forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
	if forwarded:
		return forwarded.split(",")[0].strip()
	return request.META.get("REMOTE_ADDR")


def _get_user_agent(request):
	return request.META.get("HTTP_USER_AGENT", "")


def _ensure_access(request, form, scope):
	user = getattr(request, "user", None)
	token = get_request_token(request)
	if not resolve_access(user, form, scope, token=token):
		raise PermissionDenied("Access denied.")
	return token


def _resolve_session(form, form_version, user, session_uuid, session_id, token, request):
	ip_address = _get_client_ip(request)
	user_agent = _get_user_agent(request)

	if session_id:
		session = get_object_or_404(ResponseSession, pk=session_id)
		if session.form_id != form.id:
			raise ValidationError({"session_id": "Session does not match this form."})
		if str(session.session_uuid) != str(session_uuid):
			raise ValidationError({"session_uuid": "Session UUID does not match."})
		expected_hash = token_service.hash_token(token) if token else None
		if session.access_token_hash != expected_hash:
			raise ValidationError({"session_id": "Session token mismatch."})

		if form_version and session.form_version_id != form_version.id:
			session.form_version = form_version
		if user and getattr(user, "is_authenticated", False):
			session.user = user
		if ip_address:
			session.ip_address = ip_address
		if user_agent:
			session.user_agent = user_agent
		session.save()
		return session

	return response_service.get_or_create_session(
		form,
		form_version,
		user,
		session_uuid,
		token,
		ip_address,
		user_agent,
	)


class DraftView(APIView):
	permission_classes = [IsAuthenticated]

	def get(self, request, form_id):
		form = get_object_or_404(Form, public_id=form_id)
		_ensure_access(request, form, FormRole.Role.RESPONDER)
		draft = response_service.get_user_draft(form, request.user)
		if not draft:
			raise NotFound("Draft not found.")
		serializer = ResponseDraftSerializer(draft)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request, form_id):
		serializer = ResponseDraftSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		form = get_object_or_404(Form, public_id=form_id)
		token = _ensure_access(request, form, FormRole.Role.RESPONDER)
		form_version = response_service.get_published_version_or_error(form)

		session = _resolve_session(
			form,
			form_version,
			request.user,
			serializer.validated_data["session_uuid"],
			serializer.validated_data.get("session_id"),
			token,
			request,
		)
		response_obj = response_service.save_draft(
			form,
			request.user,
			form_version,
			serializer.validated_data["answers"],
			session,
		)
		output = ResponseDraftSerializer(response_obj)
		return Response(output.data, status=status.HTTP_200_OK)


class SubmitView(APIView):
	permission_classes = [AllowAny]

	def post(self, request, form_id):
		serializer = ResponseSubmitSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		form = get_object_or_404(Form, public_id=form_id)
		user = request.user if getattr(request.user, "is_authenticated", False) else None
		token = _ensure_access(request, form, FormRole.Role.RESPONDER)
		form_version = response_service.get_published_version_or_error(form)

		session = _resolve_session(
			form,
			form_version,
			user,
			serializer.validated_data["session_uuid"],
			serializer.validated_data.get("session_id"),
			token,
			request,
		)

		response_obj = response_service.submit_response(
			form,
			user,
			form_version,
			session,
			serializer.validated_data["answers"],
		)
		output = ResponseSubmitSerializer(response_obj)
		return Response(output.data, status=status.HTTP_201_CREATED)


class AttemptsView(APIView):
	permission_classes = [AllowAny]

	def post(self, request, form_id):
		serializer = ResponseAttemptSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)

		form = get_object_or_404(Form, public_id=form_id)
		user = request.user if getattr(request.user, "is_authenticated", False) else None
		token = _ensure_access(request, form, FormRole.Role.RESPONDER)
		form_version = response_service.get_published_version_or_error(form)

		session = response_service.get_or_create_session(
			form,
			form_version,
			user,
			serializer.validated_data["session_uuid"],
			token,
			_get_client_ip(request),
			_get_user_agent(request),
		)
		attempt = response_service.start_attempt(form, user, form_version, session)
		output = ResponseAttemptSerializer(attempt)
		return Response(output.data, status=status.HTTP_200_OK)


class ResponseListView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, form_id):
		form = get_object_or_404(Form, public_id=form_id)
		_ensure_access(request, form, FormRole.Role.EDITOR)
		responses = (
			FormResponse.objects.filter(
				form=form,
				status=FormResponse.Status.SUBMITTED,
			)
			.select_related("user", "form", "form_version", "session")
			.order_by("-submitted_at", "-created_at", "-id")
		)
		serializer = ResponseListSerializer(responses, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)


class ResponseDetailView(APIView):
	permission_classes = [AllowAny]

	def get(self, request, response_id):
		response_obj = get_object_or_404(
			FormResponse.objects.select_related("user", "form", "form_version", "session"),
			pk=response_id,
		)
		_ensure_access(request, response_obj.form, FormRole.Role.EDITOR)
		serializer = ResponseDetailSerializer(response_obj)
		return Response(serializer.data, status=status.HTTP_200_OK)


class ResponseEventView(APIView):
	permission_classes = [AllowAny]

	def post(self, request, session_id):
		session = get_object_or_404(
			ResponseSession.objects.select_related("form"),
			pk=session_id,
		)
		_ensure_access(request, session.form, FormRole.Role.RESPONDER)
		serializer = ResponseEventSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		event = event_service.append_event(
			session,
			serializer.validated_data["event_type"],
			serializer.validated_data.get("metadata"),
			serializer.validated_data["occurred_at"],
		)
		output = ResponseEventSerializer(event)
		return Response(output.data, status=status.HTTP_201_CREATED)
