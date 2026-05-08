import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStatus from '../hooks/useAuthStatus';

const LoadingScreen = () => {
    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-muted)] flex items-center justify-center">
            <p className="text-sm">Checking access...</p>
        </div>
    );
};

const ProtectedRoute = () => {
    const { status } = useAuthStatus();
    const location = useLocation();

    if (status === 'checking') {
        return <LoadingScreen />;
    }

    if (status === 'unauthenticated') {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (status === 'authenticated') {
        return <Outlet />;
    }

    return <Navigate to="/login" replace state={{ from: location }} />;
};

export default ProtectedRoute;
