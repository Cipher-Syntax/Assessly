from django.db import transaction
from django.utils import timezone

from apps.accounts.models import User
from apps.accounts.services.email_service import send_otp_email
from apps.accounts.services.otp_service import OTP_EXPIRES_MINUTES, create_otp_for_email


def register_user(email, password):
    email_normalized = email.lower()
    with transaction.atomic():
        user = User.objects.create_user(
            email=email_normalized,
            password=password,
            is_active=False,
            is_email_verified=False,
        )
        otp, code = create_otp_for_email(email_normalized, user)
        expires_in = int((otp.expires_at - timezone.now()).total_seconds())
        transaction.on_commit(
            lambda: send_otp_email(email_normalized, code, OTP_EXPIRES_MINUTES)
        )
    return expires_in


def verify_user_email(email):
    user = User.objects.filter(email__iexact=email.lower()).first()
    if not user:
        return None
    user.is_active = True
    user.is_email_verified = True
    user.save(update_fields=["is_active", "is_email_verified"])
    return user
