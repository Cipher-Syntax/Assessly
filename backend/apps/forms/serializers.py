from rest_framework import serializers

from apps.forms.models import Form
from apps.forms.services import form_service


class FormListSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    is_published = serializers.SerializerMethodField()
    published_version_id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Form
        fields = ["id", "title", "is_published", "updated_at", "published_version_id"]

    def get_is_published(self, obj):
        return obj.has_published


class FormDetailSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    draft_schema = serializers.SerializerMethodField()
    published_version = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            "id",
            "title",
            "description",
            "created_at",
            "updated_at",
            "draft_schema",
            "published_version",
            "settings",
        ]

    def get_draft_schema(self, obj):
        if obj.draft_version:
            return obj.draft_version.schema
        return {"sections": []}

    def get_published_version(self, obj):
        if not obj.published_version:
            return None
        return {
            "id": obj.published_version.id,
            "version": obj.published_version.version,
            "published_at": obj.published_version.published_at,
        }


class FormCreateSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)

    def create(self, validated_data):
        request = self.context.get("request")
        return form_service.create_form(
            owner=request.user,
            title=validated_data.get("title"),
            description=validated_data.get("description"),
        )

    def to_representation(self, instance):
        return FormDetailSerializer(instance, context=self.context).data


class FormUpdateSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True)
    draft_schema = serializers.JSONField(required=False, allow_null=True)
    settings = serializers.JSONField(required=False, allow_null=True)

    def update(self, instance, validated_data):
        title = validated_data["title"] if "title" in validated_data else None
        description = (
            validated_data["description"] if "description" in validated_data else None
        )
        draft_schema = (
            validated_data["draft_schema"] if "draft_schema" in validated_data else None
        )
        settings = (
            validated_data["settings"] if "settings" in validated_data else None
        )
        form_service.update_draft(
            instance,
            title=title,
            description=description,
            schema=draft_schema,
            settings=settings,
        )
        return instance

    def to_representation(self, instance):
        return FormDetailSerializer(instance, context=self.context).data


class PublishSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    version = serializers.IntegerField(read_only=True)
    published_at = serializers.DateTimeField(read_only=True)


class FormPublicSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="public_id", read_only=True)
    published_schema = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = ["id", "title", "description", "published_schema", "settings"]

    def get_published_schema(self, obj):
        if not obj.published_version:
            return None
        return obj.published_version.schema
