from django.conf import settings
from django.db import models #type: ignore
from django.db.models import Q


class FormResponseSettings(models.Model):
	form = models.OneToOneField(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="response_settings",
	)
	allow_multiple_submissions = models.BooleanField(default=True)
	updated_at = models.DateTimeField(auto_now=True)


class ResponseSession(models.Model):
	form = models.ForeignKey(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="response_sessions",
	)
	form_version = models.ForeignKey(
		"forms.FormVersion",
		on_delete=models.CASCADE,
		related_name="response_sessions",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="response_sessions",
	)
	session_uuid = models.UUIDField(db_index=True)
	access_token_hash = models.CharField(max_length=64, null=True, blank=True)
	ip_address = models.GenericIPAddressField(null=True, blank=True)
	user_agent = models.TextField(blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	last_seen_at = models.DateTimeField(auto_now=True)


class Response(models.Model):
	class Status(models.TextChoices):
		DRAFT = "draft", "Draft"
		SUBMITTED = "submitted", "Submitted"

	form = models.ForeignKey(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="responses",
	)
	form_version = models.ForeignKey(
		"forms.FormVersion",
		on_delete=models.CASCADE,
		related_name="responses",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="responses",
	)
	session = models.OneToOneField(
		"responses.ResponseSession",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="response",
	)
	status = models.CharField(max_length=20, choices=Status.choices)
	answers = models.JSONField(default=dict)
	submitted_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		constraints = [
			models.UniqueConstraint(
				fields=["form", "user", "status"],
				condition=Q(status="draft", user__isnull=False),
				name="responses_unique_draft_per_user",
			)
		]
		indexes = [
			models.Index(
				fields=["form", "status", "submitted_at"],
				name="resp_form_status_sub_idx",
			)
		]


class ResponseEvent(models.Model):
	session = models.ForeignKey(
		"responses.ResponseSession",
		on_delete=models.CASCADE,
		related_name="events",
	)
	event_type = models.CharField(max_length=50)
	metadata = models.JSONField(default=dict)
	occurred_at = models.DateTimeField()
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [
			models.Index(
				fields=["session", "occurred_at"],
				name="resp_event_session_time_idx",
			)
		]
