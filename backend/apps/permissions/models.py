from django.conf import settings
from django.db import models #type: ignore


class FormAccessSettings(models.Model):
	class EditorAccessMode(models.TextChoices):
		RESTRICTED = "restricted", "Restricted"
		LINK = "link", "Link"

	class ResponderAccessMode(models.TextChoices):
		RESTRICTED = "restricted", "Restricted"
		LINK = "link", "Link"
		PUBLIC = "public", "Public"

	form = models.OneToOneField(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="access_settings",
	)
	editor_access_mode = models.CharField(
		max_length=20,
		choices=EditorAccessMode.choices,
		default=EditorAccessMode.RESTRICTED,
	)
	responder_access_mode = models.CharField(
		max_length=20,
		choices=ResponderAccessMode.choices,
		default=ResponderAccessMode.RESTRICTED,
	)
	updated_at = models.DateTimeField(auto_now=True)


class FormRole(models.Model):
	class Role(models.TextChoices):
		EDITOR = "editor", "Editor"
		RESPONDER = "responder", "Responder"

	form = models.ForeignKey(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="roles",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="form_roles",
	)
	role = models.CharField(max_length=20, choices=Role.choices)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		unique_together = ("form", "user")
		indexes = [
			models.Index(fields=["form", "role"], name="permissions_form_role_idx")
		]


class FormAccessToken(models.Model):
	class Scope(models.TextChoices):
		EDITOR = "editor", "Editor"
		RESPONDER = "responder", "Responder"

	form = models.ForeignKey(
		"forms.Form",
		on_delete=models.CASCADE,
		related_name="access_tokens",
	)
	scope = models.CharField(max_length=20, choices=Scope.choices)
	token_hash = models.CharField(max_length=64)
	is_active = models.BooleanField(default=True)
	expires_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	last_used_at = models.DateTimeField(null=True, blank=True)

	class Meta:
		indexes = [
			models.Index(
				fields=["form", "scope", "is_active"],
				name="permissions_token_lookup_idx",
			)
		]
