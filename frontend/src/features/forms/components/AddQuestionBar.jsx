const AddQuestionBar = ({ onAdd, isDisabled = false }) => {
    return (
        <div className="flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => onAdd('short_text')}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition ${isDisabled
                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                    : 'bg-primary-500 text-on-primary hover:bg-primary-600'
                    }`}
            >
                Add short text
            </button>
            <button
                type="button"
                onClick={() => onAdd('paragraph')}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-lg border border-default px-4 py-2 text-sm font-semibold transition ${isDisabled
                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                    : 'bg-tertiary text-secondary hover:text-primary'
                    }`}
            >
                Add paragraph
            </button>
            <button
                type="button"
                onClick={() => onAdd('multiple_choice')}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-lg border border-default px-4 py-2 text-sm font-semibold transition ${isDisabled
                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                    : 'bg-tertiary text-secondary hover:text-primary'
                    }`}
            >
                Add multiple choice
            </button>
            <button
                type="button"
                onClick={() => onAdd('checkboxes')}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-lg border border-default px-4 py-2 text-sm font-semibold transition ${isDisabled
                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                    : 'bg-tertiary text-secondary hover:text-primary'
                    }`}
            >
                Add checkboxes
            </button>
            <button
                type="button"
                onClick={() => onAdd('dropdown')}
                disabled={isDisabled}
                className={`inline-flex items-center justify-center rounded-lg border border-default px-4 py-2 text-sm font-semibold transition ${isDisabled
                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                    : 'bg-tertiary text-secondary hover:text-primary'
                    }`}
            >
                Add dropdown
            </button>
        </div>
    );
};

export default AddQuestionBar;