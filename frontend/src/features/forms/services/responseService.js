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

const normalizeAttemptResponse = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const sessionId =
        Number.isInteger(payload.session_id) ? payload.session_id : null;

    if (sessionId === null) {
        return null;
    }

    const sessionUuid =
        typeof payload.session_uuid === 'string' ? payload.session_uuid : null;
    const formVersionId = payload.form_version_id ?? null;

    return {
        session_id: sessionId,
        session_uuid: sessionUuid,
        form_version_id: formVersionId,
    };
};

const normalizeEventResponse = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;

    if (id === undefined || id === null) {
        return null;
    }

    const eventType = typeof payload.event_type === 'string' ? payload.event_type : null;
    const occurredAt = typeof payload.occurred_at === 'string' ? payload.occurred_at : null;
    const metadata = isRecord(payload.metadata) ? payload.metadata : {};

    return {
        id,
        event_type: eventType,
        occurred_at: occurredAt,
        metadata,
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

export const submitResponse = async ({
    formId,
    answers,
    sessionUuid,
    sessionId,
    token,
}) => {
    if (!formId) {
        return { response: null, error: 'Missing form id.', fieldErrors: {} };
    }

    try {
        const payload = {
            answers,
            session_uuid: sessionUuid,
        };

        if (sessionId) {
            payload.session_id = sessionId;
        }

        const response = await publicApi.post(
            `/api/responses/forms/${formId}/submit/`,
            payload,
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

const resolveAttemptError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to start this attempt.';
    }

    if (status === 404) {
        return 'This form is not available.';
    }

    return 'Unable to start the response session right now.';
};

export const createResponseAttempt = async ({ formId, sessionUuid, token }) => {
    if (!formId) {
        return { attempt: null, error: 'Missing form id.', status: null };
    }

    if (!sessionUuid) {
        return { attempt: null, error: 'Missing session uuid.', status: null };
    }

    try {
        const response = await publicApi.post(
            `/api/responses/forms/${formId}/attempts/`,
            { session_uuid: sessionUuid },
            {
                headers: token ? { 'X-Form-Access-Token': token } : {},
            }
        );

        const normalized = normalizeAttemptResponse(response?.data);

        if (!normalized) {
            return {
                attempt: null,
                error: 'Unexpected response while starting the session.',
                status: response?.status ?? null,
            };
        }

        return {
            attempt: normalized,
            error: null,
            status: response?.status ?? null,
        };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            attempt: null,
            error: resolveAttemptError(status, payload),
            status: status ?? null,
        };
    }
};

const resolveEventError = (status, payload) => {
    if (isRecord(payload) && typeof payload.detail === 'string') {
        return payload.detail;
    }

    if (status === 403) {
        return 'You do not have access to log this event.';
    }

    if (status === 404) {
        return 'Session not found.';
    }

    return 'Unable to log the event right now.';
};

export const logResponseEvent = async ({
    sessionId,
    eventType,
    metadata,
    occurredAt,
    token,
}) => {
    if (!sessionId) {
        return { event: null, error: 'Missing session id.' };
    }

    if (!eventType) {
        return { event: null, error: 'Missing event type.' };
    }

    if (!occurredAt) {
        return { event: null, error: 'Missing event timestamp.' };
    }

    try {
        const response = await publicApi.post(
            `/api/responses/sessions/${sessionId}/events/`,
            {
                event_type: eventType,
                metadata: metadata || {},
                occurred_at: occurredAt,
            },
            {
                headers: token ? { 'X-Form-Access-Token': token } : {},
            }
        );

        const normalized = normalizeEventResponse(response?.data);

        if (!normalized) {
            return {
                event: null,
                error: 'Unexpected response while logging the event.',
            };
        }

        return { event: normalized, error: null };
    } catch (error) {
        const status = error?.response?.status;
        const payload = error?.response?.data;

        return {
            event: null,
            error: resolveEventError(status, payload),
        };
    }
};
