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
        <div className="rounded-xl border border-default bg-secondary shadow-sm p-6 mb-4">
            <div className="flex flex-col gap-1 mb-4">
                <h3 className="text-base font-normal text-primary">{label}</h3>
                <div className="text-sm text-secondary">
                    {totalResponses} responses
                </div>
            </div>
            {showOptions && (
                <div className="flex flex-col gap-0 mt-4">
                    {optionCounts.map((option, index) => {
                        const isLast = index === optionCounts.length - 1;
                        return (
                            <div
                                key={`${option.option}-${index}`}
                                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 ${isLast ? '' : 'border-b border-default'}`}
                            >
                                <span className="text-sm text-primary mb-1 sm:mb-0">{option.option}</span>
                                <span className="text-sm font-medium bg-tertiary px-2 py-1 rounded text-secondary">{option.count}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QuestionSummaryCard;
