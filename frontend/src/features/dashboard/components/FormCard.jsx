import { useEffect, useRef, useState } from 'react';
import FormActionsMenu from './FormActionsMenu';
import { FileText } from 'lucide-react';

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

const getResponseCountClassName = (responseCount) => {
    if (responseCount?.status === 'ready') {
        return 'font-semibold text-primary';
    }

    return 'font-semibold text-secondary';
};

export const FormPreview = ({ title, description, schema, settings }) => {
    const primaryColor = settings?.theme_primary_color || '#8B5CF6';
    const headerImage = settings?.theme_header_image || null;
    
    const items = [];
    if (schema?.sections) {
        schema.sections.forEach(section => {
            if (section.questions) {
                section.questions.forEach(q => {
                    items.push(q);
                });
            }
        });
    }
    
    const previewItems = items.slice(0, 3);
    
    return (
        <div className="w-full h-full bg-[#F0F2F5] dark:bg-gray-900 rounded-t-lg overflow-hidden relative pointer-events-none group-hover:bg-[#E5E7EB] dark:group-hover:bg-gray-800 transition-colors">
            <div 
                className="absolute top-0 left-0 right-0 origin-top-left flex flex-col items-center gap-3 pt-6 pb-2 px-4"
                style={{
                    transform: 'scale(0.35)',
                    width: '285%',
                    height: '285%',
                }}
            >
                <div 
                    className="absolute top-0 left-0 right-0 h-4" 
                    style={{ backgroundColor: primaryColor }}
                />
                
                {headerImage && (
                    <div 
                        className="w-full max-w-2xl h-32 rounded-lg bg-cover bg-center mb-1" 
                        style={{ backgroundImage: `url(${headerImage})` }} 
                    />
                )}
                
                <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg border border-default p-5 shadow-sm flex flex-col gap-2" style={{ borderTop: `8px solid ${primaryColor}` }}>
                    <h1 className="text-3xl font-semibold text-primary">{title || 'Untitled form'}</h1>
                    {description && <p className="text-sm text-secondary">{description}</p>}
                </div>
                
                {previewItems.map((q, idx) => (
                    <div key={idx} className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg border border-default p-5 shadow-sm flex flex-col gap-3">
                        <p className="text-base font-medium text-primary">{q.title || 'Question'}</p>
                        
                        <div className="flex flex-col gap-2 mt-2">
                            {(q.type === 'multiple_choice' || q.type === 'checkboxes') ? (
                                (q.options || []).slice(0, 3).map((opt, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-4 h-4 flex-shrink-0 ${q.type === 'multiple_choice' ? 'rounded-full' : 'rounded-sm'} border-2 border-gray-300 dark:border-gray-600`} />
                                        <span className="text-sm text-secondary truncate">{opt.value || `Option ${i + 1}`}</span>
                                    </div>
                                ))
                            ) : q.type === 'short_answer' ? (
                                <div className="w-1/2 h-8 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600 border-dashed" />
                            ) : q.type === 'paragraph' ? (
                                <div className="w-full h-16 bg-gray-50 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-600 border-dashed" />
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FormCard = ({ form, responseCount, onRename, onDelete, onToggleTemplate, onClick }) => {
    const [copyStatus, setCopyStatus] = useState('');
    const copyTimerRef = useRef(null);

    useEffect(() => {
        return () => {
            if (copyTimerRef.current) {
                window.clearTimeout(copyTimerRef.current);
            }
        };
    }, []);

    const showCopyStatus = (message) => {
        setCopyStatus(message);

        if (copyTimerRef.current) {
            window.clearTimeout(copyTimerRef.current);
        }

        copyTimerRef.current = window.setTimeout(() => {
            setCopyStatus('');
        }, 2500);
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(
                `${window.location.origin}/forms/${form.id}/view`
            );
            showCopyStatus('Copied');
        } catch {
            showCopyStatus('Copy failed');
        }
    };

    return (
        <article
            className="group cursor-pointer rounded-lg border border-default bg-secondary outline-none transition hover:border-focus focus-visible:ring-2 focus-visible:ring-focus flex flex-col h-full"
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            tabIndex={0}
            role="button"
            aria-label={`View ${form.title}`}
        >
            <div className="h-36 rounded-t-lg bg-tertiary border-b border-default flex items-center justify-center text-muted group-hover:bg-default transition-colors overflow-hidden">
                <FormPreview title={form.title} description={form.description} schema={form.schema} settings={form.settings} />
            </div>

            <div className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-primary">
                        {form.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-secondary">
                            <FileText className="w-4 h-4 text-primary-500 flex-shrink-0" />
                            <p className="truncate">
                                {formatUpdatedAt(form.updated_at)}
                            </p>
                        </div>
                        {copyStatus && (
                            <span className="rounded-full bg-tertiary px-2 py-1 text-xs font-semibold text-primary-500">
                                {copyStatus}
                            </span>
                        )}
                    </div>
                </div>
                <FormActionsMenu
                    isTemplate={form.is_template}
                    onRename={() => onRename(form)}
                    onDelete={() => onDelete(form)}
                    onCopy={handleCopyLink}
                    onToggleTemplate={() => onToggleTemplate(!form.is_template)}
                />
            </div>
        </article>
    );
};

export default FormCard;
