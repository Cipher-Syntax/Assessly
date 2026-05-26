const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

const QuestionSummaryCard = ({ question, totalResponses, optionCounts }) => {
    const label = question?.label || 'Untitled question';
    const type = question?.type || 'short_text';
    const typeLabel = getQuestionTypeLabel(type);
    const showOptions = Array.isArray(optionCounts) && optionCounts.length > 0;

    return (
        <div className="rounded-xl border border-default bg-tertiary p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-primary">{label}</div>
                <span className="rounded-full border border-default bg-secondary px-3 py-1 text-xs text-secondary">
                    {typeLabel}
                </span>
            </div>
            <div className="mt-3 text-xs text-secondary">
                Total submissions: {totalResponses}
            </div>
            {showOptions && (
                <div className="mt-3 flex flex-col gap-2">
                    {optionCounts.map((option, index) => (
                        <div
                            key={`${option.option}-${index}`}
                            className="flex items-center justify-between rounded-lg border border-default bg-secondary px-3 py-2 text-xs text-secondary"
                        >
                            <span className="text-primary">{option.option}</span>
                            <span>{option.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default QuestionSummaryCard;
