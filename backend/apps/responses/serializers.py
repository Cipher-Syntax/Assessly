from rest_framework import serializers

from apps.responses.models import Response, ResponseEvent, ResponseSession


class ResponseDraftSerializer(serializers.Serializer):
    answers = serializers.JSONField()
    session_uuid = serializers.UUIDField()
    session_id = serializers.IntegerField(required=False, allow_null=True)

    def to_representation(self, instance):
        if isinstance(instance, Response):
            return {
                "id": instance.id,
                "status": instance.status,
                "answers": instance.answers,
                "updated_at": instance.updated_at,
                "form_version_id": instance.form_version_id,
                "session_id": instance.session_id,
                "session_uuid": instance.session.session_uuid if instance.session_id else None,
            }
        return super().to_representation(instance)


class ResponseSubmitSerializer(serializers.Serializer):
    answers = serializers.JSONField()
    session_uuid = serializers.UUIDField()
    session_id = serializers.IntegerField(required=False, allow_null=True)

    def to_representation(self, instance):
        if isinstance(instance, Response):
            return {
                "id": instance.id,
                "status": instance.status,
                "submitted_at": instance.submitted_at,
                "form_version_id": instance.form_version_id,
                "session_id": instance.session_id,
            }
        return super().to_representation(instance)


class ResponseAttemptSerializer(serializers.Serializer):
    session_uuid = serializers.UUIDField()

    def to_representation(self, instance):
        if isinstance(instance, Response):
            return ResponseDraftSerializer(instance).data
        if isinstance(instance, ResponseSession):
            return {
                "session_id": instance.id,
                "form_version_id": instance.form_version_id,
            }
        return super().to_representation(instance)


class ResponseListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Response
        fields = ["id", "user_id", "status", "submitted_at", "created_at", "answers"]


class ResponseDetailSerializer(serializers.ModelSerializer):
    session_uuid = serializers.SerializerMethodField()

    class Meta:
        model = Response
        fields = [
            "id",
            "status",
            "answers",
            "submitted_at",
            "created_at",
            "form_version_id",
            "user_id",
            "session_uuid",
        ]

    def get_session_uuid(self, obj):
        if obj.session_id:
            return obj.session.session_uuid
        return None


class ResponseEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResponseEvent
        fields = ["id", "event_type", "metadata", "occurred_at"]
