from rest_framework import serializers

TEXT_TYPES = {"short_text", "paragraph"}
CHOICE_TYPES = {"multiple_choice", "dropdown", "checkboxes"}


def _is_empty(value):
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, list):
        return len(value) == 0
    return False


def _flatten_questions(schema):
    sections = schema.get("sections") if isinstance(schema, dict) else None
    if not isinstance(sections, list):
        return []
    questions = []
    for section in sections:
        if not isinstance(section, dict):
            continue
        for question in section.get("questions", []):
            if isinstance(question, dict) and question.get("id"):
                questions.append(question)
    return questions


def validate_answers(schema, answers):
    if not isinstance(answers, dict):
        raise serializers.ValidationError({"answers": "Answers must be an object."})

    question_map = {
        str(question.get("id")): question
        for question in _flatten_questions(schema)
        if question.get("id")
    }
    errors = {}

    unknown_ids = [
        str(question_id)
        for question_id in answers.keys()
        if str(question_id) not in question_map
    ]
    if unknown_ids:
        errors["unknown_question_ids"] = unknown_ids

    required_errors = {}
    for question_id, question in question_map.items():
        if not question.get("required"):
            continue
        if question_id not in answers or _is_empty(answers.get(question_id)):
            required_errors[question_id] = "This question is required."

    if required_errors:
        errors["required"] = required_errors

    answer_errors = {}
    for question_id, value in answers.items():
        question = question_map.get(str(question_id))
        if not question:
            continue
        question_type = question.get("type")
        options = question.get("options") or []

        if question_type in TEXT_TYPES:
            if not isinstance(value, str):
                answer_errors[str(question_id)] = "Must be a string."
        elif question_type in {"multiple_choice", "dropdown"}:
            if not isinstance(value, str):
                answer_errors[str(question_id)] = "Must be a string."
            elif value not in options:
                answer_errors[str(question_id)] = "Invalid option."
        elif question_type == "checkboxes":
            if not isinstance(value, list):
                answer_errors[str(question_id)] = "Must be a list of strings."
            elif any(not isinstance(item, str) for item in value):
                answer_errors[str(question_id)] = "Must be a list of strings."
            elif any(item not in options for item in value):
                answer_errors[str(question_id)] = "Invalid option."
        else:
            answer_errors[str(question_id)] = "Unsupported question type."

    if answer_errors:
        errors["answers"] = answer_errors

    if errors:
        raise serializers.ValidationError(errors)

    return answers
