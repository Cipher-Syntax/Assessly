import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../../../services/api';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../../constants/config';

const decodeToken = (token) => {
	try {
		return jwtDecode(token);
	} catch (error) {
		return null;
	}
};

const isJwtLike = (token) => typeof token === 'string' && token.split('.').length === 3;

const isExpired = (payload) => {
	if (!payload?.exp) {
		return true;
	}

	const now = Math.floor(Date.now() / 1000);
	return payload.exp <= now;
};

const clearTokens = () => {
	localStorage.removeItem(ACCESS_TOKEN);
	localStorage.removeItem(REFRESH_TOKEN);
};

const useAuthStatus = () => {
	const [authState, setAuthState] = useState({
		status: 'checking',
	});

	useEffect(() => {
		let isMounted = true;

		const updateState = (nextState) => {
			if (isMounted) {
				setAuthState(nextState);
			}
		};

		const evaluateAuth = async () => {
			const accessToken = localStorage.getItem(ACCESS_TOKEN);

			if (!accessToken) {
				updateState({ status: 'unauthenticated' });
				return;
			}

			if (!isJwtLike(accessToken)) {
				clearTokens();
				updateState({ status: 'unauthenticated' });
				return;
			}

			const payload = decodeToken(accessToken);

			if (!payload || isExpired(payload)) {
				const refreshToken = localStorage.getItem(REFRESH_TOKEN);

				if (!refreshToken) {
					clearTokens();
					updateState({ status: 'unauthenticated' });
					return;
				}

				try {
					const response = await api.post('/api/auth/token/refresh/', {
						refresh: refreshToken,
					});

					const newAccessToken = response?.data?.access;

					if (!newAccessToken) {
						clearTokens();
						updateState({ status: 'unauthenticated' });
						return;
					}

					localStorage.setItem(ACCESS_TOKEN, newAccessToken);

					const refreshedPayload = decodeToken(newAccessToken);

					if (!refreshedPayload || isExpired(refreshedPayload)) {
						clearTokens();
						updateState({ status: 'unauthenticated' });
						return;
					}

					updateState({
						status: 'authenticated',
					});
				} catch (error) {
					clearTokens();
					updateState({ status: 'unauthenticated' });
				}

				return;
			}

			updateState({
				status: 'authenticated',
			});
		};

		evaluateAuth();

		return () => {
			isMounted = false;
		};
	}, []);

	return authState;
};

export default useAuthStatus;
