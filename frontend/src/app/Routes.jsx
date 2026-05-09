import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom';
import AuthForm from '../features/auth/AuthForm';
import ProtectedForm from '../components/common/ProtectedForm';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import LandingPage from '../features/landing/LandingPage';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <RouterRoutes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthForm mode="login" />} />
                <Route path="/register" element={<AuthForm mode="register" />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<ProtectedForm />} />
                </Route>
            </RouterRoutes>
        </BrowserRouter>
    );
};

export default AppRoutes;