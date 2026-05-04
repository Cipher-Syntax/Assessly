from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter #type: ignore
from allauth.socialaccount.providers.oauth2.client import OAuth2Client #type: ignore
from dj_rest_auth.registration.views import SocialLoginView #type: ignore
from django.urls import NoReverseMatch #type: ignore
from rest_framework import generics, serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenBlacklistSerializer
from rest_framework_simplejwt.views import TokenBlacklistView, TokenObtainPairView

from apps.accounts.serializers import (
	LoginSerializer,
	RegisterSerializer,
	ResendOtpSerializer,
	VerifyOtpSerializer,
	build_response,
)


class RegisterView(generics.CreateAPIView):
	serializer_class = RegisterSerializer
	permission_classes = [AllowAny]

	def create(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		payload = serializer.save()
		return Response(payload, status=status.HTTP_201_CREATED)


class VerifyOtpView(generics.GenericAPIView):
	serializer_class = VerifyOtpSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		payload = serializer.save()
		return Response(payload, status=status.HTTP_200_OK)


class ResendOtpView(generics.GenericAPIView):
	serializer_class = ResendOtpSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		payload = serializer.save()
		return Response(payload, status=status.HTTP_200_OK)


class LoginView(TokenObtainPairView):
	serializer_class = LoginSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		payload = build_response("Login successful.", "login_success", serializer.validated_data)
		return Response(payload, status=status.HTTP_200_OK)


class LogoutView(TokenBlacklistView):
	serializer_class = TokenBlacklistSerializer
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		serializer = self.get_serializer(data=request.data)
		try:
			serializer.is_valid(raise_exception=True)
			serializer.save()
		except TokenError as exc:
			if "blacklisted" in str(exc).lower():
				payload = build_response("Logout successful.", "logout_success")
				return Response(payload, status=status.HTTP_200_OK)
			raise serializers.ValidationError(
				{"detail": "Invalid token.", "code": "token_invalid"}
			)
		payload = build_response("Logout successful.", "logout_success")
		return Response(payload, status=status.HTTP_200_OK)


class GoogleLoginView(SocialLoginView):
	adapter_class = GoogleOAuth2Adapter
	client_class = OAuth2Client
	permission_classes = [AllowAny]

	def post(self, request, *args, **kwargs):
		try:
			response = super().post(request, *args, **kwargs)
		except NoReverseMatch:
			payload = build_response(
				"Google login requires a valid token with email scope.",
				"google_signup_required",
			)
			return Response(payload, status=status.HTTP_400_BAD_REQUEST)
		if response.status_code >= 400:
			return response
		payload = build_response("Login successful.", "login_success", response.data)
		return Response(payload, status=response.status_code)
