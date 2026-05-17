import api from '../../../services/api';
import { normalizeSchema } from '../utils/schemaHelpers';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizePublishedVersion = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const version = typeof payload.version === 'number' ? payload.version : null;
    const publishedAt = isNonEmptyString(payload.published_at)
        ? payload.published_at
        : null;

    return { id, version, publishedAt };
};

const normalizeFormDetail = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const title = isNonEmptyString(payload.title) ? payload.title : 'Untitled form';
    const description = typeof payload.description === 'string' ? payload.description : '';

    const draftSchema = normalizeSchema(payload.draft_schema);
    const publishedVersion = normalizePublishedVersion(payload.published_version);

    return {
        id,
        title,
        description,
        draftSchema,
        publishedVersion,
    };
};

export const fetchForm = async (id) => {
    if (!id) {
        return { form: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/forms/${id}/`);
        const normalized = normalizeFormDetail(response?.data);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while loading the form.',
            };
        }

        return { form: normalized, error: null };
    } catch {
        return {
            form: null,
            error: 'Unable to load the form right now.',
        };
    }
};

export const saveDraft = async ({ id, title, description, draftSchema }) => {
    if (!id) {
        return { form: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.patch(`/api/forms/${id}/`, {
            title,
            description,
            draft_schema: draftSchema,
        });

        const normalized = normalizeFormDetail(response?.data);

        if (!normalized) {
            return {
                form: null,
                error: 'Unexpected response while saving the draft.',
            };
        }

        return { form: normalized, error: null };
    } catch {
        return {
            form: null,
            error: 'Unable to save changes right now.',
        };
    }
};

export const publishForm = async (id) => {
    if (!id) {
        return { published: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.post(`/api/forms/${id}/publish/`);
        const published = normalizePublishedVersion(response?.data);

        if (!published) {
            return {
                published: null,
                error: 'Unexpected response while publishing the form.',
            };
        }

        return { published, error: null };
    } catch {
        return {
            published: null,
            error: 'Unable to publish the form right now.',
        };
    }
};