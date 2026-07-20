import uuid

from django.conf import settings
from django.db import models #type: ignore


class Form(models.Model):
	public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
	owner = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="forms",
	)
	title = models.CharField(max_length=255, default="Untitled form")
	description = models.TextField(blank=True)
	settings = models.JSONField(default=dict, blank=True)
	is_template = models.BooleanField(default=False)
	draft_version = models.ForeignKey(
		"FormVersion",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="+",
	)
	published_version = models.ForeignKey(
		"FormVersion",
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="+",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	@property
	def has_published(self):
		return self.published_version_id is not None

	@property
	def current_draft(self):
		return self.draft_version

	def next_published_version(self):
		last_version = (
			self.versions.filter(status=FormVersion.Status.PUBLISHED)
			.order_by("-version")
			.first()
		)
		if not last_version:
			return 1
		return last_version.version + 1


class FormVersion(models.Model):
	class Status(models.TextChoices):
		DRAFT = "draft", "Draft"
		PUBLISHED = "published", "Published"

	form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="versions")
	version = models.PositiveIntegerField()
	status = models.CharField(max_length=20, choices=Status.choices)
	schema = models.JSONField()
	created_at = models.DateTimeField(auto_now_add=True)
	published_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		unique_together = ("form", "version")
		indexes = [
			models.Index(fields=["form", "status"], name="forms_form_status_idx")
		]
