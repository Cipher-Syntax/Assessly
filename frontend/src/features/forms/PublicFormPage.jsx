import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useAuthStatus from '../auth/hooks/useAuthStatus';
import PublicSection from './components/PublicSection';
import { fetchDraft, saveDraft } from './services/draftService';
import { fetchPublicForm } from './services/publicFormService';
import { submitResponse } from './services/responseService';

const isEmptyValue = (value) => {
    if (value === null || value === undefined) {
        return true;
    }
    if (typeof value === 'string') {
        return value.trim().length === 0;
    }
    if (Array.isArray(value)) {
        return value.length === 0;
    }
    return false;
};

const flattenQuestions = (sections) => {
    if (!Array.isArray(sections)) {
        return [];
    }
    return sections.flatMap((section) =>
        Array.isArray(section?.questions) ? section.questions : []
    );
};

const getDraftSessionKey = (formId) =>
    formId ? `draftSession:${formId}` : null;

const readDraftSession = (formId) => {
    const key = getDraftSessionKey(formId);

    if (!key) {
        return null;
    }

    try {
        const raw = localStorage.getItem(key);
        if (!raw) {
            return null;
        }
        const parsed = JSON.parse(raw);
        const sessionUuid =
            parsed?.sessionUuid && typeof parsed.sessionUuid === 'string'
                ? parsed.sessionUuid
                : null;
        const sessionId =
            parsed?.sessionId !== undefined && parsed?.sessionId !== null
                ? parsed.sessionId
                : null;
        return sessionUuid ? { sessionUuid, sessionId } : null;
    } catch {
        return null;
    }
};

const writeDraftSession = (formId, sessionUuid, sessionId) => {
    const key = getDraftSessionKey(formId);

    if (!key || !sessionUuid) {
        return;
    }

    const payload = {
        sessionUuid,
        sessionId: sessionId ?? null,
    };

    localStorage.setItem(key, JSON.stringify(payload));
};

const validateClientAnswers = (questions, answers) => {
    const errors = {};

    questions.forEach((question) => {
        const questionId = question?.id ? String(question.id) : null;

        if (!questionId) {
            return;
        }

        const value = answers?.[questionId];
        const required = Boolean(question?.required);
        const type = question?.type;
        const options = Array.isArray(question?.options) ? question.options : [];

        if (required && isEmptyValue(value)) {
            errors[questionId] = 'This question is required.';
            return;
        }

        if (!required && isEmptyValue(value)) {
            return;
        }

        if (type === 'short_text' || type === 'paragraph') {
            if (typeof value !== 'string') {
                errors[questionId] = 'Must be a text response.';
            }
            return;
        }

        if (type === 'multiple_choice' || type === 'dropdown') {
            if (typeof value !== 'string') {
                errors[questionId] = 'Select a valid option.';
                return;
            }
            if (options.length > 0 && !options.includes(value)) {
                errors[questionId] = 'Select a valid option.';
            }
            return;
        }

        if (type === 'checkboxes') {
            if (!Array.isArray(value)) {
                errors[questionId] = 'Select one or more options.';
                return;
            }
            if (value.some((item) => typeof item !== 'string')) {
                errors[questionId] = 'Select valid options.';
                return;
            }
            if (options.length > 0 && value.some((item) => !options.includes(item))) {
                errors[questionId] = 'Select valid options.';
            }
            return;
        }
    });

    return errors;
};

const PublicFormPage = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token') || '';
    const authState = useAuthStatus();
    const isAuthenticated = authState.status === 'authenticated';

    const [status, setStatus] = useState('loading');
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [answers, setAnswers] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submission, setSubmission] = useState(null);
    const [sessionUuid, setSessionUuid] = useState(() => {
        const stored = readDraftSession(id);
        return stored?.sessionUuid || crypto.randomUUID();
    });
    const [sessionId, setSessionId] = useState(() => {
        const stored = readDraftSession(id);
        return stored?.sessionId ?? null;
    });
    const [resumeBannerVisible, setResumeBannerVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [saveError, setSaveError] = useState('');

    const sections = form?.publishedSchema?.sections || [];
    const questions = useMemo(() => flattenQuestions(sections), [sections]);

    useEffect(() => {
        let isMounted = true;

        const loadForm = async () => {
            setStatus('loading');
            setError('');
            setSubmitError('');
            setFieldErrors({});
            setIsSubmitted(false);
            setSubmission(null);
            setAnswers({});
            setResumeBannerVisible(false);
            setIsSaving(false);
            setLastSavedAt(null);
            setSaveError('');

            const { form: publicForm, error: loadError } = await fetchPublicForm({
                id,
                token,
            });

            if (!isMounted) {
                return;
            }

            if (loadError || !publicForm) {
                setStatus('error');
                setError(loadError || 'Unable to load this form.');
                return;
            }

            setForm(publicForm);
            setStatus('ready');
        };

        loadForm();

        return () => {
            isMounted = false;
        };
    }, [id, token]);

    useEffect(() => {
        const stored = readDraftSession(id);
        if (stored?.sessionUuid) {
            setSessionUuid(stored.sessionUuid);
            setSessionId(stored.sessionId ?? null);
        } else {
            setSessionUuid(crypto.randomUUID());
            setSessionId(null);
        }
    }, [id, token]);

    useEffect(() => {
        if (!isAuthenticated || !form?.id) {
            return undefined;
        }

        let isActive = true;

        const loadDraft = async () => {
            const { draft, error: draftError, status: draftStatus } = await fetchDraft({
                formId: form.id,
                token,
            });

            if (!isActive) {
                return;
            }

            if (draftStatus === 404) {
                const nextSessionUuid = crypto.randomUUID();
                setSessionUuid(nextSessionUuid);
                setSessionId(null);
                setAnswers({});
                setResumeBannerVisible(false);
                setLastSavedAt(null);
                setSaveError('');
                writeDraftSession(form.id, nextSessionUuid, null);
                return;
            }

            if (draftError) {
                setSaveError(draftError);
                return;
            }

            if (draft) {
                setAnswers(draft.answers || {});
                setSessionUuid((prev) => draft.session_uuid || prev || crypto.randomUUID());
                setSessionId(draft.session_id ?? null);
                setResumeBannerVisible(true);
                setLastSavedAt(draft.updated_at || null);
                setSaveError('');
                if (draft.session_uuid) {
                    writeDraftSession(form.id, draft.session_uuid, draft.session_id ?? null);
                }
            }
        };

        loadDraft();

        return () => {
            isActive = false;
        };
    }, [form?.id, isAuthenticated, token]);

    useEffect(() => {
        if (!isAuthenticated || !form?.id) {
            return undefined;
        }

        if (isSubmitted || isSubmitting) {
            return undefined;
        }

        let isActive = true;

        const timeoutId = setTimeout(async () => {
            if (!isAuthenticated || !form?.id || !sessionUuid) {
                return;
            }

            setIsSaving(true);

            const { draft, error: saveMessage } = await saveDraft({
                formId: form.id,
                answers,
                sessionUuid,
                sessionId,
                token,
            });

            if (!isActive) {
                return;
            }

            if (saveMessage) {
                setSaveError(saveMessage);
            } else {
                setSaveError('');
            }

            if (draft) {
                if (draft.session_uuid) {
                    setSessionUuid(draft.session_uuid);
                }
                setSessionId(draft.session_id ?? null);
                writeDraftSession(form.id, draft.session_uuid || sessionUuid, draft.session_id ?? null);
                setLastSavedAt(draft.updated_at || new Date().toISOString());
            }

            setIsSaving(false);
        }, 800);

        return () => {
            isActive = false;
            clearTimeout(timeoutId);
        };
    }, [
        answers,
        form?.id,
        isAuthenticated,
        isSubmitted,
        isSubmitting,
        sessionId,
        sessionUuid,
        token,
    ]);

    const handleAnswerChange = (questionId, value) => {
        if (!questionId) {
            return;
        }

        setAnswers((prev) => ({
            ...prev,
            [questionId]: value,
        }));

        setFieldErrors((prev) => {
            if (!prev[questionId]) {
                return prev;
            }

            const next = { ...prev };
            delete next[questionId];
            return next;
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form || isSubmitting) {
            return;
        }

        setSubmitError('');

        const clientErrors = validateClientAnswers(questions, answers);

        if (Object.keys(clientErrors).length > 0) {
            setFieldErrors(clientErrors);
            return;
        }

        setIsSubmitting(true);

        const { response, error: submitMessage, fieldErrors: serverErrors } =
            await submitResponse({
                formId: form.id,
                answers,
                sessionUuid,
                token,
            });

        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setFieldErrors(serverErrors);
        }

        if (submitMessage) {
            setSubmitError(submitMessage);
        }

        if (response) {
            setSubmission(response);
            setIsSubmitted(true);
        }

        setIsSubmitting(false);
    };

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-6 py-10">
                <p className="text-sm text-secondary">Loading form...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary px-6 py-10">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                    <div className="rounded-xl border border-default bg-secondary px-6 py-6 text-center">
                        <h1 className="text-lg font-semibold text-primary">
                            Unable to load form
                        </h1>
                        <p className="mt-2 text-sm text-secondary">
                            {error || 'Please try again in a moment.'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-primary text-primary px-6 py-10">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
                <header className="rounded-xl border border-default bg-secondary p-6">
                    <h1 className="text-title font-semibold text-primary">
                        {form?.title || 'Untitled form'}
                    </h1>
                    {form?.description && (
                        <p className="mt-2 text-sm text-secondary">
                            {form.description}
                        </p>
                    )}
                </header>

                {isSubmitted ? (
                    <div className="rounded-xl border border-default bg-secondary px-6 py-6 text-center">
                        <h2 className="text-lg font-semibold text-primary">
                            Response submitted
                        </h2>
                        <p className="mt-2 text-sm text-secondary">
                            Thank you for completing this form. You can safely close this page.
                        </p>
                        {submission?.submitted_at && (
                            <p className="mt-3 text-xs text-muted">
                                Submitted at {submission.submitted_at}
                            </p>
                        )}
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                        {resumeBannerVisible && (
                            <div className="rounded-lg border border-default bg-secondary px-4 py-2 text-sm text-secondary">
                                Resumed your draft
                            </div>
                        )}
                        {sections.map((section, index) => (
                            <PublicSection
                                key={section.id || `section-${index}`}
                                section={section}
                                index={index}
                                answers={answers}
                                errors={fieldErrors}
                                onAnswerChange={handleAnswerChange}
                                isDisabled={isSubmitting}
                            />
                        ))}

                        {submitError && (
                            <div className="rounded-lg border border-default bg-tertiary px-4 py-3 text-sm text-secondary">
                                {submitError}
                            </div>
                        )}

                        <div className="rounded-xl border border-default bg-secondary p-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? 'Submitting...' : 'Submit'}
                            </button>
                            {isAuthenticated && (
                                <div className="mt-2 text-xs text-secondary">
                                    {isSaving && 'Saving...'}
                                    {!isSaving && saveError && saveError}
                                    {!isSaving && !saveError && lastSavedAt && 'Draft saved'}
                                </div>
                            )}
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default PublicFormPage;
