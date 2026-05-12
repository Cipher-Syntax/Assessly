import EmptyState from './EmptyState';

const formatUpdatedAt = (value) => {
    if (!value) {
        return 'Updated recently';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Updated recently';
    }

    return `Updated ${date.toLocaleDateString()}`;
};

const FormList = ({ forms, loading, error, onRetry }) => {
    if (loading) {
        return (
            <div className="rounded-xl border border-default bg-tertiary p-4 text-sm text-secondary">
                Loading forms...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-default bg-tertiary p-4 text-sm text-secondary">
                <span>{error}</span>
                <button
                    type="button"
                    onClick={onRetry}
                    className="rounded-md border border-default px-3 py-1 text-xs font-semibold text-primary transition hover:border-focus hover:text-primary-500"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (!forms || forms.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-3">
            {forms.map((form) => (
                <div
                    key={form.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-default bg-tertiary px-4 py-3"
                >
                    <div>
                        <p className="text-sm font-semibold text-primary">{form.title}</p>
                        <p className="mt-1 text-xs text-secondary">{formatUpdatedAt(form.updatedAt)}</p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${form.isPublished
                                ? 'bg-primary-soft text-primary-500'
                                : 'border border-default text-secondary'
                            }`}
                    >
                        {form.isPublished ? 'Published' : 'Draft'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default FormList;
