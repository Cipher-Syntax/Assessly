import uuid

from rest_framework import serializers

ALLOWED_QUESTION_TYPES = {
    "short_text",
    "paragraph",
    "multiple_choice",
    "checkboxes",
    "dropdown",
}
CHOICE_TYPES = {"multiple_choice", "checkboxes", "dropdown"}


def _is_valid_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False


def _has_errors(items):
    return any(bool(item) for item in items)


def validate_schema(schema):
    if not isinstance(schema, dict):
        raise serializers.ValidationError({"draft_schema": "Schema must be an object."})

    errors = {}
    sections = schema.get("sections")
    if sections is None:
        errors["sections"] = ["This field is required."]
    elif not isinstance(sections, list):
        errors["sections"] = ["Must be a list."]
    else:
        section_errors = []
        for section in sections:
            section_error = {}
            if not isinstance(section, dict):
                section_errors.append({"non_field_errors": ["Section must be an object."]})
                continue

            section_id = section.get("id")
            if not section_id:
                section_error["id"] = "This field is required."
            elif not _is_valid_uuid(section_id):
                section_error["id"] = "Must be a valid UUID."

            title = section.get("title")
            if title is None:
                section_error["title"] = "This field is required."
            elif not isinstance(title, str) or not title.strip():
                section_error["title"] = "Must be a non-empty string."

            description = section.get("description")
            if description is None:
                section_error["description"] = "This field is required."
            elif not isinstance(description, str):
                section_error["description"] = "Must be a string."

            questions = section.get("questions")
            if questions is None:
                section_error["questions"] = "This field is required."
            elif not isinstance(questions, list):
                section_error["questions"] = "Must be a list."
            else:
                question_errors = []
                for question in questions:
                    question_error = {}
                    if not isinstance(question, dict):
                        question_errors.append(
                            {"non_field_errors": ["Question must be an object."]}
                        )
                        continue

                    question_id = question.get("id")
                    if not question_id:
                        question_error["id"] = "This field is required."
                    elif not _is_valid_uuid(question_id):
                        question_error["id"] = "Must be a valid UUID."

                    question_type = question.get("type")
                    if question_type is None:
                        question_error["type"] = "This field is required."
                    elif question_type not in ALLOWED_QUESTION_TYPES:
                        question_error["type"] = "Invalid question type."

                    label = question.get("label")
                    if label is None:
                        question_error["label"] = "This field is required."
                    elif not isinstance(label, str) or not label.strip():
                        question_error["label"] = "Must be a non-empty string."

                    required = question.get("required")
                    if required is None:
                        question_error["required"] = "This field is required."
                    elif not isinstance(required, bool):
                        question_error["required"] = "Must be a boolean."

                    options = question.get("options")
                    if question_type in CHOICE_TYPES:
                        if options is None:
                            question_error["options"] = (
                                "This field is required for choice questions."
                            )
                        elif not isinstance(options, list) or not options:
                            question_error["options"] = "Must be a non-empty list."
                        elif any(
                            not isinstance(option, str) or not option.strip()
                            for option in options
                        ):
                            question_error["options"] = "Options must be non-empty strings."
                    elif "options" in question and options is not None:
                        if not isinstance(options, list):
                            question_error["options"] = "Must be a list."
                        elif any(
                            not isinstance(option, str) or not option.strip()
                            for option in options
                        ):
                            question_error["options"] = "Options must be non-empty strings."

                    question_errors.append(question_error)

                if _has_errors(question_errors):
                    section_error["questions"] = question_errors

            section_errors.append(section_error)

        if _has_errors(section_errors):
            errors["sections"] = section_errors

    if errors:
        raise serializers.ValidationError(errors)

    return schema
