import api from '../../../services/api';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeDraft = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const status = typeof payload.status === 'string' ? payload.status : null;
    const answers = isRecord(payload.answers) ? payload.answers : {};
    const updatedAt = typeof payload.updated_at === 'string' ? payload.updated_at : null;
    const formVersionId = payload.form_version_id ?? null;
    const sessionId = payload.session_id ?? null;
    const sessionUuid = typeof payload.session_uuid === 'string' ? payload.session_uuid : null;

    return {
        id,
        status,
        answers,
        updated_at: updatedAt,
        form_version_id: formVersionId,
        session_id: sessionId,
        session_uuid: sessionUuid,
    };
};

const resolveFetchError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to this form.';
    }

    if (status === 404) {
        return null;
    }

    return 'Unable to load the draft right now.';
};

const resolveSaveError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to this form.';
    }

    if (status === 400) {
        return 'Unable to save the draft.';
    }

    return 'Unable to save the draft right now.';
};

export const fetchDraft = async ({ formId, token }) => {
    if (!formId) {
        return { draft: null, error: 'Missing form id.', status: null };
    }

    try {
        const response = await api.get(`/api/responses/forms/${formId}/draft/`, {
            headers: token ? { 'X-Form-Access-Token': token } : {},
        });

        const normalized = normalizeDraft(response?.data);

        if (!normalized) {
            return {
                draft: null,
                error: 'Unexpected response while loading the draft.',
                status: response?.status ?? null,
            };
        }

        return { draft: normalized, error: null, status: response?.status ?? null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;
        const message = resolveFetchError(status, payload);

        return {
            draft: null,
            error: message,
            status: status ?? null,
        };
    }
};

export const saveDraft = async ({ formId, answers, sessionUuid, sessionId, token }) => {
    if (!formId) {
        return { draft: null, error: 'Missing form id.' };
    }

    if (!sessionUuid) {
        return { draft: null, error: 'Missing session uuid.' };
    }

    const payload = {
        answers: answers || {},
        session_uuid: sessionUuid,
    };

    if (sessionId) {
        payload.session_id = sessionId;
    }

    try {
        const response = await api.post(`/api/responses/forms/${formId}/draft/`, payload, {
            headers: token ? { 'X-Form-Access-Token': token } : {},
        });

        const normalized = normalizeDraft(response?.data);

        if (!normalized) {
            return {
                draft: null,
                error: 'Unexpected response while saving the draft.',
            };
        }

        return { draft: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            draft: null,
            error: resolveSaveError(status, payload),
        };
    }
};
