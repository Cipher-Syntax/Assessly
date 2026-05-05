from rest_framework import serializers

from apps.permissions.models import FormAccessSettings, FormAccessToken, FormRole


class AccessSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormAccessSettings
        fields = ["editor_access_mode", "responder_access_mode"]


class RoleAssignmentSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()
    role = serializers.ChoiceField(choices=FormRole.Role.choices)


class RoleListSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = FormRole
        fields = ["user_id", "email", "role", "created_at"]


class AccessTokenCreateSerializer(serializers.Serializer):
    scope = serializers.ChoiceField(choices=FormAccessToken.Scope.choices)
    expires_at = serializers.DateTimeField(required=False, allow_null=True)


class AccessTokenListSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormAccessToken
        fields = [
            "id",
            "scope",
            "is_active",
            "expires_at",
            "created_at",
            "last_used_at",
        ]
