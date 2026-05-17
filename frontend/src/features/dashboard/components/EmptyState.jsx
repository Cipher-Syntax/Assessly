const EmptyState = ({ onCreate, isCreating, errorMessage }) => {
    return (
        <div className="flex w-full justify-center">
            <div className="w-full max-w-xl rounded-xl border border-default bg-secondary px-6 py-8 text-center">
                <h3 className="text-lg font-semibold text-primary">No forms yet</h3>
                <p className="mt-2 text-sm text-secondary">
                    Start with a blank form and build your first structured assessment.
                </p>
                <button
                    type="button"
                    onClick={onCreate}
                    disabled={isCreating}
                    className="cursor-pointer mt-6 inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                >
                    {isCreating ? 'Creating...' : 'Create Blank Form'}
                </button>
                {errorMessage && (
                    <p className="mt-3 text-sm text-secondary">{errorMessage}</p>
                )}
            </div>
        </div>
    );
};

export default EmptyState;