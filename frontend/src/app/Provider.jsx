import { GoogleOAuthProvider } from '@react-oauth/google';
import { ToastProvider } from './ToastProvider';
import { ThemeProvider } from './ThemeProvider';

const Provider = ({ children }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return (
        <GoogleOAuthProvider clientId={clientId}>
            <ThemeProvider>
                <ToastProvider>{children}</ToastProvider>
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
};

export default Provider;