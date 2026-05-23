import api from '../../../services/api';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const EDITOR_ACCESS_OPTIONS = ['restricted', 'link'];
const RESPONDER_ACCESS_OPTIONS = ['restricted', 'link', 'public'];
const ROLE_OPTIONS = ['editor', 'responder'];
const TOKEN_SCOPES = ['editor', 'responder'];

const normalizeAccessSettings = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const editorMode = payload.editor_access_mode;
    const responderMode = payload.responder_access_mode;

    if (!EDITOR_ACCESS_OPTIONS.includes(editorMode)) {
        return null;
    }

    if (!RESPONDER_ACCESS_OPTIONS.includes(responderMode)) {
        return null;
    }

    return {
        editor_access_mode: editorMode,
        responder_access_mode: responderMode,
    };
};

const normalizeRole = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const userId = payload.user_id;
    const email = payload.email;
    const role = payload.role;

    if (typeof userId !== 'number' || !Number.isFinite(userId)) {
        return null;
    }

    if (!isNonEmptyString(email)) {
        return null;
    }

    if (!ROLE_OPTIONS.includes(role)) {
        return null;
    }

    const createdAt = isNonEmptyString(payload.created_at) ? payload.created_at : null;

    return {
        user_id: userId,
        email,
        role,
        created_at: createdAt,
    };
};

const normalizeToken = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;
    const scope = payload.scope;

    if (typeof id !== 'number' || !Number.isFinite(id)) {
        return null;
    }

    if (!TOKEN_SCOPES.includes(scope)) {
        return null;
    }

    const isActive = Boolean(payload.is_active);
    const expiresAt = isNonEmptyString(payload.expires_at) ? payload.expires_at : null;
    const createdAt = isNonEmptyString(payload.created_at) ? payload.created_at : null;
    const lastUsedAt = isNonEmptyString(payload.last_used_at) ? payload.last_used_at : null;

    return {
        id,
        scope,
        is_active: isActive,
        expires_at: expiresAt,
        created_at: createdAt,
        last_used_at: lastUsedAt,
    };
};

const normalizeCreatedToken = (payload) => {
    if (!isRecord(payload)) {
        return null;
    }

    const id = payload.id;
    const scope = payload.scope;
    const token = payload.token;

    if (typeof id !== 'number' || !Number.isFinite(id)) {
        return null;
    }

    if (!TOKEN_SCOPES.includes(scope)) {
        return null;
    }

    if (!isNonEmptyString(token)) {
        return null;
    }

    const createdAt = isNonEmptyString(payload.created_at) ? payload.created_at : null;
    const expiresAt = isNonEmptyString(payload.expires_at) ? payload.expires_at : null;

    return {
        id,
        scope,
        token,
        created_at: createdAt,
        expires_at: expiresAt,
        is_active: true,
        last_used_at: null,
    };
};

export const getAccessSettings = async (formId) => {
    if (!formId) {
        return { settings: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/permissions/forms/${formId}/settings/`);
        const settings = normalizeAccessSettings(response?.data);

        if (!settings) {
            return { settings: null, error: 'Unexpected response while loading settings.' };
        }

        return { settings, error: null };
    } catch {
        return { settings: null, error: 'Unable to load access settings right now.' };
    }
};

export const updateAccessSettings = async (formId, payload) => {
    if (!formId) {
        return { settings: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.put(`/api/permissions/forms/${formId}/settings/`, payload);
        const settings = normalizeAccessSettings(response?.data);

        if (!settings) {
            return { settings: null, error: 'Unexpected response while saving settings.' };
        }

        return { settings, error: null };
    } catch {
        return { settings: null, error: 'Unable to update access settings right now.' };
    }
};

export const lookupUser = async (formId, email) => {
    if (!formId) {
        return { user: null, error: 'Missing form id.' };
    }

    if (!isNonEmptyString(email)) {
        return { user: null, error: 'Enter a valid email address.' };
    }

    try {
        const response = await api.get(
            `/api/permissions/forms/${formId}/lookup/?email=${encodeURIComponent(email)}`
        );
        const payload = response?.data;

        if (!isRecord(payload)) {
            return { user: null, error: 'Unexpected response while looking up the user.' };
        }

        const userId = payload.user_id;
        const userEmail = payload.email;

        if (typeof userId !== 'number' || !Number.isFinite(userId) || !isNonEmptyString(userEmail)) {
            return { user: null, error: 'Unexpected response while looking up the user.' };
        }

        return { user: { user_id: userId, email: userEmail }, error: null };
    } catch (error) {
        if (error?.response?.status === 404) {
            return { user: null, error: 'No account found with that email.' };
        }

        return { user: null, error: 'Unable to look up that email right now.' };
    }
};

export const listRoles = async (formId) => {
    if (!formId) {
        return { roles: [], error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/permissions/forms/${formId}/roles/`);
        const payload = response?.data;

        if (!Array.isArray(payload)) {
            return { roles: [], error: 'Unexpected response while loading roles.' };
        }

        const roles = payload.map(normalizeRole).filter(Boolean);
        return { roles, error: null };
    } catch {
        return { roles: [], error: 'Unable to load role assignments right now.' };
    }
};

export const assignRole = async (formId, userId, role) => {
    if (!formId) {
        return { role: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.post(`/api/permissions/forms/${formId}/roles/`, {
            user_id: userId,
            role,
        });
        const normalized = normalizeRole(response?.data);

        if (!normalized) {
            return { role: null, error: 'Unexpected response while assigning the role.' };
        }

        return { role: normalized, error: null };
    } catch (error) {
        if (error?.response?.status === 400) {
            return { role: null, error: error?.response?.data?.detail || 'Unable to assign role.' };
        }

        return { role: null, error: 'Unable to assign role right now.' };
    }
};

export const removeRole = async (formId, userId) => {
    if (!formId) {
        return { success: false, error: 'Missing form id.' };
    }

    try {
        await api.delete(`/api/permissions/forms/${formId}/roles/${userId}/`);
        return { success: true, error: null };
    } catch {
        return { success: false, error: 'Unable to remove that role right now.' };
    }
};

export const listTokens = async (formId) => {
    if (!formId) {
        return { tokens: [], error: 'Missing form id.' };
    }

    try {
        const response = await api.get(`/api/permissions/forms/${formId}/tokens/`);
        const payload = response?.data;

        if (!Array.isArray(payload)) {
            return { tokens: [], error: 'Unexpected response while loading tokens.' };
        }

        const tokens = payload.map(normalizeToken).filter(Boolean);
        return { tokens, error: null };
    } catch {
        return { tokens: [], error: 'Unable to load link tokens right now.' };
    }
};

export const createToken = async (formId, scope) => {
    if (!formId) {
        return { token: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.post(`/api/permissions/forms/${formId}/tokens/`, {
            scope,
        });
        const token = normalizeCreatedToken(response?.data);

        if (!token) {
            return { token: null, error: 'Unexpected response while generating the token.' };
        }

        return { token, error: null };
    } catch {
        return { token: null, error: 'Unable to generate a link token right now.' };
    }
};

export const revokeToken = async (formId, tokenId) => {
    if (!formId) {
        return { token: null, error: 'Missing form id.' };
    }

    try {
        const response = await api.post(
            `/api/permissions/forms/${formId}/tokens/${tokenId}/revoke/`
        );
        const token = normalizeToken(response?.data);

        if (!token) {
            return { token: null, error: 'Unexpected response while revoking the token.' };
        }

        return { token, error: null };
    } catch {
        return { token: null, error: 'Unable to revoke that token right now.' };
    }
};
