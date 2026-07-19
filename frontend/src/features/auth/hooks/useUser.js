import { useMemo } from 'react';
import { jwtDecode } from 'jwt-decode';
import { ACCESS_TOKEN } from '../../../constants/config';

export const useUser = () => {
    return useMemo(() => {
        const token = localStorage.getItem(ACCESS_TOKEN);
        if (!token) return null;
        try {
            const payload = jwtDecode(token);
            return payload;
        } catch {
            return null;
        }
    }, []);
};
