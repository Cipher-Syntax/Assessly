const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

const PublicQuestion = ({ question, index, value, error, onChange, isDisabled }) => {
    const label = question?.label || `Question ${index + 1}`;
    const type = question?.type || 'short_text';
    const typeLabel = getQuestionTypeLabel(type);
    const questionId = question?.id;
    const required = Boolean(question?.required);
    const options = Array.isArray(question?.options) ? question.options : [];

    const handleTextChange = (event) => {
        if (!questionId) {
            return;
        }
        onChange(questionId, event.target.value);
    };

    const handleChoiceChange = (nextValue) => {
        if (!questionId) {
            return;
        }
        onChange(questionId, nextValue);
    };

    const handleCheckboxToggle = (option) => {
        if (!questionId) {
            return;
        }

        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option)
            ? current.filter((item) => item !== option)
            : [...current, option];

        onChange(questionId, next);
    };

    const renderInput = () => {
        if (type === 'paragraph') {
            return (
                <textarea
                    rows={4}
                    value={typeof value === 'string' ? value : ''}
                    onChange={handleTextChange}
                    disabled={isDisabled}
                    className="w-full resize-none rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                    placeholder="Type your answer"
                />
            );
        }

        if (type === 'multiple_choice') {
            const selected = typeof value === 'string' ? value : '';
            return (
                <div className="flex flex-col gap-2">
                    {options.map((option, optionIndex) => (
                        <label
                            key={`${questionId || index}-option-${optionIndex}`}
                            className="flex items-center gap-3 rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary"
                        >
                            <input
                                type="radio"
                                name={`question-${questionId || index}`}
                                value={option}
                                checked={selected === option}
                                onChange={() => handleChoiceChange(option)}
                                disabled={isDisabled}
                                className="h-4 w-4 border-default bg-tertiary text-primary-500 focus:ring-0 disabled:cursor-not-allowed"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (type === 'checkboxes') {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="flex flex-col gap-2">
                    {options.map((option, optionIndex) => (
                        <label
                            key={`${questionId || index}-option-${optionIndex}`}
                            className="flex items-center gap-3 rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary"
                        >
                            <input
                                type="checkbox"
                                value={option}
                                checked={selected.includes(option)}
                                onChange={() => handleCheckboxToggle(option)}
                                disabled={isDisabled}
                                className="h-4 w-4 rounded border-default bg-tertiary text-primary-500 focus:ring-0 disabled:cursor-not-allowed"
                            />
                            <span>{option}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (type === 'dropdown') {
            return (
                <select
                    value={typeof value === 'string' ? value : ''}
                    onChange={(event) => handleChoiceChange(event.target.value)}
                    disabled={isDisabled}
                    className="w-full rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <option value="">Select an option</option>
                    {options.map((option, optionIndex) => (
                        <option key={`${questionId || index}-option-${optionIndex}`} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            );
        }

        return (
            <input
                type="text"
                value={typeof value === 'string' ? value : ''}
                onChange={handleTextChange}
                disabled={isDisabled}
                className="w-full rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                placeholder="Type your answer"
            />
        );
    };

    return (
        <div className="rounded-xl border border-default bg-tertiary p-4">
            <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="text-sm text-primary">
                        {label}
                        {required && <span className="ml-1 text-danger">*</span>}
                    </div>
                    <span className="rounded-full border border-default bg-secondary px-3 py-1 text-xs text-secondary">
                        {typeLabel}
                    </span>
                </div>
                {renderInput()}
                {error && <p className="text-xs text-danger">{error}</p>}
            </div>
        </div>
    );
};

export default PublicQuestion;
