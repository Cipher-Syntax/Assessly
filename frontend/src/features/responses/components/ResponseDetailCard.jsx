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
        <div className="flex flex-col gap-4">
            <div className="relative rounded-xl border border-default bg-secondary shadow-sm">
                <div className="absolute top-0 left-0 right-0 h-2 bg-primary-500 rounded-t-xl"></div>
                <div className="p-6 pt-8">
                    <h3 className="text-2xl font-normal text-primary mb-2">Individual Response</h3>
                    <span className="text-sm text-secondary">
                        {submittedAt ? `Submitted on ${new Date(submittedAt).toLocaleString()}` : 'Submitted timestamp unavailable'}
                    </span>
                </div>
            </div>
            
            <div className="flex flex-col gap-6">
                {answerItems.length === 0 ? (
                    <div className="rounded-xl border border-default bg-secondary p-6 text-sm text-secondary text-center shadow-sm">
                        No answers available for this submission.
                    </div>
                ) : (
                    answerItems.map((item) => (
                        <div
                            key={item.id}
                            className="rounded-xl border border-default bg-secondary p-6 shadow-sm"
                        >
                            <div className="text-base font-normal text-primary mb-4">{item.label}</div>
                            <div className="text-sm text-primary">{item.value}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ResponseDetailCard;
