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

    const renderResponseCount = () => {
        if (!responseCount || responseCount.status === 'loading') {
            return (
                <span className="inline-block h-3 w-10 rounded bg-tertiary animate-pulse" />
            );
        }

        if (responseCount.status === 'error') {
            return <span className={getResponseCountClassName(responseCount)}>--</span>;
        }

        if (typeof responseCount.count === 'number') {
            return (
                <span className={getResponseCountClassName(responseCount)}>
                    {responseCount.count}
                </span>
            );
        }

        return <span className={getResponseCountClassName(responseCount)}>--</span>;
    };

    return (
        <article
            className="group cursor-pointer rounded-lg border border-default bg-secondary outline-none transition hover:border-focus focus-visible:ring-2 focus-visible:ring-focus"
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
            <div className="h-36 rounded-t-lg bg-tertiary border-b border-default flex items-center justify-center text-muted group-hover:bg-default transition-colors">
                <FileText className="w-16 h-16 text-primary-500 opacity-50" />
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
