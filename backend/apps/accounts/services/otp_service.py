import secrets
import string
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import EmailOTP

OTP_LENGTH = 6
OTP_EXPIRES_MINUTES = 5
OTP_MAX_ATTEMPTS = 3
OTP_RESEND_COOLDOWN_SECONDS = 20


class OtpServiceError(Exception):
    def __init__(self, code, detail):
        self.code = code
        self.detail = detail
        super().__init__(detail)


def generate_code(length=OTP_LENGTH):
    return "".join(secrets.choice(string.digits) for _ in range(length))


def _candidate(email, code):
    return f"{email.lower()}:{code}"


def hash_code(code, email):
    return make_password(_candidate(email, code))


def create_otp_for_email(email, user=None):
    now = timezone.now()
    email_normalized = email.lower()
    with transaction.atomic():
        EmailOTP.objects.filter(
            email__iexact=email_normalized,
            is_used=False,
            expires_at__gt=now,
        ).update(is_used=True, used_at=now)
        code = generate_code()
        otp = EmailOTP.objects.create(
            user=user,
            email=email_normalized,
            code_hash=hash_code(code, email_normalized),
            expires_at=now + timedelta(minutes=OTP_EXPIRES_MINUTES),
            attempt_count=0,
            last_sent_at=now,
            is_used=False,
        )
    return otp, code


def can_resend(email):
    otp = (
        EmailOTP.objects.filter(email__iexact=email.lower())
        .order_by("-last_sent_at", "-created_at")
        .first()
    )
    if not otp:
        return True
    elapsed = (timezone.now() - otp.last_sent_at).total_seconds()
    return elapsed >= OTP_RESEND_COOLDOWN_SECONDS


def verify_otp(email, code):
    now = timezone.now()
    email_normalized = email.lower()
    otp = (
        EmailOTP.objects.filter(email__iexact=email_normalized, is_used=False)
        .order_by("-created_at")
        .first()
    )
    if not otp:
        raise OtpServiceError("otp_expired", "OTP expired or invalid.")
    if otp.expires_at <= now:
        otp.is_used = True
        otp.used_at = now
        otp.save(update_fields=["is_used", "used_at"])
        raise OtpServiceError("otp_expired", "OTP expired. Please request a new one.")
    if otp.attempt_count >= OTP_MAX_ATTEMPTS:
        otp.is_used = True
        otp.used_at = now
        otp.save(update_fields=["is_used", "used_at"])
        raise OtpServiceError(
            "otp_max_attempts",
            "Maximum OTP attempts reached. Please request a new code.",
        )
    if not check_password(_candidate(email_normalized, code), otp.code_hash):
        otp.attempt_count += 1
        update_fields = ["attempt_count"]
        if otp.attempt_count >= OTP_MAX_ATTEMPTS:
            otp.is_used = True
            otp.used_at = now
            update_fields.extend(["is_used", "used_at"])
            otp.save(update_fields=update_fields)
            raise OtpServiceError(
                "otp_max_attempts",
                "Maximum OTP attempts reached. Please request a new code.",
            )
        otp.save(update_fields=update_fields)
        raise OtpServiceError("otp_invalid", "Invalid OTP code.")

    otp.is_used = True
    otp.used_at = now
    otp.save(update_fields=["is_used", "used_at"])
    return True
