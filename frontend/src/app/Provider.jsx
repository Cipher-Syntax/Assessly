import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from './ToastProvider';

const Provider = ({ children }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ToastProvider>{children}</ToastProvider>
        </GoogleOAuthProvider>
    );
};

export default Provider;