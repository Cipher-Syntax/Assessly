import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import EmptyState from './components/EmptyState';
import { createForm, fetchOwnedForms } from './services/formService';
import ShareModal from '../permissions/components/ShareModal';

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
    const isMountedRef = useRef(true);
    const [status, setStatus] = useState('loading');
    const [forms, setForms] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [shareFormId, setShareFormId] = useState(null);

    useEffect(() => {
        let isMounted = true;
        isMountedRef.current = true;

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
            isMountedRef.current = false;
        };
    }, []);

    const handleCreate = async () => {
        if (isCreating) {
            return;
        }

        setIsCreating(true);
        setCreateError('');

        const { form, error } = await createForm();

        if (!isMountedRef.current) {
            return;
        }

        if (error || !form) {
            setCreateError(error || 'Unable to create a form right now.');
            setIsCreating(false);
            return;
        }

        navigate(`/forms/${form.id}/builder`, { state: { formTitle: form.title } });
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
                    <EmptyState
                        onCreate={handleCreate}
                        isCreating={isCreating}
                        errorMessage={createError}
                    />
                )}

                {status === 'ready' && forms.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {forms.map((form) => (
                            <div
                                key={form.id}
                                className="rounded-xl border border-default bg-secondary p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-base font-semibold text-primary">
                                            {form.title}
                                        </h3>
                                        <p className="mt-2 text-xs text-secondary">
                                            {formatUpdatedAt(form.updated_at)}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShareFormId(form.id)}
                                        className="rounded-lg border border-default bg-tertiary px-3 py-1 text-xs font-semibold text-secondary transition hover:text-primary"
                                    >
                                        Share
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {shareFormId && (
                <ShareModal
                    formId={shareFormId}
                    isOpen={Boolean(shareFormId)}
                    onClose={() => setShareFormId(null)}
                />
            )}
        </DashboardLayout>
    );
};

export default DashboardPage;