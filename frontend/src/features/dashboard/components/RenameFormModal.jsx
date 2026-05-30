import { useState } from 'react';

const RenameFormModal = ({
    form,
    isOpen,
    isSaving,
    errorMessage,
    onClose,
    onSubmit,
}) => {
    const [title, setTitle] = useState(form?.title || '');
    const [validationError, setValidationError] = useState('');

    if (!isOpen || !form) {
        return null;
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        const nextTitle = title.trim();

        if (!nextTitle) {
            setValidationError('Form title is required.');
            return;
        }

        setValidationError('');
        onSubmit(nextTitle);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay px-4 py-8">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md rounded-lg border border-default bg-secondary shadow-lg"
            >
                <div className="border-b border-default px-5 py-4">
                    <h2 className="text-lg font-semibold text-primary">Rename form</h2>
                </div>
                <div className="px-5 py-4">
                    <label className="flex flex-col gap-2 text-sm text-secondary">
                        Title
                        <input
                            type="text"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            disabled={isSaving}
                            autoFocus
                            className="rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                        />
                    </label>
                    {(validationError || errorMessage) && (
                        <p className="mt-3 text-sm text-danger">
                            {validationError || errorMessage}
                        </p>
                    )}
                </div>
                <div className="flex justify-end gap-3 border-t border-default px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RenameFormModal;
