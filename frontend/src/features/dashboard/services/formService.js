import api from '../../../services/api';

const isRecord = (value) => value !== null & typeof value === 'object' && !Array.isArray(value);

const normalizeForm = (form) => {
    if (!isRecord(form)) {
        return null;
    }

    const id = form.id;

    if (id === undefined || id === null) {
        return null;
    }

    const title =
        typeof form.title === 'string' && form.title.trim().length > 0
            ? form.title
            : 'Untitled form';

    const updated_at = typeof form.updated_at === 'string' ? form.updated_at : null;
    const is_published = Boolean(form.is_published);
    const published_version_id =
        typeof form.published_version_id === 'number' ? form.published_version_id : null;

    return {
        id,
        title,
        updated_at,
        is_published,
        published_version_id,
    };
};

export const fetchOwnedForms = async () => {
    try {
        const response = await api.get('api/forms/');
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

export const createForm = async () => {
    try {
        const response = await api.post('api/forms/', {});
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