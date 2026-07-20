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

            {response.events && response.events.length > 0 && (
                <div className="rounded-xl border border-red-500/30 bg-red-50/50 p-6 shadow-sm">
                    <h4 className="text-lg font-medium text-red-700 mb-2">Integrity Report</h4>
                    <p className="text-sm text-red-600 mb-4">
                        The anti-cheat system logged {response.events.length} event(s) for this response.
                    </p>
                    {response.events.filter(e => e.event_type === 'webcam_snapshot').length > 0 && (
                        <div className="mb-6">
                            <h5 className="text-sm font-semibold text-red-700 mb-3">Webcam Snapshots</h5>
                            <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
                                {response.events
                                    .filter(e => e.event_type === 'webcam_snapshot')
                                    .map(event => (
                                        <div key={event.id} className="flex flex-col gap-1 flex-shrink-0 snap-start w-64">
                                            {event.metadata?.image_data ? (
                                                <img 
                                                    src={event.metadata.image_data} 
                                                    alt="Webcam snapshot" 
                                                    className="w-64 h-48 object-cover rounded-lg border-2 border-red-200" 
                                                />
                                            ) : (
                                                <div className="w-64 h-48 bg-red-100 rounded-lg flex items-center justify-center border-2 border-red-200 text-red-400">
                                                    No image data
                                                </div>
                                            )}
                                            <span className="text-xs font-medium text-red-600 text-center">
                                                {new Date(event.occurred_at).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                    
                    <h5 className="text-sm font-semibold text-red-700 mb-3">Activity Log</h5>
                    <ul className="text-sm text-red-700 space-y-3">
                        {response.events
                            .filter(e => e.event_type !== 'webcam_snapshot')
                            .map(event => (
                                <li key={event.id} className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                    <span>
                                        {event.event_type === 'visibility_hidden' ? 'Switched tab or hid window' : 
                                         event.event_type === 'window_blur' ? 'Lost window focus' : 
                                         event.event_type} at {new Date(event.occurred_at).toLocaleTimeString()}
                                    </span>
                                </li>
                            ))}
                    </ul>
                </div>
            )}
            
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
