import publicApi from '../../../services/publicApi';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

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

    const sections = schema.sections
        .map(normalizeSection)
        .filter(Boolean);

    return { sections };
};

const normalizePublicForm = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const title = isNonEmptyString(payload.title) ? payload.title : 'Untitled form';
    const description = typeof payload.description === 'string' ? payload.description : '';
    const publishedSchema = normalizePublishedSchema(payload.published_schema);

    return {
        id,
        title,
        description,
        publishedSchema,
    };
};

export const fetchPublicForm = async ({ id, token }) => {
    if (!id) {
        return { form: null, error: 'Missing form id.' };
    }

    try {
        const response = await publicApi.get(`/api/forms/${id}/public/`, {
            params: token ? { token } : {},
        });
        const normalized = normalizePublicForm(response?.data);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while loading the form.',
            };
        }

        return { form: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;

        if (status === 403) {
            return {
                form: null,
                error: 'This form link is invalid or expired, or you do not have access.',
            };
        }

        if (status === 404) {
            return {
                form: null,
                error: 'This form is not available.',
            };
        }

        return {
            form: null,
            error: 'Unable to load the form right now.',
        };
    }
};
