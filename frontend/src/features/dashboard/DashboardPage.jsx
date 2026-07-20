import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import DeleteFormModal from './components/DeleteFormModal';
import EmptyState from './components/EmptyState';
import FormCard, { FormPreview } from './components/FormCard';
import RenameFormModal from './components/RenameFormModal';
import {
    createForm,
    deleteForm,
    fetchForms,
    fetchResponseCount,
    renameForm,
    fetchTemplates,
    cloneForm,
    makeFormTemplate,
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
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = (searchParams.get('q') || '').toLowerCase();
    const pageQuery = parseInt(searchParams.get('page') || '1', 10);
    
    const isMountedRef = useRef(true);
    const [status, setStatus] = useState('loading');
    const [forms, setForms] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);
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

    const [templates, setTemplates] = useState([]);
    const [showAllTemplates, setShowAllTemplates] = useState(false);
    const [showAllForms, setShowAllForms] = useState(false);
    
    useEffect(() => {
        let isMounted = true;
        isMountedRef.current = true;

        const loadForms = async () => {
            setStatus('loading');
            setErrorMessage('');
            setResponseCounts({});

            const [{ forms: ownedForms, count, next, previous, error }, { templates: loadedTemplates }] = await Promise.all([
                fetchForms({ search: searchQuery, page: pageQuery }),
                fetchTemplates()
            ]);

            if (!isMounted) {
                return;
            }

            setForms(ownedForms);
            setTemplates(loadedTemplates || []);
            setTotalCount(count);
            setHasNext(Boolean(next));
            setHasPrevious(Boolean(previous));

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
    }, [searchQuery, pageQuery]);

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
        setTemplates((currentTemplates) => currentTemplates.filter((t) => t.id !== formId));
        setResponseCounts((currentCounts) => {
            const nextCounts = { ...currentCounts };
            delete nextCounts[formId];
            return nextCounts;
        });
        setDeleteTarget(null);
        setIsDeleting(false);
    };

    const handleToggleTemplate = async (form, isTemplate) => {
        const { form: updatedForm, error } = await makeFormTemplate(form.id, isTemplate);
        
        if (!isMountedRef.current) return;
        
        if (error || !updatedForm) {
            // Might want to show a toast or alert, but for now we'll just log
            console.error(error || 'Failed to update template status');
            return;
        }
        
        setForms((currentForms) => 
            currentForms.map((f) => f.id === updatedForm.id ? { ...f, ...updatedForm } : f)
        );
        
        // Also update the templates gallery
        if (isTemplate) {
            setTemplates((current) => {
                if (current.find(t => t.id === updatedForm.id)) return current;
                return [updatedForm, ...current];
            });
        } else {
            setTemplates((current) => current.filter(t => t.id !== updatedForm.id));
        }
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

    const handlePageChange = (newPage) => {
        setSearchParams(prev => {
            const nextParams = new URLSearchParams(prev);
            nextParams.set('page', newPage.toString());
            return nextParams;
        });
    };

    const handleClone = async (templateId) => {
        if (isCreating) return;
        setIsCreating(true);
        setCreateError('');

        const { form, error } = await cloneForm(templateId);

        if (!isMountedRef.current) return;

        if (error || !form) {
            setCreateError(error || 'Unable to clone template right now.');
            setIsCreating(false);
            return;
        }

        navigate(`/forms/${form.id}/builder`, { state: { formTitle: form.title } });
    };

    const displayedTemplates = showAllTemplates ? templates : templates.slice(0, 4);
    const displayedForms = showAllForms ? forms : forms.slice(0, 5);

    return (
        <DashboardLayout>
            {/* Start a new form section */}
            <div className="bg-tertiary border-b border-default pb-8 pt-6">
                <div className="mx-auto max-w-6xl px-4 sm:px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-medium text-primary">Start a new form</h2>
                        <button 
                            onClick={() => setShowAllTemplates(!showAllTemplates)}
                            className="text-sm font-medium text-primary-500 hover:bg-secondary px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                        >
                            Template gallery
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                className={`transform transition-transform ${showAllTemplates ? 'rotate-180' : ''}`}
                            >
                                <polyline points="15 18 9 12 15 6"></polyline>
                            </svg>
                        </button>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        <button 
                            onClick={handleCreate} 
                            disabled={isCreating} 
                            className="group cursor-pointer rounded-lg border border-default bg-secondary outline-none transition hover:border-focus focus-visible:ring-2 focus-visible:ring-focus text-left h-full flex flex-col"
                        >
                            <div className="h-36 w-full rounded-t-lg bg-tertiary border-b border-default flex items-center justify-center text-muted group-hover:bg-default transition-colors">
                                <Plus className="w-16 h-16 text-primary-500 opacity-50" />
                            </div>
                            <div className="p-4 flex items-start justify-between gap-3 flex-1">
                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate text-sm font-semibold text-primary">
                                        Blank Form
                                    </h3>
                                </div>
                            </div>
                        </button>
                        
                        {displayedTemplates.map(template => (
                            <button 
                                key={template.id}
                                onClick={() => handleClone(template.id)} 
                                disabled={isCreating} 
                                className="group cursor-pointer rounded-lg border border-default bg-secondary outline-none transition hover:border-focus focus-visible:ring-2 focus-visible:ring-focus text-left h-full flex flex-col"
                            >
                                <div className="h-36 w-full rounded-t-lg bg-tertiary border-b border-default flex items-center justify-center text-muted group-hover:bg-default transition-colors relative overflow-hidden">
                                    <FormPreview title={template.title} description={template.description} schema={template.schema} settings={template.settings} />
                                </div>
                                <div className="p-4 flex items-start justify-between gap-3 flex-1">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="truncate text-sm font-semibold text-primary">
                                            {template.title}
                                        </h3>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    {createError && (
                        <p className="mt-2 text-sm text-danger">{createError}</p>
                    )}
                </div>
            </div>

            {/* Recent forms section */}
            <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-base font-medium text-primary">
                        {showAllForms ? 'All forms' : 'Recent forms'}
                    </h2>
                    <button 
                        onClick={() => setShowAllForms(!showAllForms)}
                        className="text-sm font-medium text-primary-500 hover:bg-tertiary px-3 py-1.5 rounded-md transition-colors flex items-center gap-1"
                    >
                        {showAllForms ? 'Hide all forms' : 'View all forms'}
                    </button>
                </div>

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

                {status === 'ready' && forms.length === 0 && !searchQuery && (
                    <div className="flex flex-col items-center justify-center py-12 text-secondary">
                        <p>No forms yet. Click "Blank" above to create one.</p>
                    </div>
                )}

                {status === 'ready' && forms.length === 0 && searchQuery && (
                    <div className="flex flex-col items-center justify-center py-12 text-secondary">
                        <p>No forms match your search.</p>
                    </div>
                )}

                {status === 'ready' && forms.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                        {displayedForms.map((form) => (
                                <FormCard
                                    key={form.id}
                                    form={form}
                                    responseCount={responseCounts[form.id]}
                                    onRename={handleOpenRename}
                                    onDelete={handleOpenDelete}
                                    onToggleTemplate={(isTemplate) => handleToggleTemplate(form, isTemplate)}
                                    onClick={() => handleRedirectForm(form.id)}
                                />
                        ))}
                    </div>
                )}
                
                {status === 'ready' && showAllForms && (hasPrevious || hasNext) && (
                    <div className="mt-8 flex items-center justify-between border-t border-default pt-4">
                        <p className="text-sm text-secondary">
                            Showing {(pageQuery - 1) * 12 + 1} to {Math.min(pageQuery * 12, totalCount)} of {totalCount} forms
                        </p>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handlePageChange(pageQuery - 1)}
                                disabled={!hasPrevious}
                                className="px-3 py-1 text-sm font-medium text-primary bg-secondary border border-default rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary transition-colors"
                            >
                                Previous
                            </button>
                            <button 
                                onClick={() => handlePageChange(pageQuery + 1)}
                                disabled={!hasNext}
                                className="px-3 py-1 text-sm font-medium text-primary bg-secondary border border-default rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary transition-colors"
                            >
                                Next
                            </button>
                        </div>
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
