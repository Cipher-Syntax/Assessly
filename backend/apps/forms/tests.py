import uuid

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient

from apps.forms.services import form_service
from apps.permissions.models import FormRole
from apps.responses.models import Response


class FinalIntegrationFlowTests(APITestCase):
    def setUp(self):
        self.owner = get_user_model().objects.create_user(
            email="owner@example.com",
            password="password123",
            is_active=True,
            is_email_verified=True,
        )
        self.owner_client = APIClient()
        self.owner_client.force_authenticate(self.owner)
        self.anon_client = APIClient()

    def _build_schema(self, required=True):
        section_id = str(uuid.uuid4())
        question_id = str(uuid.uuid4())
        schema = {
            "sections": [
                {
                    "id": section_id,
                    "title": "Section 1",
                    "description": "",
                    "questions": [
                        {
                            "id": question_id,
                            "type": "short_text",
                            "label": "Your name",
                            "required": required,
                        }
                    ],
                }
            ]
        }
        return schema, question_id

    def _create_published_form(self):
        create_response = self.owner_client.post(
            "/api/forms/",
            {"title": "Test form", "description": ""},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        form_id = create_response.data["id"]

        schema, question_id = self._build_schema(required=True)
        update_response = self.owner_client.patch(
            f"/api/forms/{form_id}/",
            {"title": "Test form", "description": "", "draft_schema": schema},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)

        publish_response = self.owner_client.post(
            f"/api/forms/{form_id}/publish/",
            format="json",
        )
        self.assertEqual(publish_response.status_code, 200)
        return form_id, question_id

    def test_creator_to_responder_flow_link_access(self):
        form_id, question_id = self._create_published_form()

        settings_response = self.owner_client.put(
            f"/api/permissions/forms/{form_id}/settings/",
            {"editor_access_mode": "restricted", "responder_access_mode": "link"},
            format="json",
        )
        self.assertEqual(settings_response.status_code, 200)

        token_response = self.owner_client.post(
            f"/api/permissions/forms/{form_id}/tokens/",
            {"scope": "responder"},
            format="json",
        )
        self.assertEqual(token_response.status_code, 201)
        token = token_response.data["token"]

        public_response = self.anon_client.get(
            f"/api/forms/{form_id}/public/?token={token}"
        )
        self.assertEqual(public_response.status_code, 200)

        missing_response = self.anon_client.post(
            f"/api/responses/forms/{form_id}/submit/",
            {"answers": {}, "session_uuid": str(uuid.uuid4())},
            format="json",
            HTTP_X_FORM_ACCESS_TOKEN=token,
        )
        self.assertEqual(missing_response.status_code, 400)
        self.assertIn("required", missing_response.data)

        submit_response = self.anon_client.post(
            f"/api/responses/forms/{form_id}/submit/",
            {
                "answers": {question_id: "Alex"},
                "session_uuid": str(uuid.uuid4()),
            },
            format="json",
            HTTP_X_FORM_ACCESS_TOKEN=token,
        )
        self.assertEqual(submit_response.status_code, 201)

        list_response = self.owner_client.get(f"/api/responses/forms/{form_id}/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)

    def test_responder_access_modes(self):
        form_id, question_id = self._create_published_form()

        restricted_response = self.anon_client.get(
            f"/api/forms/{form_id}/public/"
        )
        self.assertEqual(restricted_response.status_code, 403)

        link_settings = self.owner_client.put(
            f"/api/permissions/forms/{form_id}/settings/",
            {"editor_access_mode": "restricted", "responder_access_mode": "link"},
            format="json",
        )
        self.assertEqual(link_settings.status_code, 200)

        token_response = self.owner_client.post(
            f"/api/permissions/forms/{form_id}/tokens/",
            {"scope": "responder"},
            format="json",
        )
        self.assertEqual(token_response.status_code, 201)
        token = token_response.data["token"]

        link_denied = self.anon_client.get(f"/api/forms/{form_id}/public/")
        self.assertEqual(link_denied.status_code, 403)

        link_allowed = self.anon_client.get(
            f"/api/forms/{form_id}/public/?token={token}"
        )
        self.assertEqual(link_allowed.status_code, 200)

        public_settings = self.owner_client.put(
            f"/api/permissions/forms/{form_id}/settings/",
            {"editor_access_mode": "restricted", "responder_access_mode": "public"},
            format="json",
        )
        self.assertEqual(public_settings.status_code, 200)

        public_response = self.anon_client.get(f"/api/forms/{form_id}/public/")
        self.assertEqual(public_response.status_code, 200)

        public_submit = self.anon_client.post(
            f"/api/responses/forms/{form_id}/submit/",
            {
                "answers": {question_id: "Taylor"},
                "session_uuid": str(uuid.uuid4()),
            },
            format="json",
        )
        self.assertEqual(public_submit.status_code, 201)

    def test_list_query_counts(self):
        self._create_published_form()

        form_service.create_form(
            owner=self.owner,
            title="Second form",
            description="",
        )

        with self.assertNumQueries(1):
            self.owner_client.get("/api/forms/")

        form_obj = form_service.create_form(
            owner=self.owner,
            title="Response form",
            description="",
        )
        response_schema, response_question_id = self._build_schema(required=True)
        form_service.update_draft(
            form_obj,
            title="Response form",
            description="",
            schema=response_schema,
        )
        form_service.publish_form(form_obj, self.owner)
        published_version = form_obj.published_version
        Response.objects.create(
            form=form_obj,
            form_version=published_version,
            user=self.owner,
            status=Response.Status.SUBMITTED,
            answers={response_question_id: "Jordan"},
            submitted_at=timezone.now(),
        )

        with self.assertNumQueries(2):
            self.owner_client.get(f"/api/responses/forms/{form_obj.public_id}/")

        editor = get_user_model().objects.create_user(
            email="editor@example.com",
            password="password123",
            is_active=True,
            is_email_verified=True,
        )
        FormRole.objects.create(form=form_obj, user=editor, role=FormRole.Role.EDITOR)

        with self.assertNumQueries(2):
            self.owner_client.get(f"/api/permissions/forms/{form_obj.public_id}/roles/")
