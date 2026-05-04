from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError #type: ignore
from django.utils import timezone #type: ignore
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.models import User
from apps.accounts.services import auth_service, email_service, otp_service


def build_response(detail, code, data=None):
    payload = {"detail": detail, "code": code}
    if data is not None:
        payload["data"] = data
    return payload


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)
    confirm_password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get("email", "").lower()
        password = attrs.get("password", "")
        confirm_password = attrs.get("confirm_password", "")

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                {"detail": "Email already registered.", "code": "email_already_registered"}
            )
        if password != confirm_password:
            raise serializers.ValidationError(
                {"detail": "Passwords do not match.", "code": "password_mismatch"}
            )
        try:
            validate_password(password, user=User(email=email))
        except DjangoValidationError as exc:
            raise serializers.ValidationError(
                {"detail": " ".join(exc.messages), "code": "weak_password"}
            )
        attrs["email"] = email
        attrs.pop("confirm_password", None)
        return attrs

    def create(self, validated_data):
        expires_in = auth_service.register_user(
            email=validated_data["email"],
            password=validated_data["password"],
        )
        return build_response(
            "OTP sent to your email.",
            "otp_sent",
            {"expires_in": expires_in},
        )


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()

    def create(self, validated_data):
        email = validated_data["email"].lower()
        try:
            otp_service.verify_otp(email, validated_data["code"])
        except otp_service.OtpServiceError as exc:
            raise serializers.ValidationError({"detail": exc.detail, "code": exc.code})

        user = auth_service.verify_user_email(email)
        if not user:
            raise serializers.ValidationError(
                {"detail": "OTP expired or invalid.", "code": "otp_expired"}
            )

        return build_response("Email verified.", "otp_verified")


class ResendOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def create(self, validated_data):
        email = validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            raise serializers.ValidationError(
                {"detail": "Account not found.", "code": "account_not_found"}
            )
        if user.is_email_verified:
            raise serializers.ValidationError(
                {"detail": "Email already verified.", "code": "email_already_verified"}
            )
        if not otp_service.can_resend(email):
            raise serializers.ValidationError(
                {
                    "detail": "Please wait before requesting another OTP.",
                    "code": "otp_cooldown",
                }
            )
        otp, code = otp_service.create_otp_for_email(email, user)
        email_service.send_otp_email(email, code, otp_service.OTP_EXPIRES_MINUTES)
        expires_in = int((otp.expires_at - timezone.now()).total_seconds())
        return build_response("OTP resent.", "otp_resent", {"expires_in": expires_in})


class LoginSerializer(TokenObtainPairSerializer):
    username_field = "email"

    def validate(self, attrs):
        email = attrs.get("email", "")
        email_normalized = email.lower()
        attrs["email"] = email_normalized
        user = User.objects.filter(email__iexact=email_normalized).first()
        if user and not user.is_email_verified:
            raise serializers.ValidationError(
                {"detail": "Email not verified.", "code": "email_not_verified"}
            )
        return super().validate(attrs)
