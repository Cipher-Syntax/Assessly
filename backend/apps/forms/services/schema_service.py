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
    """Validate a form schema against structural rules and hard limits.

    Limits (as per spec 22):
    - Max serialized size: 256 KB
    - Max sections: 25
    - Max questions per section: 100 (max total questions 500)
    - Max options per question: 50
    - Max label length: 200 characters
    - Max description length: 2000 characters
    - Max nesting depth: 6 (reject deeper structures)
    - Reject unknown keys at section and question level.
    """
    import json

    # Size limit check (before any other processing)
    try:
        serialized = json.dumps(schema)
    except Exception:
        raise serializers.ValidationError({"draft_schema": "Schema must be JSON serializable."})
    if len(serialized.encode("utf-8")) > 256 * 1024:
        raise serializers.ValidationError({"draft_schema": "Schema exceeds maximum size of 256 KB."})

    if not isinstance(schema, dict):
        raise serializers.ValidationError({"draft_schema": "Schema must be an object."})

    errors = {}
    sections = schema.get("sections")
    if sections is None:
        errors["sections"] = ["This field is required."]
    elif not isinstance(sections, list):
        errors["sections"] = ["Must be a list."]
    else:
        if len(sections) > 25:
            errors.setdefault("sections", []).append("Maximum of 25 sections allowed.")
        section_errors = []
        section_ids = set()
        question_ids = set()
        total_questions = 0
        for section in sections:
            section_error = {}
            if not isinstance(section, dict):
                section_errors.append({"non_field_errors": ["Section must be an object."]})
                continue
            # Reject unknown keys at section level
            allowed_section_keys = {"id", "title", "description", "questions"}
            unknown_keys = set(section.keys()) - allowed_section_keys
            if unknown_keys:
                section_error["unknown_keys"] = f"Unexpected keys: {', '.join(sorted(unknown_keys))}."

            section_id = section.get("id")
            if not section_id:
                section_error["id"] = "This field is required."
            elif not _is_valid_uuid(section_id):
                section_error["id"] = "Must be a valid UUID."
            elif section_id in section_ids:
                section_error["id"] = "Section id must be unique."
            else:
                section_ids.add(section_id)

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
            elif len(description) > 2000:
                section_error["description"] = "Description exceeds maximum length of 2000 characters."

            questions = section.get("questions")
            if questions is None:
                section_error["questions"] = "This field is required."
            elif not isinstance(questions, list):
                section_error["questions"] = "Must be a list."
            else:
                if len(questions) > 100:
                    section_error.setdefault("questions", []).append("Maximum of 100 questions per section allowed.")
                total_questions += len(questions)
                question_errors = []
                for question in questions:
                    question_error = {}
                    if not isinstance(question, dict):
                        question_errors.append({"non_field_errors": ["Question must be an object."]})
                        continue
                    # Reject unknown keys at question level
                    allowed_question_keys = {"id", "type", "label", "required", "options", "description"}
                    unknown_q_keys = set(question.keys()) - allowed_question_keys
                    if unknown_q_keys:
                        question_error["unknown_keys"] = f"Unexpected keys: {', '.join(sorted(unknown_q_keys))}."

                    question_id = question.get("id")
                    if not question_id:
                        question_error["id"] = "This field is required."
                    elif not _is_valid_uuid(question_id):
                        question_error["id"] = "Must be a valid UUID."
                    elif question_id in question_ids:
                        question_error["id"] = "Question id must be unique."
                    else:
                        question_ids.add(question_id)

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
                    elif len(label) > 200:
                        question_error["label"] = "Label exceeds maximum length of 200 characters."

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
                        elif len(options) > 50:
                            question_error["options"] = "Maximum of 50 options allowed."
                        elif any(
                            not isinstance(option, str) or not option.strip()
                            for option in options
                        ):
                            question_error["options"] = "Options must be non-empty strings."
                    elif "options" in question and options is not None:
                        if not isinstance(options, list):
                            question_error["options"] = "Must be a list."
                        elif len(options) > 50:
                            question_error["options"] = "Maximum of 50 options allowed."
                        elif any(
                            not isinstance(option, str) or not option.strip()
                            for option in options
                        ):
                            question_error["options"] = "Options must be non-empty strings."

                    question_errors.append(question_error)

                if _has_errors(question_errors):
                    section_error["questions"] = question_errors

            section_errors.append(section_error)

        if total_questions > 500:
            errors.setdefault("sections", []).append("Total number of questions across all sections cannot exceed 500.")
        if _has_errors(section_errors):
            errors["sections"] = section_errors

    # Depth check – we limit nesting to 6 levels (sections->questions only, so this is a safeguard)
    def _depth(obj, current=0):
        if isinstance(obj, dict):
            return max((_depth(v, current + 1) for v in obj.values()), default=current)
        if isinstance(obj, list):
            return max((_depth(i, current + 1) for i in obj), default=current)
        return current

    if _depth(schema) > 6:
        errors.setdefault("draft_schema", []).append("Schema nesting depth exceeds the maximum allowed of 6.")

    if errors:
        raise serializers.ValidationError(errors)

    return schema
