import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createDefaultSection, createQuestion } from '../utils/schemaHelpers';
import { fetchForm, saveDraft } from '../services/formService';

const SAVE_DELAY_MS = 800;

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const buildDraftSchema = (section, questions) => ({
    sections: [
        {
            id: section.id,
            title: section.title,
            description: section.description,
            questions,
        },
    ],
});

const createValidationErrors = (title, questions) => {
    const errors = { title: '', questions: {} };

    if (!isNonEmptyString(title)) {
        errors.title = 'Title is required.';
    }

    questions.forEach((question) => {
        if (!isNonEmptyString(question.label)) {
            errors.questions[question.id] = 'Question label is required.';
        }
    });

    return errors;
};

const hasValidationErrors = (errors) => {
    if (errors.title) {
        return true;
    }
    return Object.keys(errors.questions).length > 0;
};

const useFormBuilder = ({ formId }) => {
    const [status, setStatus] = useState('loading');
    const [loadError, setLoadError] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [section, setSection] = useState(createDefaultSection());
    const [questions, setQuestions] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
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

            const [firstSection] = form.draftSchema.sections;
            const normalizedSection = firstSection || createDefaultSection();

            setTitle(form.title || '');
            setDescription(form.description || '');
            setSection({
                id: normalizedSection.id,
                title: normalizedSection.title,
                description: normalizedSection.description,
            });
            setQuestions(normalizedSection.questions);
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
        () => createValidationErrors(title, questions),
        [title, questions]
    );

    const canSave = !hasValidationErrors(validationErrors);

    useEffect(() => {
        if (status !== 'ready') {
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

            const draftSchema = buildDraftSchema(section, questions);
            const { error } = await saveDraft({
                id: formId,
                title,
                description,
                draftSchema,
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
    }, [status, canSave, formId, title, description, questions, section]);

    const updateQuestion = useCallback((id, updates) => {
        setQuestions((prev) =>
            prev.map((question) =>
                question.id === id ? { ...question, ...updates } : question
            )
        );
    }, []);

    const deleteQuestion = useCallback((id) => {
        setQuestions((prev) => prev.filter((question) => question.id !== id));
    }, []);

    const addQuestion = useCallback((type) => {
        setQuestions((prev) => [...prev, createQuestion(type)]);
    }, []);

    return {
        status,
        loadError,
        title,
        description,
        questions,
        isSaving,
        lastSavedAt,
        saveError,
        validationErrors,
        actions: {
            setTitle,
            setDescription,
            updateQuestion,
            deleteQuestion,
            addQuestion,
        },
    };
};

export default useFormBuilder;