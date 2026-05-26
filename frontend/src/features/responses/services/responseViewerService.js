import api from '../../../services/api';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeResponseListItem = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const submittedAt = typeof payload.submitted_at === 'string' ? payload.submitted_at : null;
    const createdAt = typeof payload.created_at === 'string' ? payload.created_at : null;
    const answers = isRecord(payload.answers) ? payload.answers : {};

    return {
        id,
        submitted_at: submittedAt,
        created_at: createdAt,
        answers,
    };
};

const normalizeResponseDetail = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const status = typeof payload.status === 'string' ? payload.status : null;
    const submittedAt = typeof payload.submitted_at === 'string' ? payload.submitted_at : null;
    const createdAt = typeof payload.created_at === 'string' ? payload.created_at : null;
    const answers = isRecord(payload.answers) ? payload.answers : {};
    const userId = payload.user_id ?? null;
    const sessionUuid = typeof payload.session_uuid === 'string' ? payload.session_uuid : null;
    const formVersionId = payload.form_version_id ?? null;

    return {
        id,
        status,
        submitted_at: submittedAt,
        created_at: createdAt,
        answers,
        user_id: userId,
        session_uuid: sessionUuid,
        form_version_id: formVersionId,
    };
};

const normalizeQuestion = (question, index) => {
    if (!isRecord(question)) {
        return null;
    }

    const id = question.id ?? `question-${index}`;
    const type = typeof question.type === 'string' ? question.type : 'short_text';
    const label = isNonEmptyString(question.label) ? question.label : `Question ${index + 1}`;
    const required = typeof question.required === 'boolean' ? question.required : false;
    const options = Array.isArray(question.options)
        ? question.options.filter((option) => typeof option === 'string')
        : [];

    return {
        id,
        type,
        label,
        required,
        options,
    };
};

const normalizeSection = (section, index) => {
    if (!isRecord(section)) {
        return null;
    }

    const id = section.id ?? `section-${index}`;
    const title = isNonEmptyString(section.title) ? section.title : `Section ${index + 1}`;
    const description = typeof section.description === 'string' ? section.description : '';
    const questions = Array.isArray(section.questions)
        ? section.questions.map(normalizeQuestion).filter(Boolean)
        : [];

    return {
        id,
        title,
        description,
        questions,
    };
};

const normalizePublishedSchema = (schema) => {
    if (!isRecord(schema) || !Array.isArray(schema.sections)) {
        return { sections: [] };
    }

    const sections = schema.sections.map(normalizeSection).filter(Boolean);

    return { sections };
};

const resolveResponsesError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to view responses.';
    }

    if (status === 404) {
        return 'Form not found.';
    }

    return 'Unable to load responses right now.';
};

const resolveDetailError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to view this response.';
    }

    if (status === 404) {
        return 'Response not found.';
    }

    return 'Unable to load the response details.';
};

const resolveSchemaError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 404) {
        return 'Published form not found.';
    }

    return 'Unable to load the published form schema.';
};

export const fetchResponses = async (formId) => {
    if (!formId) {
        return { responses: [], error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/responses/forms/${formId}/`);
        const payload = Array.isArray(response?.data) ? response.data : [];
        const normalized = payload.map(normalizeResponseListItem).filter(Boolean);

        return { responses: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            responses: [],
            error: resolveResponsesError(status, payload),
        };
    }
};

export const fetchResponseDetail = async (responseId) => {
    if (!responseId) {
        return { response: null, error: 'Missing response id.' };
    }

    try {
        const response = await api.get(`/api/responses/${responseId}/`);
        const normalized = normalizeResponseDetail(response?.data);

        if (!normalized) {
            return {
                response: null,
                error: 'Unexpected response while loading the response detail.',
            };
        }

        return { response: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            response: null,
            error: resolveDetailError(status, payload),
        };
    }
};

export const fetchPublishedSchema = async (formId) => {
    if (!formId) {
        return { schema: { sections: [] }, error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/forms/${formId}/public/`);
        const normalized = normalizePublishedSchema(response?.data?.published_schema);

        return { schema: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            schema: { sections: [] },
            error: resolveSchemaError(status, payload),
        };
    }
};
