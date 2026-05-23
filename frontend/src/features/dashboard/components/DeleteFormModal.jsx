const DeleteFormModal = ({
    form,
    isOpen,
    isDeleting,
    errorMessage,
    onClose,
    onConfirm,
}) => {
    if (!isOpen || !form) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-8">
            <div className="w-full max-w-md rounded-lg border border-default bg-secondary shadow-lg">
                <div className="border-b border-default px-5 py-4">
                    <h2 className="text-lg font-semibold text-primary">Delete form</h2>
                </div>
                <div className="px-5 py-4">
                    <p className="text-sm text-secondary">
                        Delete this form?
                    </p>
                    <p className="mt-2 break-words text-sm font-semibold text-primary">
                        {form.title}
                    </p>
                    <p className="mt-2 text-sm text-secondary">
                        This permanently removes the form and cannot be undone.
                    </p>
                    {errorMessage && (
                        <p className="mt-3 text-sm text-danger">{errorMessage}</p>
                    )}
                </div>
                <div className="flex justify-end gap-3 border-t border-default px-5 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isDeleting}
                        className="rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="rounded-lg bg-alert-high px-4 py-2 text-sm font-semibold text-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteFormModal;
