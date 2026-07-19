import api from '../../../services/api';

export const fetchSettings = async () => {
    try {
        const response = await api.get('/api/accounts/settings/');
        return { settings: response.data, error: null };
    } catch (err) {
        return { settings: null, error: err.response?.data?.detail || 'Failed to fetch settings' };
    }
};

export const updateSettings = async (data) => {
    try {
        const response = await api.patch('/api/accounts/settings/', data);
        return { settings: response.data, error: null };
    } catch (err) {
        return { settings: null, error: err.response?.data?.detail || 'Failed to update settings' };
    }
};
