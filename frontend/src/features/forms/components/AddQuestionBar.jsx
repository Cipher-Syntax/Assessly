const AddQuestionBar = ({ onAdd }) => {
    return (
        <div className="flex flex-wrap gap-3">
            <button
                type="button"
                onClick={() => onAdd('short_text')}
                className="inline-flex items-center justify-center rounded-lg bg-primary-500 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-600"
            >
                Add short text
            </button>
            <button
                type="button"
                onClick={() => onAdd('paragraph')}
                className="inline-flex items-center justify-center rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary"
            >
                Add paragraph
            </button>
        </div>
    );
};

export default AddQuestionBar;