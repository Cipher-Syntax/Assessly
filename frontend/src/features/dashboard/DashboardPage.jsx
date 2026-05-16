import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import EmptyState from './components/EmptyState';
import { fetchOwnedForms } from './services/formService';

const formatUpdatedAt = (value) => {
    if (!value) {
        return 'Updated recently';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Updated recently';
    }

    return `Updated ${date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })}`;
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState('loading');
    const [forms, setForms] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadForms = async () => {
            setStatus('loading');
            const { forms: ownedForms, error } = await fetchOwnedForms();

            if (!isMounted) {
                return;
            }

            setForms(ownedForms);

            if (error) {
                setErrorMessage(error);
                setStatus('error');
                return;
            }

            setErrorMessage('');
            setStatus('ready');
        };

        loadForms();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleCreate = () => {
        navigate('/forms/new');
    };

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6">
                <header>
                    <h1 className="text-title font-semibold text-primary">Your forms</h1>
                    <p className="mt-2 text-sm text-secondary">
                        Manage drafts, review published forms, and track submissions in one place.
                    </p>
                </header>

                {status === 'loading' && (
                    <p className="text-sm text-secondary">Loading forms...</p>
                )}

                {status === 'error' && (
                    <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
                        {errorMessage || 'Something went wrong while loading forms.'}
                    </div>
                )}

                {status === 'ready' && forms.length === 0 && (
                    <EmptyState onCreate={handleCreate} />
                )}

                {status === 'ready' && forms.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {forms.map((form) => (
                            <div
                                key={form.id}
                                className="rounded-xl border border-default bg-secondary p-4"
                            >
                                <h3 className="text-base font-semibold text-primary">
                                    {form.title}
                                </h3>
                                <p className="mt-2 text-xs text-secondary">
                                    {formatUpdatedAt(form.updated_at)}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default DashboardPage;