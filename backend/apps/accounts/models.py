from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models #type: ignore
from django.utils import timezone #type: ignore


class UserManager(BaseUserManager):
	use_in_migrations = True

	def _normalize_email(self, email):
		normalized = self.normalize_email(email or "")
		return normalized.lower()

	def create_user(self, email, password=None, **extra_fields):
		if not email:
			raise ValueError("Email is required")

		email = self._normalize_email(email)
		user = self.model(email=email, **extra_fields)
		user.set_password(password)
		user.save(using=self._db)
		return user

	def create_superuser(self, email, password=None, **extra_fields):
		extra_fields.setdefault("is_staff", True)
		extra_fields.setdefault("is_superuser", True)
		extra_fields.setdefault("is_active", True)
		extra_fields.setdefault("is_email_verified", True)

		if extra_fields.get("is_staff") is not True:
			raise ValueError("Superuser must have is_staff=True")
		if extra_fields.get("is_superuser") is not True:
			raise ValueError("Superuser must have is_superuser=True")

		return self.create_user(email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
	email = models.EmailField(unique=True)
	is_active = models.BooleanField(default=False)
	is_staff = models.BooleanField(default=False)
	is_email_verified = models.BooleanField(default=False)
	date_joined = models.DateTimeField(default=timezone.now)

	objects = UserManager()

	USERNAME_FIELD = "email"
	REQUIRED_FIELDS = []

	def save(self, *args, **kwargs):
		if self.email:
			self.email = self.email.lower()
		super().save(*args, **kwargs)

	def __str__(self):
		return self.email


class EmailOTP(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="email_otps",
	)
	email = models.EmailField(db_index=True)
	code_hash = models.CharField(max_length=255)
	expires_at = models.DateTimeField()
	attempt_count = models.PositiveSmallIntegerField(default=0)
	last_sent_at = models.DateTimeField()
	is_used = models.BooleanField(default=False)
	used_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		indexes = [models.Index(fields=["email", "is_used", "expires_at"], name="accounts_email_active_idx")]

	def __str__(self):
		return f"{self.email} ({'used' if self.is_used else 'active'})"


class UserSettings(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="settings",
	)
	# System-wide config
	default_collect_email = models.BooleanField(default=False)
	
	# Styling defaults
	theme_preference = models.CharField(
		max_length=20,
		default="system",
		choices=[("light", "Light"), ("dark", "Dark"), ("system", "System")]
	)
	default_form_color = models.CharField(max_length=7, default="#673ab7")

	def __str__(self):
		return f"{self.user.email} Settings"
