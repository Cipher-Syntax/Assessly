import axios from 'axios';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../constants/config';

const api = axios.create({
	baseURL: import.meta.env.VITE_API_URL,
	headers: {
		'ngrok-skip-browser-warning': 'true',
		'Content-Type': 'application/json',
	},
});

api.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem(ACCESS_TOKEN);
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => Promise.reject(error)
);

api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (!originalRequest) {
			return Promise.reject(error);
		}

		const isTokenError =
			error.response?.status === 401 ||
			error.response?.data?.code === 'token_not_valid';

		const isRefreshEndpoint = originalRequest.url?.includes(
			'/api/auth/token/refresh/'
		);

		if (isTokenError && !originalRequest._retry && !isRefreshEndpoint) {
			originalRequest._retry = true;

			const refreshToken = localStorage.getItem(REFRESH_TOKEN);

			if (!refreshToken) {
				localStorage.removeItem(ACCESS_TOKEN);
				localStorage.removeItem(REFRESH_TOKEN);
				window.location.replace('/login');
				return Promise.reject(error);
			}

			try {
				const res = await api.post('/api/auth/token/refresh/', {
					refresh: refreshToken,
				});

				const newAccessToken = res.data.access;

				if (newAccessToken) {
					localStorage.setItem(ACCESS_TOKEN, newAccessToken);
					originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
					return api(originalRequest);
				}
			} catch (refreshError) {
				localStorage.removeItem(ACCESS_TOKEN);
				localStorage.removeItem(REFRESH_TOKEN);
				window.location.replace('/login');
				return Promise.reject(refreshError);
			}

			localStorage.removeItem(ACCESS_TOKEN);
			localStorage.removeItem(REFRESH_TOKEN);
			window.location.replace('/login');
		}

		return Promise.reject(error);
	}
);

export default api;
