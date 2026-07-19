import { useCallback, useEffect, useMemo, useState } from 'react';
import QuestionSummaryCard from './QuestionSummaryCard';
import ResponseDetailCard from './ResponseDetailCard';
import {
    fetchPublishedSchema,
    fetchResponseDetail,
    fetchResponses,
    downloadCsv,
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
        <div className="flex items-center justify-center py-12 text-sm text-secondary">
            Waiting for responses
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
            <div className="flex flex-col gap-6">
                <div className="rounded-xl border border-default bg-secondary overflow-hidden shadow-sm p-6 flex flex-col items-center justify-center">
                    <div className="text-sm text-secondary mb-2">Response {activeIndex + 1} of {totalResponses}</div>
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                            disabled={!canGoPrev}
                            className={`p-2 rounded-full transition ${canGoPrev
                                ? 'text-secondary hover:bg-tertiary hover:text-primary'
                                : 'text-muted cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                        </button>
                        <span className="text-xl font-normal text-primary px-4">
                            Response {activeIndex + 1}
                        </span>
                        <button
                            type="button"
                            onClick={() =>
                                setActiveIndex((prev) =>
                                    Math.min(totalResponses - 1, prev + 1)
                                )
                            }
                            disabled={!canGoNext}
                            className={`p-2 rounded-full transition ${canGoNext
                                ? 'text-secondary hover:bg-tertiary hover:text-primary'
                                : 'text-muted cursor-not-allowed'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                        </button>
                    </div>
                </div>
                {detailStatus === 'loading' && (
                    <p className="text-sm text-secondary text-center py-8">Loading response details...</p>
                )}
                {detailStatus === 'error' && detailError && renderErrorState(detailError)}
                {detailStatus === 'ready' && (
                    <ResponseDetailCard response={detailResponse} questions={questions} />
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            <section className="rounded-xl border border-default bg-secondary overflow-hidden shadow-sm">
                <div className="p-6 pb-0 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h2 className="text-3xl font-normal text-primary">{totalResponses} responses</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => downloadCsv(formId)}
                            className="p-2 text-secondary hover:text-primary hover:bg-tertiary rounded-md transition mb-2 flex items-center gap-2 text-sm font-medium border border-default"
                            title="Export CSV"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            Export CSV
                        </button>
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={responsesStatus === 'loading'}
                            className="p-2 text-secondary hover:text-primary hover:bg-tertiary rounded-md transition mb-2 border border-default"
                            title="Refresh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                        </button>
                    </div>
                </div>
                
                <div className="px-6 flex gap-6 border-b border-default mt-4">
                    <button
                        type="button"
                        onClick={() => setView('summary')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${view === 'summary'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                    >
                        Summary
                    </button>
                    <button
                        type="button"
                        onClick={() => setView('individual')}
                        className={`pb-3 text-sm font-medium transition-colors border-b-2 ${view === 'individual'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-secondary hover:text-primary'
                            }`}
                    >
                        Individual
                    </button>
                </div>
            </section>
            
            <div className="">
                {view === 'summary' ? renderSummaryView() : renderIndividualView()}
            </div>
        </div>
    );
};

export default ResponsesPanel;
