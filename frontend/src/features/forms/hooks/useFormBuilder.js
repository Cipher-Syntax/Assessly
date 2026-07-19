import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    createQuestion,
    createSection,
    isChoiceType,
    moveQuestion,
} from '../utils/schemaHelpers';
import { fetchForm, publishForm, saveDraft } from '../services/formService';

const SAVE_DELAY_MS = 800;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const buildDraftSchema = (sections) => ({
    sections,
});

const createValidationErrors = (title, sections) => {
    const errors = { title: '', sections: {}, questions: {} };

    if (!isNonEmptyString(title)) {
        errors.title = 'Title is required.';
    }

    sections.forEach((section) => {
        if (!isNonEmptyString(section.title)) {
            errors.sections[section.id] = 'Section title is required.';
        }

        section.questions.forEach((question) => {
            const questionErrors = { label: '', optionsList: '', options: {} };

            if (!isNonEmptyString(question.label)) {
                questionErrors.label = 'Question label is required.';
            }

            if (isChoiceType(question.type)) {
                const options = Array.isArray(question.options) ? question.options : [];

                if (options.length === 0) {
                    questionErrors.optionsList = 'At least one option is required.';
                }

                options.forEach((option, index) => {
                    if (!isNonEmptyString(option)) {
                        questionErrors.options[index] = 'Option label is required.';
                    }
                });
            }

            if (
                questionErrors.label ||
                questionErrors.optionsList ||
                Object.keys(questionErrors.options).length > 0
            ) {
                errors.questions[question.id] = questionErrors;
            }
        });
    });

    return errors;
};

const hasQuestionErrors = (questionError) => {
    if (!questionError) {
        return false;
    }

    if (typeof questionError === 'string') {
        return Boolean(questionError);
    }

    if (questionError.label || questionError.optionsList) {
        return true;
    }

    return Boolean(questionError.options && Object.keys(questionError.options).length > 0);
};

const hasValidationErrors = (errors) => {
    if (errors.title) {
        return true;
    }

    if (Object.keys(errors.sections).length > 0) {
        return true;
    }

    return Object.values(errors.questions).some(hasQuestionErrors);
};

const useFormBuilder = ({ formId }) => {
    const [status, setStatus] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [settings, setSettings] = useState({});
    const [sections, setSections] = useState([createSection()]);
    const [publishedVersion, setPublishedVersion] = useState(null);
    const [isEditingDraft, setIsEditingDraft] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [saveError, setSaveError] = useState('');

    const initialLoadRef = useRef(true);
    const saveSequenceRef = useRef(0);
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        const loadForm = async () => {
            if (!formId) {
                setStatus('error');
                setLoadError('Missing form id.');
                return;
            }

            setStatus('loading');
            const { form, error } = await fetchForm(formId);

            if (!isMounted) {
                return;
            }

            if (error || !form) {
                setStatus('error');
                setLoadError(error || 'Unable to load this form.');
                return;
            }

            const normalizedSections = Array.isArray(form.draftSchema.sections)
                ? form.draftSchema.sections
                : [createSection()];

            setTitle(form.title || '');
            setDescription(form.description || '');
            setSettings(form.settings || {});
            setSections(
                normalizedSections.length > 0 ? normalizedSections : [createSection()]
            );
            setPublishedVersion(form.publishedVersion || null);
            setIsEditingDraft(!form.publishedVersion);
            setLoadError('');
            setSaveError('');
            setStatus('ready');
            initialLoadRef.current = true;
        };

        loadForm();

        return () => {
            isMounted = false;
        };
    }, [formId]);

    const validationErrors = useMemo(
        () => createValidationErrors(title, sections),
        [title, sections]
    );

    const canSave = !hasValidationErrors(validationErrors);

    useEffect(() => {
        if (status !== 'ready') {
            return undefined;
        }

        if (!isEditingDraft || isPublishing) {
            return undefined;
        }

        if (initialLoadRef.current) {
            initialLoadRef.current = false;
            return undefined;
        }

        if (!canSave) {
            return undefined;
        }

        const timeoutId = setTimeout(async () => {
            const sequence = ++saveSequenceRef.current;
            setIsSaving(true);
            setSaveError('');

            const draftSchema = buildDraftSchema(sections);
            const { error } = await saveDraft({
                id: formId,
                title,
                description,
                draftSchema,
                settings,
            });

            if (!isMountedRef.current || sequence !== saveSequenceRef.current) {
                return;
            }

            if (error) {
                setIsSaving(false);
                setSaveError(error);
                return;
            }

            setIsSaving(false);
            setLastSavedAt(new Date().toISOString());
        }, SAVE_DELAY_MS);

        return () => clearTimeout(timeoutId);
    }, [status, isEditingDraft, isPublishing, canSave, formId, title, description, sections, settings]);

    const applyFormState = useCallback((form, shouldResetEditState = true) => {
        const normalizedSections = Array.isArray(form.draftSchema.sections)
            ? form.draftSchema.sections
            : [createSection()];

        setTitle(form.title || '');
        setDescription(form.description || '');
        setSettings(form.settings || {});
        setSections(
            normalizedSections.length > 0 ? normalizedSections : [createSection()]
        );
        setPublishedVersion(form.publishedVersion || null);
        if (shouldResetEditState) {
            setIsEditingDraft(!form.publishedVersion);
        }
        setLoadError('');
        setSaveError('');
        setStatus('ready');
        initialLoadRef.current = true;
    }, []);

    const handlePublish = useCallback(async () => {
        if (!formId || isPublishing) {
            return;
        }

        setIsPublishing(true);
        setIsSaving(false);
        setSaveError('');
        saveSequenceRef.current += 1;

        const { published, error } = await publishForm(formId);

        if (!isMountedRef.current) {
            return;
        }

        if (error) {
            setIsPublishing(false);
            setSaveError(error);
            return;
        }

        const { form, error: reloadError } = await fetchForm(formId);

        if (!isMountedRef.current) {
            return;
        }

        if (form) {
            applyFormState(form, true);
        } else if (published) {
            setPublishedVersion(published);
            setIsEditingDraft(false);
        }

        if (reloadError) {
            setSaveError(reloadError);
        }

        setIsPublishing(false);
    }, [formId, isPublishing, applyFormState]);

    const handleEditDraft = useCallback(() => {
        setIsEditingDraft(true);
        setSaveError('');
        initialLoadRef.current = true;
    }, []);

    const addSection = useCallback(() => {
        setSections((prev) => [...prev, createSection()]);
    }, []);

    const updateSection = useCallback((id, patch) => {
        setSections((prev) =>
            prev.map((section) => (section.id === id ? { ...section, ...patch } : section))
        );
    }, []);

    const deleteSection = useCallback((id) => {
        setSections((prev) => {
            if (prev.length <= 1) {
                return prev;
            }

            return prev.filter((section) => section.id !== id);
        });
    }, []);

    const duplicateSection = useCallback((id) => {
        setSections((prev) => {
            const index = prev.findIndex((section) => section.id === id);

            if (index === -1) {
                return prev;
            }

            const source = prev[index];
            const duplicatedQuestions = source.questions.map((question) => ({
                ...question,
                id: crypto.randomUUID(),
            }));

            const duplicatedSection = {
                ...source,
                id: crypto.randomUUID(),
                questions: duplicatedQuestions,
            };

            const next = [...prev];
            next.splice(index + 1, 0, duplicatedSection);
            return next;
        });
    }, []);

    const addQuestion = useCallback((sectionId, type) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? { ...section, questions: [...section.questions, createQuestion(type)] }
                    : section
            )
        );
    }, []);

    const updateQuestion = useCallback((sectionId, questionId, patch) => {
        setSections((prev) =>
            prev.map((section) => {
                if (section.id !== sectionId) {
                    return section;
                }

                return {
                    ...section,
                    questions: section.questions.map((question) =>
                        question.id === questionId ? { ...question, ...patch } : question
                    ),
                };
            })
        );
    }, []);

    const deleteQuestion = useCallback((sectionId, questionId) => {
        setSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? {
                          ...section,
                          questions: section.questions.filter(
                              (question) => question.id !== questionId
                          ),
                      }
                    : section
            )
        );
    }, []);

    const moveQuestionAction = useCallback(
        (sourceSectionId, targetSectionId, questionId, targetIndex) => {
            setSections((prev) =>
                moveQuestion(
                    { sections: prev },
                    sourceSectionId,
                    targetSectionId,
                    questionId,
                    targetIndex
                ).sections
            );
        },
        []
    );

    return {
        status,
        loadError,
        title,
        description,
        settings,
        sections,
        publishedVersion,
        isEditingDraft,
        isSaving,
        isPublishing,
        lastSavedAt,
        saveError,
        validationErrors,
        actions: {
            setTitle,
            setDescription,
            setSettings,
            addSection,
            updateSection,
            deleteSection,
            duplicateSection,
            updateQuestion,
            deleteQuestion,
            addQuestion,
            moveQuestion: moveQuestionAction,
            publishForm: handlePublish,
            editDraft: handleEditDraft,
        },
    };
};

export default useFormBuilder;