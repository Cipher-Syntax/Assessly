import publicApi from '../../../services/publicApi';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const normalizeSubmitResponse = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const status = typeof payload.status === 'string' ? payload.status : null;
    const submittedAt = typeof payload.submitted_at === 'string' ? payload.submitted_at : null;
    const formVersionId = payload.form_version_id ?? null;

    return {
        id,
        status,
        submitted_at: submittedAt,
        form_version_id: formVersionId,
    };
};

const extractFieldErrors = (payload) => {
    if (!isRecord(payload)) {
        return {};
    }

    const fieldErrors = {};

    if (isRecord(payload.required)) {
        Object.entries(payload.required).forEach(([questionId, message]) => {
            if (typeof message === 'string') {
                fieldErrors[questionId] = message;
            }
        });
    }

    if (isRecord(payload.answers)) {
        Object.entries(payload.answers).forEach(([questionId, message]) => {
            if (typeof message === 'string' && !fieldErrors[questionId]) {
                fieldErrors[questionId] = message;
            }
        });
    }

    return fieldErrors;
};

const resolveErrorMessage = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (isRecord(payload) && Array.isArray(payload.unknown_question_ids)) {
        return 'Some answers did not match the form questions.';
    }

    if (status === 403) {
        return 'You do not have access to submit this form.';
    }

    if (status === 404) {
        return 'This form is not available.';
    }

    if (status === 400) {
        return 'Please review the highlighted questions.';
    }

    return 'Unable to submit the response right now.';
};

export const submitResponse = async ({ formId, answers, sessionUuid, token }) => {
    if (!formId) {
        return { response: null, error: 'Missing form id.', fieldErrors: {} };
    }

    try {
        const response = await publicApi.post(
            `/api/responses/forms/${formId}/submit/`,
            {
                answers,
                session_uuid: sessionUuid,
            },
            {
                headers: token ? { 'X-Form-Access-Token': token } : {},
            }
        );

        const normalized = normalizeSubmitResponse(response?.data);

        if (!normalized) {
            return {
                response: null,
                error: 'Unexpected response while submitting the form.',
                fieldErrors: {},
            };
        }

        return { response: normalized, error: null, fieldErrors: {} };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;
        const fieldErrors = extractFieldErrors(payload);

        if (status === 400 && Object.keys(fieldErrors).length > 0) {
            return { response: null, error: null, fieldErrors };
        }

        return {
            response: null,
            error: resolveErrorMessage(status, payload),
            fieldErrors,
        };
    }
};
