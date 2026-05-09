import api from '../../../services/api';

export const login = async ({ email, password }) => {
    const response = await api.post('/api/auth/token/', { email, password });
    return response.data?.data || response.data;
};

export const register = async ({ email, password, confirm_password }) => {
    const response = await api.post('/api/accounts/register/', {
        email,
        password,
        confirm_password,
    });
    return response.data;
};

export const verifyOtp = async ({ email, code }) => {
    const response = await api.post('/api/accounts/verify-otp/', { email, code });
    return response.data;
};

export const resendOtp = async ({ email }) => {
    const response = await api.post('/api/accounts/resend-otp/', { email });
    return response.data;
};

export const googleLogin = async ({ accessToken }) => {
    const response = await api.post('/api/accounts/google/', {
        access_token: accessToken,
    });
    return response.data?.data || response.data;
};
