const QuestionCard = ({ question, error, onChange, onDelete }) => {
    const handleLabelChange = (event) => {
        onChange(question.id, { label: event.target.value });
    };

    const handleTypeChange = (event) => {
        onChange(question.id, { type: event.target.value });
    };

    const handleRequiredChange = (event) => {
        onChange(question.id, { required: event.target.checked });
    };

    return (
        <div className="rounded-xl border border-default bg-secondary p-5">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-secondary">Question label</label>
                    <input
                        type="text"
                        value={question.label}
                        onChange={handleLabelChange}
                        placeholder="Untitled question"
                        className="w-full rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                    {error && <p className="text-xs text-danger">{error}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary">Type</label>
                        <select
                            value={question.type}
                            onChange={handleTypeChange}
                            className="rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none"
                        >
                            <option value="short_text">Short text</option>
                            <option value="paragraph">Paragraph</option>
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-secondary">
                        <input
                            type="checkbox"
                            checked={question.required}
                            onChange={handleRequiredChange}
                            className="h-4 w-4 rounded border-default bg-tertiary text-primary-500 focus:ring-0"
                        />
                        Required
                    </label>

                    <button
                        type="button"
                        onClick={() => onDelete(question.id)}
                        className="text-xs text-muted transition hover:text-danger"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuestionCard;