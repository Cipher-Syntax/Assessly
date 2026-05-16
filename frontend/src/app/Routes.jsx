import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom';
import AuthForm from '../features/auth/AuthForm';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import LandingPage from '../features/landing/LandingPage';
import DashboardPage from '../features/dashboard/DashboardPage';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <RouterRoutes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthForm mode="login" />} />
                <Route path="/register" element={<AuthForm mode="register" />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                </Route>
            </RouterRoutes>
        </BrowserRouter>
    );
};

export default AppRoutes;