from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.forms.models import Form
from apps.forms.permissions import FormOwnerPermission
from apps.permissions.models import FormAccessSettings, FormAccessToken, FormRole
from apps.permissions.serializers import (
	AccessSettingsSerializer,
	AccessTokenCreateSerializer,
	AccessTokenListSerializer,
	RoleAssignmentSerializer,
	RoleListSerializer,
	UserLookupSerializer,
)
from apps.permissions.services import role_service, token_service


class FormOwnerBaseView(APIView):
	permission_classes = [IsAuthenticated, FormOwnerPermission]

	def get_form(self, form_id):
		form = get_object_or_404(Form, public_id=form_id)
		self.check_object_permissions(self.request, form)
		return form


class AccessSettingsView(FormOwnerBaseView):
	def get(self, request, form_id):
		form = self.get_form(form_id)
		settings_obj, _created = FormAccessSettings.objects.get_or_create(form=form)
		serializer = AccessSettingsSerializer(settings_obj)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def put(self, request, form_id):
		form = self.get_form(form_id)
		settings_obj, _created = FormAccessSettings.objects.get_or_create(form=form)
		serializer = AccessSettingsSerializer(settings_obj, data=request.data)
		serializer.is_valid(raise_exception=True)
		serializer.save()
		return Response(serializer.data, status=status.HTTP_200_OK)


class UserLookupView(FormOwnerBaseView):
	def get(self, request, form_id):
		self.get_form(form_id)
		email = request.query_params.get("email")
		if not email:
			return Response(
				{"detail": "Email is required."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		user = get_object_or_404(get_user_model(), email=email)
		serializer = UserLookupSerializer({"user_id": user.id, "email": user.email})
		return Response(serializer.data, status=status.HTTP_200_OK)


class RoleListCreateView(FormOwnerBaseView):
	def get(self, request, form_id):
		form = self.get_form(form_id)
		roles = FormRole.objects.filter(form=form).select_related("user")
		serializer = RoleListSerializer(roles, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request, form_id):
		form = self.get_form(form_id)
		serializer = RoleAssignmentSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		user_id = serializer.validated_data["user_id"]
		role = serializer.validated_data["role"]
		if user_id == form.owner_id:
			return Response(
				{"detail": "Owner access is implicit."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		user = get_object_or_404(get_user_model(), pk=user_id)
		role_obj = role_service.assign_role(form, user, role)
		response = RoleListSerializer(role_obj)
		return Response(response.data, status=status.HTTP_201_CREATED)


class RoleDeleteView(FormOwnerBaseView):
	def delete(self, request, form_id, user_id):
		form = self.get_form(form_id)
		user = get_object_or_404(get_user_model(), pk=user_id)
		if user.id == form.owner_id:
			return Response(
				{"detail": "Owner access is implicit."},
				status=status.HTTP_400_BAD_REQUEST,
			)
		role_service.remove_role(form, user)
		return Response(status=status.HTTP_204_NO_CONTENT)


class AccessTokenListCreateView(FormOwnerBaseView):
	def get(self, request, form_id):
		form = self.get_form(form_id)
		tokens = FormAccessToken.objects.filter(form=form).order_by("-created_at")
		serializer = AccessTokenListSerializer(tokens, many=True)
		return Response(serializer.data, status=status.HTTP_200_OK)

	def post(self, request, form_id):
		form = self.get_form(form_id)
		serializer = AccessTokenCreateSerializer(data=request.data)
		serializer.is_valid(raise_exception=True)
		scope = serializer.validated_data["scope"]
		expires_at = serializer.validated_data.get("expires_at")
		token_obj, plain_token = token_service.create_token(
			form,
			scope,
			expires_at=expires_at,
		)
		response_data = {
			"id": token_obj.id,
			"scope": token_obj.scope,
			"expires_at": token_obj.expires_at,
			"created_at": token_obj.created_at,
			"token": plain_token,
		}
		return Response(response_data, status=status.HTTP_201_CREATED)


class AccessTokenRevokeView(FormOwnerBaseView):
	def post(self, request, form_id, token_id):
		form = self.get_form(form_id)
		token = get_object_or_404(FormAccessToken, form=form, pk=token_id)
		token.is_active = False
		token.save(update_fields=["is_active"])
		serializer = AccessTokenListSerializer(token)
		return Response(serializer.data, status=status.HTTP_200_OK)


class AccessTokenRotateView(FormOwnerBaseView):
	def post(self, request, form_id, token_id):
		form = self.get_form(form_id)
		token = get_object_or_404(FormAccessToken, form=form, pk=token_id)
		token_service.revoke_token(token.id)
		new_token, plain_token = token_service.create_token(
			form,
			token.scope,
			expires_at=token.expires_at,
		)
		response_data = {
			"id": new_token.id,
			"scope": new_token.scope,
			"expires_at": new_token.expires_at,
			"created_at": new_token.created_at,
			"token": plain_token,
		}
		return Response(response_data, status=status.HTTP_200_OK)
