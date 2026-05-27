import json
from rest_framework import serializers
from django.test import TestCase
from apps.forms.services.schema_service import validate_schema

class SchemaLimitsTest(TestCase):
    def test_exceeds_max_size(self):
        # create a huge schema >256KB
        large = {"sections": [{"id": "1", "title": "t", "description": "d", "questions": []}]}
        # inflate description to exceed size
        large["sections"][0]["description"] = "x" * (260 * 1024)
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_schema(large)
        self.assertIn("Schema exceeds maximum size", str(ctx.exception))

    def test_too_many_sections(self):
        schema = {"sections": []}
        for i in range(30):
            schema["sections"].append({"id": f"{i}", "title": "t", "description": "d", "questions": []})
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_schema(schema)
        self.assertIn("Maximum of 25 sections", str(ctx.exception))

    def test_too_many_questions_per_section(self):
        questions = []
        for i in range(150):
            questions.append({"id": str(i), "type": "short_text", "label": "q", "required": True})
        schema = {"sections": [{"id": "1", "title": "t", "description": "d", "questions": questions}]}
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_schema(schema)
        self.assertIn("Maximum of 100 questions per section", str(ctx.exception))

    def test_total_questions_limit(self):
        schema = {"sections": []}
        qid = 0
        for s in range(6):
            sec_q = []
            for i in range(100):
                sec_q.append({"id": str(qid), "type": "short_text", "label": "q", "required": True})
                qid += 1
            schema["sections"].append({"id": str(s), "title": "t", "description": "d", "questions": sec_q})
        # adds 600 questions >500
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_schema(schema)
        self.assertIn("cannot exceed 500", str(ctx.exception))

    def test_label_and_description_length(self):
        schema = {"sections": [{"id": "1", "title": "t", "description": "d" * 2500, "questions": []}]}
        with self.assertRaises(serializers.ValidationError) as ctx:
            validate_schema(schema)
        self.assertIn("Description exceeds maximum length", str(ctx.exception))
        schema["sections"][0]["description"] = "d"
        schema["sections"][0]["questions"] = [{"id": "q1", "type": "short_text", "label": "l" * 250, "required": True}]
        with self.assertRaises(serializers.ValidationError) as ctx2:
            validate_schema(schema)
        self.assertIn("Label exceeds maximum length", str(ctx2.exception))
