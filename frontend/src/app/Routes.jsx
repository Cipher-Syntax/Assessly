import { BrowserRouter, Route, Routes as RouterRoutes } from 'react-router-dom';
import AuthForm from '../components/common/AuthForm';
import ProtectedForm from '../components/common/ProtectedForm';
import ProtectedRoute from '../features/auth/components/ProtectedRoute';

const AppRoutes = () => {
    return (
        <BrowserRouter>
            <RouterRoutes>
                <Route path="/login" element={<AuthForm />} />
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<ProtectedForm />} />
                </Route>
            </RouterRoutes>
        </BrowserRouter>
    );
};

export default AppRoutes;