import { Link } from 'react-router-dom';
import DashboardLayout from '../dashboard/components/DashboardLayout';

const FormBuilderPlaceholder = () => {
    return (
        <DashboardLayout>
            <div className="space-y-3">
                <h1 className="text-title font-semibold text-primary">Form builder</h1>
                <p className="text-sm text-secondary">Builder coming next.</p>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-primary-500 transition hover:text-primary-600"
                >
                    Back to dashboard
                </Link>
            </div>
        </DashboardLayout>
    );
};

export default FormBuilderPlaceholder;
