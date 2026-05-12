import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import FormList from './components/FormList';
import { getForms } from './services/formsService';

const DashboardPage = () => {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadForms = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await getForms();
            setForms(data);
        } catch (loadError) {
            setError('Unable to load forms. Please try again.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadForms();
    }, [loadForms]);

    return (
        <DashboardLayout>
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-title font-semibold text-primary">Forms</h1>
                    <p className="mt-1 text-sm text-secondary">
                        Manage drafts, publishing, and responses in one place.
                    </p>
                </div>
                <Link
                    to="/forms/new"
                    className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-600"
                >
                    Create blank form
                </Link>
            </div>
            <div className="mt-6">
                <FormList forms={forms} loading={loading} error={error} onRetry={loadForms} />
            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;
