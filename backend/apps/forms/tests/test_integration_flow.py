from django.urls import reverse
from rest_framework.test import APITestCase
from apps.forms.models import Form, FormVersion
from apps.accounts.models import User
from apps.forms.services.schema_service import validate_schema

class IntegrationFlowTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="owner@example.com", password="pass123")
        self.client.force_login(self.user)
        self.schema = {
            "sections": [
                {
                    "id": "sec-1",
                    "title": "Section",
                    "description": "Desc",
                    "questions": [
                        {
                            "id": "q-1",
                            "type": "short_text",
                            "label": "Name",
                            "required": True,
                        }
                    ],
                }
            ]
        }

    def test_full_creator_to_responder_flow(self):
        # create form
        resp = self.client.post(reverse('forms-list'), {"title": "Test", "description": "", "schema": self.schema}, format='json')
        self.assertEqual(resp.status_code, 201)
        form_id = resp.data['id']
        # publish form
        pub_resp = self.client.post(reverse('forms-publish', args=[form_id]))
        self.assertEqual(pub_resp.status_code, 200)
        # generate responder token (assuming endpoint exists)
        token_resp = self.client.post(reverse('forms-responder-token', args=[form_id]))
        self.assertEqual(token_resp.status_code, 200)
        token = token_resp.data['token']
        # submit response as public (no auth)
        self.client.logout()
        submit_url = reverse('public-submit-response', args=[form_id])
        submit_resp = self.client.post(submit_url, {"answers": [{"question_id": "q-1", "value": "Alice"}]}, format='json')
        self.assertEqual(submit_resp.status_code, 201)
        # fetch responses list (owner auth)
        self.client.force_login(self.user)
        list_resp = self.client.get(reverse('responses-list', args=[form_id]))
        self.assertEqual(list_resp.status_code, 200)
        self.assertGreaterEqual(len(list_resp.data), 1)
