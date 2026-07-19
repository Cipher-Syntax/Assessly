import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import useAuthStatus from '../auth/hooks/useAuthStatus';
import PublicSection from './components/PublicSection';
import { fetchDraft, saveDraft } from './services/draftService';
import { fetchPublicForm } from './services/publicFormService';
import {
    createResponseAttempt,
    logResponseEvent,
    submitResponse,
} from './services/responseService';
import PageSpinner from '../../components/ui/PageSpinner';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../app/useToast';

const TOAST_TTL_MS = 3800;

const WarningIcon = ({ className }) => (
    <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <path d="M10.3 4.5 3.7 16.1a1.5 1.5 0 0 0 1.3 2.2h14a1.5 1.5 0 0 0 1.3-2.2L13.7 4.5a1.5 1.5 0 0 0-3.4 0Z" />
    </svg>
);

const getToastToneClass = (tone) => {
    if (tone === 'high') {
        return 'bg-alert-high';
    }

    if (tone === 'mid') {
        return 'bg-alert-mid';
    }

    return 'bg-alert-low';
};

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
    const [toasts, setToasts] = useState([]);
    const toastIdRef = useRef(0);
    const toastTimersRef = useRef(new Map());
    const eventQueueRef = useRef([]);
    const flushTimerRef = useRef(null);
    const isFlushingRef = useRef(false);
    const retryOnNextEnqueueRef = useRef(false);
    const sessionIdRef = useRef(sessionId);
    const isSubmittedRef = useRef(isSubmitted);
    const isSubmittingRef = useRef(isSubmitting);
    const submissionStateRef = useRef({
        formId: form?.id ?? null,
        answers,
        sessionUuid,
        sessionId,
        token,
    });
    const attemptInFlightRef = useRef(false);
    const autoSubmitInFlightRef = useRef(false);
    const violationCountRef = useRef(0);
    const focusLossActiveRef = useRef(false);
    const toast = useToast();

    const sections = form?.publishedSchema?.sections || [];
    const questions = useMemo(() => flattenQuestions(sections), [sections]);

    const isAntiCheatEnabled = form?.settings?.is_anti_cheat_enabled === true;
    
    // Theme
    const themePrimaryColor = form?.settings?.theme_primary_color || null;
    const themeHeaderImage = form?.settings?.theme_header_image || null;
    
    const containerStyle = themePrimaryColor ? { '--primary-500': themePrimaryColor } : {};
    
    // Calculate time limit in seconds
    const timeLimit = useMemo(() => {
        if (!form?.settings?.is_timer_enabled) return null;
        const val = form?.settings?.time_limit_value || 0;
        const unit = form?.settings?.time_limit_unit || 'seconds';
        if (unit === 'hours') return val * 3600;
        if (unit === 'minutes') return val * 60;
        return val;
    }, [form?.settings]);
    
    const [timeLeft, setTimeLeft] = useState(null);

    const removeToast = useCallback((toastId) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
        const timeoutId = toastTimersRef.current.get(toastId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            toastTimersRef.current.delete(toastId);
        }
    }, []);

    const pushToast = useCallback(
        (message, tone) => {
            if (!message) {
                return;
            }

            const nextId = toastIdRef.current + 1;
            toastIdRef.current = nextId;

            const nextToast = {
                id: nextId,
                message,
                tone,
            };

            setToasts((prev) => [...prev, nextToast]);

            const timeoutId = setTimeout(() => {
                removeToast(nextId);
            }, TOAST_TTL_MS);

            toastTimersRef.current.set(nextId, timeoutId);
        },
        [removeToast]
    );

    const clearFlushTimer = useCallback(() => {
        if (flushTimerRef.current) {
            clearTimeout(flushTimerRef.current);
            flushTimerRef.current = null;
        }
    }, []);

    const stopMonitoring = useCallback(() => {
        eventQueueRef.current = [];
        retryOnNextEnqueueRef.current = false;
        clearFlushTimer();
    }, [clearFlushTimer]);

    const flushEventQueue = useCallback(async () => {
        if (isFlushingRef.current) {
            return;
        }

        if (isSubmittedRef.current) {
            stopMonitoring();
            return;
        }

        const currentSessionId = sessionIdRef.current;
        if (!currentSessionId) {
            return;
        }

        const queuedEvents = eventQueueRef.current;
        if (queuedEvents.length === 0) {
            return;
        }

        isFlushingRef.current = true;
        clearFlushTimer();
        eventQueueRef.current = [];

        try {
            const results = await Promise.all(
                queuedEvents.map((eventItem) =>
                    logResponseEvent({
                        sessionId: currentSessionId,
                        eventType: eventItem.event_type,
                        metadata: eventItem.metadata,
                        occurredAt: eventItem.occurred_at,
                        token,
                    })
                )
            );

            const hasFailure = results.some((result) => result.error);

            if (hasFailure) {
                eventQueueRef.current = queuedEvents.concat(eventQueueRef.current);
                retryOnNextEnqueueRef.current = true;
            }
        } catch {
            eventQueueRef.current = queuedEvents.concat(eventQueueRef.current);
            retryOnNextEnqueueRef.current = true;
        } finally {
            isFlushingRef.current = false;
        }
    }, [clearFlushTimer, stopMonitoring, token]);

    const enqueueEvent = useCallback(
        (eventPayload) => {
            if (!eventPayload) {
                return;
            }

            if (!sessionIdRef.current || isSubmittedRef.current) {
                return;
            }

            eventQueueRef.current.push(eventPayload);

            if (retryOnNextEnqueueRef.current) {
                retryOnNextEnqueueRef.current = false;
                flushEventQueue();
                return;
            }

            if (eventQueueRef.current.length >= 5) {
                flushEventQueue();
                return;
            }

            clearFlushTimer();
            flushTimerRef.current = setTimeout(() => {
                flushEventQueue();
            }, 2000);
        },
        [clearFlushTimer, flushEventQueue]
    );

    const handleAutoSubmit = useCallback(async () => {
        if (autoSubmitInFlightRef.current) {
            return;
        }

        if (isSubmittingRef.current || isSubmittedRef.current) {
            return;
        }

        const {
            formId,
            answers: currentAnswers,
            sessionUuid: currentSessionUuid,
            sessionId: currentSessionId,
            token: currentToken,
        } = submissionStateRef.current;

        if (!formId || !currentSessionUuid) {
            return;
        }

        autoSubmitInFlightRef.current = true;
        setIsSubmitting(true);

        const { response, error: submitMessage, fieldErrors: serverErrors } =
            await submitResponse({
                formId,
                answers: currentAnswers,
                sessionUuid: currentSessionUuid,
                sessionId: currentSessionId,
                token: currentToken,
            });

        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setFieldErrors(serverErrors);
        }

        if (submitMessage || (serverErrors && Object.keys(serverErrors).length > 0)) {
            pushToast(
                submitMessage || 'Unable to auto-submit. Please submit manually.',
                'high'
            );
        }

        if (response) {
            setSubmission(response);
            setIsSubmitted(true);
            stopMonitoring();
        }

        setIsSubmitting(false);
        autoSubmitInFlightRef.current = false;
    }, [pushToast, stopMonitoring]);

    const registerViolation = useCallback(() => {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const MAX_VIOLATIONS = isMobile ? 5 : 3;

        if (violationCountRef.current >= MAX_VIOLATIONS) {
            return;
        }

        const nextCount = violationCountRef.current + 1;
        violationCountRef.current = nextCount;

        if (nextCount === MAX_VIOLATIONS) {
            pushToast('Auto-submitting due to repeated focus loss.', 'high');
            handleAutoSubmit();
        } else if (nextCount === MAX_VIOLATIONS - 1) {
            pushToast('Final warning: further tab switches will submit your response.', 'mid');
        } else {
            pushToast(`Warning: focus loss detected. (${nextCount}/${MAX_VIOLATIONS})`, 'low');
        }
    }, [handleAutoSubmit, pushToast]);

    const monitoringActive = Boolean(sessionId) && !isSubmitted && isAntiCheatEnabled;

    useEffect(() => {
        sessionIdRef.current = sessionId;
    }, [sessionId]);

    useEffect(() => {
        isSubmittedRef.current = isSubmitted;
    }, [isSubmitted]);

    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    useEffect(() => {
        submissionStateRef.current = {
            formId: form?.id ?? null,
            answers,
            sessionUuid,
            sessionId,
            token,
        };
    }, [form?.id, answers, sessionUuid, sessionId, token]);

    useEffect(() => {
        return () => {
            toastTimersRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
            toastTimersRef.current.clear();
        };
    }, []);

    useEffect(() => {
        if (isSubmitted) {
            stopMonitoring();
        }
    }, [isSubmitted, stopMonitoring]);

    useEffect(() => () => stopMonitoring(), [stopMonitoring]);

    useEffect(() => {
        violationCountRef.current = 0;
        setToasts([]);
        focusLossActiveRef.current = false;
    }, [form?.id, sessionUuid]);

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
        if (!form?.id || !sessionUuid) {
            return undefined;
        }

        if (isSubmitted || sessionId || attemptInFlightRef.current) {
            return undefined;
        }

        let isActive = true;
        attemptInFlightRef.current = true;

        const startAttempt = async () => {
            const { attempt } = await createResponseAttempt({
                formId: form.id,
                sessionUuid,
                token,
            });

            if (!isActive) {
                return;
            }

            if (attempt?.session_id) {
                const resolvedUuid = attempt.session_uuid || sessionUuid;
                setSessionId(attempt.session_id);
                writeDraftSession(form.id, resolvedUuid, attempt.session_id);
            }

            attemptInFlightRef.current = false;
        };

        startAttempt();

        return () => {
            isActive = false;
            attemptInFlightRef.current = false;
        };
    }, [form?.id, isSubmitted, sessionId, sessionUuid, token]);

    useEffect(() => {
        if (!monitoringActive) {
            return undefined;
        }

        const handleVisibilityChange = () => {
            const isHidden = document.hidden;
            enqueueEvent({
                event_type: isHidden ? 'visibility_hidden' : 'visibility_visible',
                metadata: { source: 'visibilitychange' },
                occurred_at: new Date().toISOString(),
            });

            if (isHidden) {
                if (!focusLossActiveRef.current) {
                    registerViolation();
                }
                focusLossActiveRef.current = true;
            } else {
                focusLossActiveRef.current = false;
            }
        };

        const handleBlur = () => {
            enqueueEvent({
                event_type: 'window_blur',
                metadata: { source: 'window' },
                occurred_at: new Date().toISOString(),
            });
            if (!focusLossActiveRef.current) {
                registerViolation();
            }
            focusLossActiveRef.current = true;
        };

        const handleFocus = () => {
            enqueueEvent({
                event_type: 'window_focus',
                metadata: { source: 'window' },
                occurred_at: new Date().toISOString(),
            });
            focusLossActiveRef.current = false;
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        window.addEventListener('focus', handleFocus);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            window.removeEventListener('focus', handleFocus);
        };
    }, [enqueueEvent, monitoringActive, registerViolation]);

    // Timer logic
    useEffect(() => {
        if (!timeLimit || !sessionId || isSubmitted) {
            return;
        }

        // Initialize timer if not already set, using session start or current time
        if (timeLeft === null) {
            setTimeLeft(timeLimit);
        }

        const timerId = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev === null) return prev;
                const next = prev - 1;
                if (next <= 0) {
                    clearInterval(timerId);
                    pushToast('Time is up! Auto-submitting...', 'high');
                    handleAutoSubmit();
                    return 0;
                }
                if (next === 60) {
                    pushToast('1 minute remaining.', 'mid');
                }
                return next;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLimit, sessionId, isSubmitted, handleAutoSubmit, pushToast, timeLeft]);

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
                sessionId,
                token,
            });

        if (serverErrors && Object.keys(serverErrors).length > 0) {
            setFieldErrors(serverErrors);
        }

        if (submitMessage) {
            setSubmitError(submitMessage);
            toast.error(submitMessage);
        } else if (serverErrors && Object.keys(serverErrors).length > 0) {
            toast.error('Please review the highlighted questions.');
        }

        if (response) {
            setSubmission(response);
            setIsSubmitted(true);
            stopMonitoring();
            toast.success('Response submitted.');
        }

        setIsSubmitting(false);
    };

    if (status === 'loading') {
        return <PageSpinner message="Loading form..." />;
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary px-4 py-10 sm:px-6">
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

    const formatTime = (seconds) => {
        if (seconds === null) return '';
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        const h = Math.floor(seconds / 3600);
        if (h > 0) {
            return `${h}:${m}:${s}`;
        }
        return `${m}:${s}`;
    };

    return (
        <div className="min-h-screen bg-primary text-primary pb-10" style={containerStyle}>
            {timeLimit && timeLeft !== null && !isSubmitted && (
                <div className="fixed top-0 left-0 right-0 z-50 flex h-12 items-center justify-center bg-[var(--primary-500)] text-on-primary font-medium shadow-md transition-colors">
                    <span className="text-sm">Time Remaining: {formatTime(timeLeft)}</span>
                </div>
            )}
            
            <header className="flex h-16 items-center border-b border-default bg-secondary px-4 shadow-sm">
                {toasts.length > 0 && (
                    <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col items-end gap-3 px-4">
                        {toasts.map((toast) => (
                            <div
                                key={toast.id}
                                className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-default bg-primary px-4 py-3 text-sm text-primary shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-8"
                            >
                                <span
                                    className={`mt-0.5 inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getToastToneClass(
                                        toast.tone
                                    )}`}
                                >
                                    <WarningIcon className="h-4 w-4 text-primary" />
                                </span>
                                <span className="flex-1 font-medium leading-relaxed mt-1">{toast.message}</span>
                            </div>
                        ))}
                    </div>
                )}
            </header>
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 pt-10 sm:px-6">
                {themeHeaderImage && (
                    <div className="rounded-xl overflow-hidden shadow-sm h-48 w-full border border-default">
                        <img src={themeHeaderImage} alt="Form Cover" className="w-full h-full object-cover" />
                    </div>
                )}
                <div className="rounded-xl border border-default bg-secondary p-6" style={themePrimaryColor ? { borderTop: `8px solid ${themePrimaryColor}` } : {}}>
                    <h1 className="text-title font-semibold text-primary">
                        {form?.title || 'Untitled form'}
                    </h1>
                    {form?.description && (
                        <p className="mt-2 text-sm text-secondary">
                            {form.description}
                        </p>
                    )}
                </div>

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
                                className="inline-flex w-full items-center justify-center rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-on-primary transition hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isSubmitting ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Submitting...
                                    </span>
                                ) : (
                                    'Submit'
                                )}
                            </button>
                            {(isAuthenticated || monitoringActive) && (
                                <div className="mt-2 flex flex-col gap-1 text-xs text-secondary">
                                    {isAuthenticated && (
                                        <span>
                                            {isSaving && 'Saving...'}
                                            {!isSaving && saveError && saveError}
                                            {!isSaving && !saveError && lastSavedAt && 'Draft saved'}
                                        </span>
                                    )}
                                    {monitoringActive && (
                                        <span>Monitoring active</span>
                                    )}
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
