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

    const is_template = Boolean(form.is_template);

    return {
        id,
        title,
        updated_at,
        is_published,
        published_version_id,
        is_template,
    };
};

export const fetchForms = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page);
        if (params.search) queryParams.append('search', params.search);

        const response = await api.get(`/api/forms/?${queryParams.toString()}`);
        const payload = response?.data;

        // Check for DRF paginated response
        const isPaginated = payload && Array.isArray(payload.results);
        const rawForms = isPaginated ? payload.results : (Array.isArray(payload) ? payload : []);

        const forms = rawForms.map(normalizeForm).filter(Boolean);

        return { 
            forms, 
            count: isPaginated ? payload.count : forms.length,
            next: isPaginated ? payload.next : null,
            previous: isPaginated ? payload.previous : null,
            error: null 
        };
    } catch {
        return {
            forms: [],
            count: 0,
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

export const makeFormTemplate = async (formId, isTemplate) => {
    if (!formId) {
        return { form: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.patch(`/api/forms/${formId}/`, {
            is_template: isTemplate,
        });
        const normalized = normalizeForm(response?.data);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while updating the form.',
            };
        }

        return { form: normalized, error: null };
    } catch {
        return {
            form: null,
            error: 'Unable to update form template status right now.',
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

export const fetchTemplates = async () => {
    try {
        const response = await api.get('/api/forms/templates/');
        const payload = response?.data;
        
        // Check for DRF paginated response
        const isPaginated = payload && Array.isArray(payload.results);
        const rawForms = isPaginated ? payload.results : (Array.isArray(payload) ? payload : []);
        
        const templates = rawForms.map(normalizeForm).filter(Boolean);
        return { templates, error: null };
    } catch {
        return { templates: [], error: 'Unable to load templates.' };
    }
};

export const cloneForm = async (templateId) => {
    try {
        const response = await api.post(`/api/forms/${templateId}/clone/`, {});
        const payload = response?.data;
        const normalized = normalizeForm(payload);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while cloning the form.',
            };
        }

        return {
            form: { id: normalized.id, title: normalized.title },
            error: null,
        };
    } catch {
        return {
            form: null,
            error: 'Unable to clone the form right now.',
        };
    }
};
