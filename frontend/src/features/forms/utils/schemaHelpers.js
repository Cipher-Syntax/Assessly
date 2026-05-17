const ALLOWED_TYPES = new Set(['short_text', 'paragraph']);
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

export const createDefaultSection = () => ({
    id: crypto.randomUUID(),
    title: 'Section 1',
    description: '',
    questions: [],
});

export const createQuestion = (type) => {
    const normalizedType = ALLOWED_TYPES.has(type) ? type : 'short_text';

    return {
        id: crypto.randomUUID(),
        type: normalizedType,
        label: 'Untitled question',
        required: false,
    };
};

const normalizeQuestion = (question) => {
    if (!isRecord(question)) {
        return null;
    }

    const type = ALLOWED_TYPES.has(question.type) ? question.type : null;

    if (!type) {
        return null;
    }

    const id = isValidUuid(question.id) ? question.id : crypto.randomUUID();
    const label = isNonEmptyString(question.label) ? question.label : 'Untitled question';
    const required = typeof question.required === 'boolean' ? question.required : false;

    return {
        id,
        type,
        label,
        required,
    };
};

const normalizeSection = (section) => {
    const fallback = createDefaultSection();

    if (!isRecord(section)) {
        return fallback;
    }

    const id = isValidUuid(section.id) ? section.id : fallback.id;
    const title = isNonEmptyString(section.title) ? section.title : fallback.title;
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

export const normalizeSchema = (schema) => {
    if (!isRecord(schema) || !Array.isArray(schema.sections)) {
        return { sections: [createDefaultSection()] };
    }

    const sections = schema.sections.map(normalizeSection);

    if (sections.length === 0) {
        return { sections: [createDefaultSection()] };
    }

    return { sections };
};