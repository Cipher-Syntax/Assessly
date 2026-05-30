import { useCallback, useEffect, useMemo, useState } from 'react';
import QuestionSummaryCard from './QuestionSummaryCard';
import ResponseDetailCard from './ResponseDetailCard';
import {
    fetchPublishedSchema,
    fetchResponseDetail,
    fetchResponses,
} from '../services/responseViewerService';

const PAGE_SIZE = 10;
const CHOICE_TYPES = new Set(['multiple_choice', 'checkboxes', 'dropdown']);

const flattenQuestions = (schema) => {
    if (!schema || !Array.isArray(schema.sections)) {
        return [];
    }

    return schema.sections.flatMap((section) =>
        Array.isArray(section?.questions) ? section.questions : []
    );
};

const buildSummaryItems = (schema, responses) => {
    const questions = flattenQuestions(schema);
    const totalResponses = responses.length;

    return questions.map((question) => {
        const type = question?.type || 'short_text';
        const options = Array.isArray(question?.options) ? question.options : [];

        if (!CHOICE_TYPES.has(type)) {
            return {
                question,
                totalResponses,
                optionCounts: [],
            };
        }

        const counts = options.reduce((accumulator, option) => {
            accumulator[option] = 0;
            return accumulator;
        }, {});

        responses.forEach((response) => {
            const answer = response?.answers?.[question.id];

            if (type === 'checkboxes') {
                if (Array.isArray(answer)) {
                    answer.forEach((value) => {
                        if (counts[value] !== undefined) {
                            counts[value] += 1;
                        }
                    });
                }
                return;
            }

            if (typeof answer === 'string' && counts[answer] !== undefined) {
                counts[answer] += 1;
            }
        });

        const optionCounts = options.map((option) => ({
            option,
            count: counts[option] ?? 0,
        }));

        return {
            question,
            totalResponses,
            optionCounts,
        };
    });
};

const ResponsesPanel = ({ formId }) => {
    const [view, setView] = useState('summary');
    const [responses, setResponses] = useState([]);
    const [responsesStatus, setResponsesStatus] = useState('loading');
    const [responsesError, setResponsesError] = useState('');
    const [schema, setSchema] = useState({ sections: [] });
    const [schemaStatus, setSchemaStatus] = useState('loading');
    const [schemaError, setSchemaError] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const [detailStatus, setDetailStatus] = useState('idle');
    const [detailError, setDetailError] = useState('');
    const [detailResponse, setDetailResponse] = useState(null);

    const loadSchema = useCallback(async () => {
        if (!formId) {
            setSchema({ sections: [] });
            setSchemaStatus('error');
            setSchemaError('Missing form id.');
            return;
        }

        setSchemaStatus('loading');
        setSchemaError('');

        const { schema: publishedSchema, error } = await fetchPublishedSchema(formId);

        if (error) {
            setSchema({ sections: [] });
            setSchemaStatus('error');
            setSchemaError(error);
            return;
        }

        setSchema(publishedSchema);
        setSchemaStatus('ready');
    }, [formId]);

    const loadResponses = useCallback(
        async (shouldResetIndex = false) => {
            if (!formId) {
                setResponses([]);
                setResponsesStatus('error');
                setResponsesError('Missing form id.');
                return;
            }

            setResponsesStatus('loading');
            setResponsesError('');

            const { responses: responseList, error } = await fetchResponses(formId);

            if (error) {
                setResponses([]);
                setResponsesStatus('error');
                setResponsesError(error);
                return;
            }

            setResponses(responseList);
            setResponsesStatus('ready');
            if (shouldResetIndex) {
                setActiveIndex(0);
            }
        },
        [formId]
    );

    useEffect(() => {
        loadSchema();
        loadResponses(true);
    }, [loadSchema, loadResponses]);

    useEffect(() => {
        if (activeIndex >= responses.length) {
            setActiveIndex(0);
        }
    }, [activeIndex, responses.length]);

    const currentResponseId = responses[activeIndex]?.id ?? null;

    useEffect(() => {
        let isMounted = true;

        if (view !== 'individual') {
            setDetailResponse(null);
            setDetailStatus('idle');
            setDetailError('');
            return () => {
                isMounted = false;
            };
        }

        if (!currentResponseId) {
            setDetailResponse(null);
            setDetailStatus('idle');
            setDetailError('');
            return () => {
                isMounted = false;
            };
        }

        const loadDetail = async () => {
            setDetailStatus('loading');
            setDetailError('');

            const { response, error } = await fetchResponseDetail(currentResponseId);

            if (!isMounted) {
                return;
            }

            if (error || !response) {
                setDetailResponse(null);
                setDetailStatus('error');
                setDetailError(error || 'Unable to load response details.');
                return;
            }

            setDetailResponse(response);
            setDetailStatus('ready');
        };

        loadDetail();

        return () => {
            isMounted = false;
        };
    }, [currentResponseId, view]);

    const summaryItems = useMemo(
        () => buildSummaryItems(schema, responses),
        [schema, responses]
    );
    const questions = useMemo(() => flattenQuestions(schema), [schema]);

    const totalResponses = responses.length;
    const totalPages = Math.max(1, Math.ceil(totalResponses / PAGE_SIZE));
    const currentPage = totalResponses > 0 ? Math.floor(activeIndex / PAGE_SIZE) + 1 : 0;

    const canGoPrev = activeIndex > 0;
    const canGoNext = activeIndex < totalResponses - 1;

    const handleRefresh = () => {
        loadResponses(true);
        loadSchema();
        setDetailResponse(null);
        setDetailStatus('idle');
        setDetailError('');
    };

    const renderEmptyState = () => (
        <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
            No responses yet.
        </div>
    );

    const renderErrorState = (message) => (
        <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
            {message}
        </div>
    );

    const renderSummaryView = () => {
        if (responsesStatus === 'loading' || schemaStatus === 'loading') {
            return (
                <p className="text-sm text-secondary">Loading responses...</p>
            );
        }

        if (responsesError) {
            return renderErrorState(responsesError);
        }

        if (schemaError && totalResponses > 0) {
            return renderErrorState(schemaError);
        }

        if (totalResponses === 0) {
            return renderEmptyState();
        }

        if (summaryItems.length === 0) {
            return renderErrorState('No published questions are available for summary.');
        }

        return (
            <div className="flex flex-col gap-4">
                {summaryItems.map((item, index) => (
                    <QuestionSummaryCard
                        key={item.question?.id ?? `summary-${index}`}
                        question={item.question}
                        totalResponses={item.totalResponses}
                        optionCounts={item.optionCounts}
                    />
                ))}
            </div>
        );
    };

    const renderIndividualView = () => {
        if (responsesStatus === 'loading') {
            return (
                <p className="text-sm text-secondary">Loading responses...</p>
            );
        }

        if (responsesError) {
            return renderErrorState(responsesError);
        }

        if (totalResponses === 0) {
            return renderEmptyState();
        }

        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-secondary">
                        {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                            disabled={!canGoPrev}
                            className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${canGoPrev
                                ? 'bg-tertiary text-secondary hover:text-primary'
                                : 'bg-tertiary text-muted opacity-60 cursor-not-allowed'
                                }`}
                        >
                            Prev
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setActiveIndex((prev) =>
                                    Math.min(totalResponses - 1, prev + 1)
                                )
                            }
                            disabled={!canGoNext}
                            className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${canGoNext
                                ? 'bg-tertiary text-secondary hover:text-primary'
                                : 'bg-tertiary text-muted opacity-60 cursor-not-allowed'
                                }`}
                        >
                            Next
                        </button>
                    </div>
                </div>
                {detailStatus === 'loading' && (
                    <p className="text-sm text-secondary">Loading response details...</p>
                )}
                {detailStatus === 'error' && detailError && renderErrorState(detailError)}
                {detailStatus === 'ready' && (
                    <ResponseDetailCard response={detailResponse} questions={questions} />
                )}
            </div>
        );
    };

    return (
        <section className="rounded-xl border border-default bg-secondary p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-default pb-4">
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setView('summary')}
                        className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${view === 'summary'
                            ? 'bg-primary-500 text-on-primary'
                            : 'bg-tertiary text-secondary hover:text-primary'
                            }`}
                    >
                        Summary
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('individual')}
                        className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${view === 'individual'
                            ? 'bg-primary-500 text-on-primary'
                            : 'bg-tertiary text-secondary hover:text-primary'
                            }`}
                    >
                        Individual
                    </button>
                </div>
                <button
                    type="button"
                    onClick={handleRefresh}
                    disabled={responsesStatus === 'loading'}
                    className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${responsesStatus === 'loading'
                        ? 'bg-tertiary text-muted opacity-60 cursor-not-allowed'
                        : 'bg-tertiary text-secondary hover:text-primary'
                        }`}
                >
                    Refresh
                </button>
            </div>
            <div className="mt-6">
                {view === 'summary' ? renderSummaryView() : renderIndividualView()}
            </div>
        </section>
    );
};

export default ResponsesPanel;
