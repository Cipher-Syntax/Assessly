import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import DeleteFormModal from './components/DeleteFormModal';
import EmptyState from './components/EmptyState';
import FormCard from './components/FormCard';
import RenameFormModal from './components/RenameFormModal';
import {
    createForm,
    deleteForm,
    fetchForms,
    fetchResponseCount,
    renameForm,
} from './services/formService';

const buildLoadingCountMap = (forms) =>
    forms.reduce((counts, form) => {
        counts[form.id] = { status: 'loading', count: null, error: null };
        return counts;
    }, {});

const FormCardSkeleton = () => (
    <div className="rounded-lg border border-default bg-secondary p-4 animate-pulse">
        <div className="h-4 w-3/4 rounded bg-tertiary" />
        <div className="mt-3 h-3 w-1/2 rounded bg-tertiary" />
        <div className="mt-6 h-3 w-1/3 rounded bg-tertiary" />
    </div>
);

const DashboardPage = () => {
    const navigate = useNavigate();
    const isMountedRef = useRef(true);
    const [status, setStatus] = useState('loading');
    const [forms, setForms] = useState([]);
    const [responseCounts, setResponseCounts] = useState({});
    const [errorMessage, setErrorMessage] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [createError, setCreateError] = useState('');
    const [renameTarget, setRenameTarget] = useState(null);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameError, setRenameError] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    useEffect(() => {
        let isMounted = true;
        isMountedRef.current = true;

        const loadForms = async () => {
            setStatus('loading');
            setErrorMessage('');
            setResponseCounts({});

            const { forms: ownedForms, error } = await fetchForms();

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
            setResponseCounts(buildLoadingCountMap(ownedForms));

            if (ownedForms.length === 0) {
                return;
            }

            const countEntries = await Promise.all(
                ownedForms.map(async (form) => {
                    const { count, error: countError } = await fetchResponseCount(form.id);

                    return [
                        form.id,
                        {
                            status: countError ? 'error' : 'ready',
                            count: countError ? null : count,
                            error: countError,
                        },
                    ];
                })
            );

            if (!isMounted) {
                return;
            }

            setResponseCounts((current) => ({
                ...current,
                ...Object.fromEntries(countEntries),
            }));
        };

        loadForms();

        return () => {
            isMounted = false;
            isMountedRef.current = false;
        };
    }, []);

    const handleOpenRename = (form) => {
        setRenameTarget(form);
        setRenameError('');
    };

    const handleCloseRename = () => {
        if (isRenaming) {
            return;
        }

        setRenameTarget(null);
        setRenameError('');
    };

    const handleRenameSubmit = async (title) => {
        if (!renameTarget || isRenaming) {
            return;
        }

        setIsRenaming(true);
        setRenameError('');

        const { form: renamedForm, error } = await renameForm(renameTarget.id, title);

        if (!isMountedRef.current) {
            return;
        }

        if (error || !renamedForm) {
            setRenameError(error || 'Unable to rename the form.');
            setIsRenaming(false);
            return;
        }

        setForms((currentForms) =>
            currentForms.map((form) =>
                form.id === renamedForm.id ? { ...form, ...renamedForm } : form
            )
        );
        setRenameTarget(null);
        setIsRenaming(false);
    };

    const handleOpenDelete = (form) => {
        setDeleteTarget(form);
        setDeleteError('');
    };

    const handleCloseDelete = () => {
        if (isDeleting) {
            return;
        }

        setDeleteTarget(null);
        setDeleteError('');
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || isDeleting) {
            return;
        }

        const formId = deleteTarget.id;
        setIsDeleting(true);
        setDeleteError('');

        const { success, error } = await deleteForm(formId);

        if (!isMountedRef.current) {
            return;
        }

        if (!success) {
            setDeleteError(error || 'Unable to delete the form.');
            setIsDeleting(false);
            return;
        }

        setForms((currentForms) => currentForms.filter((form) => form.id !== formId));
        setResponseCounts((currentCounts) => {
            const nextCounts = { ...currentCounts };
            delete nextCounts[formId];
            return nextCounts;
        });
        setDeleteTarget(null);
        setIsDeleting(false);
    };

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

    const handleRedirectForm = async (id) => {
        navigate(`/forms/${id}/builder`);
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <FormCardSkeleton key={`form-skeleton-${index}`} />
                        ))}
                    </div>
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
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 cursor-pointer">
                        {forms.map((form) => (
                            <FormCard
                                key={form.id}
                                form={form}
                                responseCount={responseCounts[form.id]}
                                onRename={handleOpenRename}
                                onDelete={handleOpenDelete}
                                onClick={() => handleRedirectForm(form.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <RenameFormModal
                key={renameTarget?.id || 'rename-form'}
                form={renameTarget}
                isOpen={Boolean(renameTarget)}
                isSaving={isRenaming}
                errorMessage={renameError}
                onClose={handleCloseRename}
                onSubmit={handleRenameSubmit}
            />
            <DeleteFormModal
                form={deleteTarget}
                isOpen={Boolean(deleteTarget)}
                isDeleting={isDeleting}
                errorMessage={deleteError}
                onClose={handleCloseDelete}
                onConfirm={handleDeleteConfirm}
            />
        </DashboardLayout>
    );
};

export default DashboardPage;
