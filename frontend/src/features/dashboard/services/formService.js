import api from '../../../services/api';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeForm = (form) => {
    if (!isRecord(form)) {
        return null;
    }

    const id = form.id;

    if (id === undefined || id === null) {
        return null;
    }

    const title = isNonEmptyString(form.title) ? form.title : 'Untitled form';

    const updated_at = typeof form.updated_at === 'string' ? form.updated_at : null;
    const publishedVersion = isRecord(form.published_version) ? form.published_version : null;
    const is_published = Boolean(form.is_published || publishedVersion);
    const published_version_id =
        typeof form.published_version_id === 'number'
            ? form.published_version_id
            : typeof publishedVersion?.id === 'number'
                ? publishedVersion.id
                : null;

    return {
        id,
        title,
        updated_at,
        is_published,
        published_version_id,
    };
};

export const fetchForms = async () => {
    try {
        const response = await api.get('/api/forms/');
        const payload = response?.data;

        if (!Array.isArray(payload)) {
            return {
                forms: [],
                error: 'Unexpected response while loading forms.',
            };
        }

        const forms = payload.map(normalizeForm).filter(Boolean);

        return { forms, error: null };
    } catch {
        return {
            forms: [],
            error: 'Unable to load forms right now.',
        };
    }
};

export const fetchOwnedForms = fetchForms;

export const createForm = async () => {
    try {
        const response = await api.post('/api/forms/', {});
        const payload = response?.data;
        const normalized = normalizeForm(payload);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while creating the form.',
            };
        }

        return {
            form: { id: normalized.id, title: normalized.title },
            error: null,
        };
    } catch {
        return {
            form: null,
            error: 'Unable to create a form right now.',
        };
    }
};

export const renameForm = async (formId, title) => {
    if (!formId) {
        return { form: null, error: 'Missing form id.' };
    }

    const nextTitle = typeof title === 'string' ? title.trim() : '';

    if (!nextTitle) {
        return { form: null, error: 'Form title is required.' };
    }

    try {
        const response = await api.patch(`/api/forms/${formId}/`, {
            title: nextTitle,
        });
        const normalized = normalizeForm(response?.data);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while renaming the form.',
            };
        }

        return { form: normalized, error: null };
    } catch {
        return {
            form: null,
            error: 'Unable to rename the form right now.',
        };
    }
};

export const deleteForm = async (formId) => {
    if (!formId) {
        return { success: false, error: 'Missing form id.' };
    }

    try {
        await api.delete(`/api/forms/${formId}/`);
        return { success: true, error: null };
    } catch {
        return {
            success: false,
            error: 'Unable to delete the form right now.',
        };
    }
};

export const fetchResponseCount = async (formId) => {
    if (!formId) {
        return { count: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/responses/forms/${formId}/`);
        const payload = response?.data;

        if (!Array.isArray(payload)) {
            return {
                count: null,
                error: 'Unexpected response while loading responses.',
            };
        }

        return { count: payload.length, error: null };
    } catch {
        return {
            count: null,
            error: 'Unable to load response count.',
        };
    }
};
