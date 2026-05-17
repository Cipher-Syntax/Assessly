const ALLOWED_TYPES = new Set(['short_text', 'paragraph']);
const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isValidUuid = (value) => typeof value === 'string' && UUID_REGEX.test(value);

export const createDefaultSection = () => ({
    id: crypto.randomUUID(),
    title: 'Untitled section',
    description: '',
    questions: [],
});

export const createSection = () => createDefaultSection();

export const createQuestion = (type) => {
    const normalizedType = ALLOWED_TYPES.has(type) ? type : 'short_text';

    return {
        id: crypto.randomUUID(),
        type: normalizedType,
        label: 'Untitled question',
        required: false,
    };
};

const ensureUniqueId = (value, usedIds) => {
    let nextId = isValidUuid(value) ? value : crypto.randomUUID();

    while (usedIds.has(nextId)) {
        nextId = crypto.randomUUID();
    }

    usedIds.add(nextId);
    return nextId;
};

const normalizeQuestion = (question, usedQuestionIds) => {
    if (!isRecord(question)) {
        return null;
    }

    const type = ALLOWED_TYPES.has(question.type) ? question.type : null;

    if (!type) {
        return null;
    }

    const id = ensureUniqueId(question.id, usedQuestionIds);
    const label = isNonEmptyString(question.label) ? question.label : 'Untitled question';
    const required = typeof question.required === 'boolean' ? question.required : false;

    return {
        id,
        type,
        label,
        required,
    };
};

const normalizeSection = (section, usedSectionIds, usedQuestionIds) => {
    const fallback = createDefaultSection();

    if (!isRecord(section)) {
        return {
            ...fallback,
            id: ensureUniqueId(fallback.id, usedSectionIds),
        };
    }

    const id = ensureUniqueId(section.id ?? fallback.id, usedSectionIds);
    const title = isNonEmptyString(section.title) ? section.title : fallback.title;
    const description = typeof section.description === 'string' ? section.description : '';
    const questions = Array.isArray(section.questions)
        ? section.questions.map((question) => normalizeQuestion(question, usedQuestionIds)).filter(Boolean)
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
        return { sections: [createSection()] };
    }

    const usedSectionIds = new Set();
    const usedQuestionIds = new Set();
    const sections = schema.sections.map((section) =>
        normalizeSection(section, usedSectionIds, usedQuestionIds)
    );

    if (sections.length === 0) {
        return { sections: [createSection()] };
    }

    return { sections };
};

export const moveQuestion = (
    schema,
    sourceSectionId,
    targetSectionId,
    questionId,
    targetIndex
) => {
    if (!isRecord(schema) || !Array.isArray(schema.sections)) {
        return schema;
    }

    const sections = schema.sections.map((section) => ({
        ...section,
        questions: Array.isArray(section.questions) ? [...section.questions] : [],
    }));

    const sourceSection = sections.find((section) => section.id === sourceSectionId);
    const targetSection = sections.find((section) => section.id === targetSectionId);

    if (!sourceSection || !targetSection) {
        return schema;
    }

    const sourceIndex = sourceSection.questions.findIndex(
        (question) => question.id === questionId
    );

    if (sourceIndex === -1) {
        return schema;
    }

    const [movedQuestion] = sourceSection.questions.splice(sourceIndex, 1);

    if (!movedQuestion) {
        return schema;
    }

    let insertIndex =
        typeof targetIndex === 'number' && Number.isFinite(targetIndex)
            ? targetIndex
            : targetSection.questions.length;

    if (sourceSectionId === targetSectionId && insertIndex > sourceIndex) {
        insertIndex -= 1;
    }

    if (insertIndex < 0) {
        insertIndex = 0;
    }

    if (insertIndex > targetSection.questions.length) {
        insertIndex = targetSection.questions.length;
    }

    targetSection.questions.splice(insertIndex, 0, movedQuestion);

    return { sections };
};