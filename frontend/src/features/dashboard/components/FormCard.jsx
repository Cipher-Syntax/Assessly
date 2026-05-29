import { useEffect, useRef, useState } from 'react';
import FormActionsMenu from './FormActionsMenu';

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

const FormCard = ({ form, responseCount, onRename, onDelete, onClick }) => {
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
        <article className="rounded-lg border border-default bg-secondary p-4" onClick={onClick}>
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="wrap-break-words text-base font-semibold text-primary">
                        {form.title}
                    </h3>
                    <p className="mt-2 text-xs text-secondary">
                        {formatUpdatedAt(form.updated_at)}
                    </p>
                </div>
                <FormActionsMenu
                    onRename={() => onRename(form)}
                    onDelete={() => onDelete(form)}
                    onCopy={handleCopyLink}
                />
            </div>

            <div className="mt-5 flex min-h-5 flex-wrap items-center justify-between gap-2">
                <p
                    className="text-xs text-secondary"
                    title={responseCount?.error || undefined}
                >
                    Responses: {renderResponseCount()}
                </p>
                {copyStatus && (
                    <span className="rounded-full border border-default bg-tertiary px-2 py-1 text-xs font-semibold text-primary-500">
                        {copyStatus}
                    </span>
                )}
            </div>
        </article>
    );
};

export default FormCard;
