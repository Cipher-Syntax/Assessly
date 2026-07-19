import { BrowserRouter, Route, Routes } from 'react-router-dom';
import AuthForm from '../features/auth/AuthForm';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';
import LandingPage from '../features/landing/LandingPage';
import DashboardPage from '../features/dashboard/DashboardPage';
import FormBuilderPage from '../features/forms/FormBuilderPage';
import PublicFormPage from '../features/forms/PublicFormPage';
import SettingsPage from '../features/settings/SettingsPage';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<AuthForm mode="login" />} />
                <Route path="/register" element={<AuthForm mode="register" />} />
                <Route path="/forms/:id/view" element={<PublicFormPage />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/forms/:id/builder" element={<FormBuilderPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRoutes;