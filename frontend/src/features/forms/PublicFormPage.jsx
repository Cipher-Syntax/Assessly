import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import PublicSection from './components/PublicSection';
import { fetchPublicForm } from './services/publicFormService';

const PublicFormPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';

    const [status, setStatus] = useState('loading');
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let isMounted = true;

        const loadForm = async () => {
            setStatus('loading');
            setError('');

            const { form: publicForm, error: loadError } = await fetchPublicForm({
                id,
                token,
            });

            if (!isMounted) {
                return;
            }

            if (loadError || !publicForm) {
                setStatus('error');
                setError(loadError || 'Unable to load this form.');
                return;
            }

            setForm(publicForm);
            setStatus('ready');
        };

        loadForm();

        return () => {
            isMounted = false;
        };
    }, [id, token]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-6 py-10">
                <p className="text-sm text-secondary">Loading form...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary px-6 py-10">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <div className="rounded-xl border border-default bg-secondary px-6 py-6 text-center">
                        <h1 className="text-lg font-semibold text-primary">
                            Unable to load form
                        </h1>
                        <p className="mt-2 text-sm text-secondary">
                            {error || 'Please try again in a moment.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const sections = form?.publishedSchema?.sections || [];

    return (
        <div className="min-h-screen bg-primary text-primary px-6 py-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <header className="rounded-xl border border-default bg-secondary p-6">
                    <h1 className="text-title font-semibold text-primary">
                        {form?.title || 'Untitled form'}
                    </h1>
                    {form?.description && (
                        <p className="mt-2 text-sm text-secondary">
                            {form.description}
                        </p>
                    )}
                </header>

                {sections.map((section, index) => (
                    <PublicSection
                        key={section.id || `section-${index}`}
                        section={section}
                        index={index}
                    />
                ))}
            </div>
        </div>
    );
};

export default PublicFormPage;
