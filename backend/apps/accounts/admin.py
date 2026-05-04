from django import forms #type: ignore
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField

from .models import EmailOTP, User


class UserCreationForm(forms.ModelForm):
	password1 = forms.CharField(label="Password", widget=forms.PasswordInput)
	password2 = forms.CharField(label="Confirm password", widget=forms.PasswordInput)

	class Meta:
		model = User
		fields = ("email",)

	def clean_password2(self):
		password1 = self.cleaned_data.get("password1")
		password2 = self.cleaned_data.get("password2")
		if password1 and password2 and password1 != password2:
			raise forms.ValidationError("Passwords do not match")
		return password2

	def save(self, commit=True):
		user = super().save(commit=False)
		user.set_password(self.cleaned_data["password1"])
		if commit:
			user.save()
		return user


class UserChangeForm(forms.ModelForm):
	password = ReadOnlyPasswordHashField()

	class Meta:
		model = User
		fields = (
			"email",
			"password",
			"is_active",
			"is_staff",
			"is_superuser",
			"is_email_verified",
		)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
	form = UserChangeForm
	add_form = UserCreationForm

	list_display = ("email", "is_email_verified", "is_active", "is_staff", "date_joined")
	list_filter = ("is_email_verified", "is_active", "is_staff", "is_superuser")
	search_fields = ("email",)
	ordering = ("-date_joined",)

	fieldsets = (
		(None, {"fields": ("email", "password")}),
		("Status", {"fields": ("is_active", "is_email_verified")}),
		("Permissions", {"fields": ("is_staff", "is_superuser", "groups", "user_permissions")}),
		("Important dates", {"fields": ("last_login", "date_joined")}),
	)

	add_fieldsets = (
		(
			None,
			{
				"classes": ("wide",),
				"fields": ("email", "password1", "password2", "is_active", "is_email_verified"),
			},
		),
	)

	filter_horizontal = ("groups", "user_permissions")


@admin.register(EmailOTP)
class EmailOTPAdmin(admin.ModelAdmin):
	list_display = ("email", "is_used", "attempt_count", "expires_at", "last_sent_at", "created_at")
	list_filter = ("is_used",)
	search_fields = ("email",)
	ordering = ("-created_at",)
