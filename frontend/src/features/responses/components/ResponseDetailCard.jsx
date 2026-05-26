const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);

const formatAnswerValue = (value) => {
    if (Array.isArray(value)) {
        return value.length > 0 ? value.join(', ') : 'No answer';
    }

    if (value === null || value === undefined) {
        return 'No answer';
    }

    if (typeof value === 'string') {
        return value.trim().length > 0 ? value : 'No answer';
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return 'No answer';
};

const buildAnswerItems = (questions, answers) => {
    if (Array.isArray(questions) && questions.length > 0) {
        return questions.map((question, index) => {
            const questionId = question?.id ?? `question-${index}`;
            const label = question?.label || `Question ${index + 1}`;
            const value = isRecord(answers) ? answers[questionId] : undefined;

            return {
                id: questionId,
                label,
                value: formatAnswerValue(value),
            };
        });
    }

    if (isRecord(answers)) {
        return Object.keys(answers).map((key) => ({
            id: key,
            label: key,
            value: formatAnswerValue(answers[key]),
        }));
    }

    return [];
};

const ResponseDetailCard = ({ response, questions }) => {
    if (!response) {
        return null;
    }

    const submittedAt = response.submitted_at || response.created_at || null;
    const answerItems = buildAnswerItems(questions, response.answers);

    return (
        <div className="rounded-xl border border-default bg-secondary p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h3 className="text-base font-semibold text-primary">Submission</h3>
                <span className="text-xs text-secondary">
                    {submittedAt ? `Submitted at ${submittedAt}` : 'Submitted timestamp unavailable'}
                </span>
            </div>
            <div className="mt-4 flex flex-col gap-3">
                {answerItems.length === 0 ? (
                    <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
                        No answers available for this submission.
                    </div>
                ) : (
                    answerItems.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-lg border border-default bg-tertiary px-4 py-3"
                        >
                            <div className="text-sm text-primary">{item.label}</div>
                            <div className="mt-2 text-sm text-secondary">{item.value}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ResponseDetailCard;
