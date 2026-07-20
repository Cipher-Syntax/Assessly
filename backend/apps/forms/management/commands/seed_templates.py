import uuid
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.forms.models import Form, FormVersion
from apps.permissions.models import FormAccessSettings

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds initial form templates'

    def handle(self, *args, **kwargs):
        admin_user, _ = User.objects.get_or_create(
            email='admin@assessly.local',
            defaults={'is_staff': True, 'is_superuser': True}
        )
        if not admin_user.password:
            admin_user.set_password('admin123')
            admin_user.save()

        templates = [
            {
                "title": "Quiz / Assessment",
                "description": "A standard quiz template with multiple choice questions.",
                "settings": {
                    "is_anti_cheat_enabled": True,
                    "theme_primary_color": "#8B5CF6",
                },
                "schema": {
                    "sections": [
                        {
                            "id": str(uuid.uuid4()),
                            "title": "Participant Information",
                            "description": "Please provide your details before starting the quiz.",
                            "questions": [
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "short_text",
                                    "label": "Full Name",
                                    "required": True,
                                    "options": []
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "short_text",
                                    "label": "Email Address",
                                    "required": True,
                                    "options": []
                                }
                            ]
                        },
                        {
                            "id": str(uuid.uuid4()),
                            "title": "General Knowledge",
                            "description": "Answer the following questions to the best of your ability.",
                            "questions": [
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "multiple_choice",
                                    "label": "What is the capital of France?",
                                    "required": True,
                                    "options": ["London", "Berlin", "Paris", "Madrid"]
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "multiple_choice",
                                    "label": "Which planet is known as the Red Planet?",
                                    "required": True,
                                    "options": ["Earth", "Mars", "Jupiter", "Saturn"]
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "title": "Contact Information",
                "description": "Collect contact details for events or inquiries.",
                "settings": {
                    "is_anti_cheat_enabled": False,
                    "theme_primary_color": "#10B981",
                },
                "schema": {
                    "sections": [
                        {
                            "id": str(uuid.uuid4()),
                            "title": "Contact Details",
                            "description": "Please fill out your contact information below.",
                            "questions": [
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "short_text",
                                    "label": "Full Name",
                                    "required": True,
                                    "options": []
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "short_text",
                                    "label": "Email Address",
                                    "required": True,
                                    "options": []
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "short_text",
                                    "label": "Phone Number",
                                    "required": False,
                                    "options": []
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "paragraph",
                                    "label": "Address",
                                    "required": False,
                                    "options": []
                                }
                            ]
                        }
                    ]
                }
            },
            {
                "title": "Course / Event Feedback",
                "description": "Gather feedback from attendees or students.",
                "settings": {
                    "is_anti_cheat_enabled": False,
                    "theme_primary_color": "#F59E0B",
                },
                "schema": {
                    "sections": [
                        {
                            "id": str(uuid.uuid4()),
                            "title": "Feedback Survey",
                            "description": "We value your feedback to help us improve.",
                            "questions": [
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "dropdown",
                                    "label": "How would you rate the overall event?",
                                    "required": True,
                                    "options": ["5 - Excellent", "4 - Good", "3 - Average", "2 - Poor", "1 - Terrible"]
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "paragraph",
                                    "label": "What did you like most about the event?",
                                    "required": False,
                                    "options": []
                                },
                                {
                                    "id": str(uuid.uuid4()),
                                    "type": "paragraph",
                                    "label": "What could be improved for next time?",
                                    "required": False,
                                    "options": []
                                }
                            ]
                        }
                    ]
                }
            }
        ]

        Form.objects.filter(is_template=True).delete()

        for t in templates:
            form = Form.objects.create(
                owner=admin_user,
                title=t["title"],
                description=t["description"],
                settings=t["settings"],
                is_template=True,
            )
            FormAccessSettings.objects.create(form=form)
            draft = FormVersion.objects.create(
                form=form,
                version=0,
                status=FormVersion.Status.DRAFT,
                schema=t["schema"],
            )
            form.draft_version = draft
            form.save(update_fields=["draft_version"])
            self.stdout.write(self.style.SUCCESS(f'Successfully created template "{t["title"]}"'))
