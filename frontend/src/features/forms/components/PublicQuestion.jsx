const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

const PublicQuestion = ({ question, index }) => {
    const label = question?.label || `Question ${index + 1}`;
    const typeLabel = getQuestionTypeLabel(question?.type);

    return (
        <div className="rounded-xl border border-default bg-tertiary p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="text-sm text-primary">{label}</div>
                <span className="rounded-full border border-default bg-secondary px-3 py-1 text-xs text-secondary">
                    {typeLabel}
                </span>
            </div>
        </div>
    );
};

export default PublicQuestion;
