import { GoogleOAuthProvider } from '@react-oauth/google';

const Provider = ({ children }) => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

    return <GoogleOAuthProvider clientId={clientId}>{children}</GoogleOAuthProvider>;
};

export default Provider;