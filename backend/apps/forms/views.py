from django.db.models import Q
from rest_framework import status, viewsets, filters
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.generics import get_object_or_404
from rest_framework.views import APIView
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'page_size'
    max_page_size = 100

from apps.forms.models import Form
from apps.forms.permissions import FormAccessPermission, FormOwnerPermission, get_editor_form_ids
from apps.forms.serializers import (
    FormCreateSerializer,
    FormDetailSerializer,
    FormListSerializer,
    FormPublicSerializer,
    FormUpdateSerializer,
    PublishSerializer,
)
from apps.forms.services import form_service
from apps.permissions.models import FormAccessSettings, FormAccessToken
from apps.permissions.services import token_service


class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.select_related("draft_version", "published_version")
    permission_classes = [IsAuthenticated, FormAccessPermission]
    lookup_field = "public_id"
    lookup_value_regex = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "updated_at", "title"]
    ordering = ["-updated_at"]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Form.objects.none()
            
        base_qs = self.queryset
        if getattr(self, "action", None) == "templates":
            return base_qs.filter(is_template=True)
            
        editor_form_ids = get_editor_form_ids(user)
        user_qs = base_qs.filter(Q(owner=user) | Q(id__in=editor_form_ids)).distinct()
        
        if getattr(self, "action", None) == "clone":
            return user_qs | base_qs.filter(is_template=True)
            
        return user_qs

    def get_object(self):
        queryset = self.queryset
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        lookup_value = self.kwargs.get(lookup_url_kwarg)
        obj = get_object_or_404(queryset, **{self.lookup_field: lookup_value})
        self.check_object_permissions(self.request, obj)
        return obj

    def get_permissions(self):
        if self.action in {"destroy", "publish"}:
            return [IsAuthenticated(), FormOwnerPermission()]
        if self.action in {"templates", "clone"}:
            return [IsAuthenticated()]
        return [IsAuthenticated(), FormAccessPermission()]

    def get_serializer_class(self):
        if self.action in {"list", "templates"}:
            return FormListSerializer
        if self.action == "create":
            return FormCreateSerializer
        if self.action in {"update", "partial_update"}:
            return FormUpdateSerializer
        if self.action == "publish":
            return PublishSerializer
        return FormDetailSerializer

    @action(detail=False, methods=["get"])
    def templates(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def clone(self, request, *args, **kwargs):
        form = self.get_object()
        cloned_form = form_service.clone_form(form, request.user)
        serializer = FormDetailSerializer(cloned_form)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


    @action(detail=True, methods=["post"])
    def publish(self, request, *args, **kwargs):
        form = self.get_object()
        published = form_service.publish_form(form, request.user)
        serializer = PublishSerializer(published)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"])
    def ai_generate(self, request, *args, **kwargs):
        import uuid
        import json
        from decouple import config
        
        form = self.get_object()
        prompt = request.data.get("prompt", "")
        
        # Check if API key is provided
        api_key = config("OPENROUTER_API_KEY", default=None)
        
        if api_key:
            try:
                from openai import OpenAI
                
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=api_key,
                )
                
                system_instruction = """
                You are a form generation assistant. The user will provide a topic or prompt.
                You must return ONLY valid JSON representing the generated questions.
                Do not include markdown blocks like ```json or any other text.
                The JSON must strictly match this structure:
                {
                  "sections": [
                    {
                      "id": "generate-a-uuid-string-here",
                      "title": "A relevant section title",
                      "description": "A brief description of this section",
                      "questions": [
                        {
                          "id": "generate-a-uuid-string-here",
                          "type": "<one of: short_text, paragraph, multiple_choice, checkboxes, dropdown>",
                          "label": "<the question text>",
                          "required": true,
                          "options": ["<option 1>", "<option 2>"] 
                        }
                      ]
                    }
                  ]
                }
                NOTE: Only include the 'options' array for 'multiple_choice', 'checkboxes', or 'dropdown' question types. Omit 'options' for text types.
                """
                
                completion = client.chat.completions.create(
                    model="openai/gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": f"Generate a form for this prompt: {prompt}"}
                    ]
                )
                
                response_text = completion.choices[0].message.content.strip()
                # Clean up any potential markdown formatting the model might still try to add
                if response_text.startswith("```json"):
                    response_text = response_text[7:]
                if response_text.startswith("```"):
                    response_text = response_text[3:]
                if response_text.endswith("```"):
                    response_text = response_text[:-3]
                    
                mock_schema = json.loads(response_text)
                
            except Exception as e:
                return Response({"detail": f"AI Generation failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({"detail": "No OPENROUTER_API_KEY found in .env"}, status=status.HTTP_400_BAD_REQUEST)
        
        if not form.draft_version:
            from apps.forms.models import FormVersion
            draft = FormVersion.objects.create(
                form=form,
                version=1,
                status=FormVersion.Status.DRAFT,
                schema=mock_schema
            )
            form.draft_version = draft
            form.save()
        else:
            form.draft_version.schema = mock_schema
            form.draft_version.save()
            
        serializer = FormDetailSerializer(form)
        return Response(serializer.data, status=status.HTTP_200_OK)


class FormPublicView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, form_id):
        form = get_object_or_404(
            Form.objects.select_related("published_version"),
            public_id=form_id,
        )

        if not form.published_version_id:
            return Response(
                {"detail": "Published form not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        access_settings, _created = FormAccessSettings.objects.get_or_create(form=form)
        access_mode = access_settings.responder_access_mode
        user = getattr(request, "user", None)
        token = request.query_params.get("token")

        if access_mode == FormAccessSettings.ResponderAccessMode.RESTRICTED:
            if not user or not user.is_authenticated:
                return Response(
                    {"detail": "Authentication required."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        elif access_mode == FormAccessSettings.ResponderAccessMode.LINK:
            if not (user and user.is_authenticated):
                if not token:
                    return Response(
                        {"detail": "Valid access token required."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
                is_valid = token_service.validate_token(
                    form,
                    scope=FormAccessToken.Scope.RESPONDER,
                    token=token,
                )
                if not is_valid:
                    return Response(
                        {"detail": "Invalid or expired access token."},
                        status=status.HTTP_403_FORBIDDEN,
                    )
        elif access_mode == FormAccessSettings.ResponderAccessMode.PUBLIC:
            pass
        else:
            if not user or not user.is_authenticated:
                return Response(
                    {"detail": "Authentication required."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = FormPublicSerializer(form)
        return Response(serializer.data, status=status.HTTP_200_OK)
