import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
    closestCenter,
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import SectionCard from './components/SectionCard';
import { QuestionCardPreview } from './components/QuestionCard';
import useFormBuilder from './hooks/useFormBuilder';
import ShareModal from '../permissions/components/ShareModal';
import ResponsesPanel from '../responses/components/ResponsesPanel';
import PageSpinner from '../../components/ui/PageSpinner';
import Spinner from '../../components/ui/Spinner';
import { useToast } from '../../app/useToast';

const FormBuilderPage = () => {
    const { id } = useParams();
    const {
        status,
        loadError,
        title,
        description,
        sections,
        publishedVersion,
        isEditingDraft,
        isSaving,
        isPublishing,
        lastSavedAt,
        saveError,
        validationErrors,
        actions,
    } = useFormBuilder({ formId: id });

    const [activeQuestionId, setActiveQuestionId] = useState(null);
    const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('builder');
    const toast = useToast();
    const hasLoadedRef = useRef(false);
    const lastSaveToastRef = useRef(0);
    const lastPublishedIdRef = useRef(publishedVersion?.id ?? null);
    const wasPublishingRef = useRef(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 6 },
        })
    );

    const activeQuestion = useMemo(() => {
        if (!activeQuestionId) {
            return null;
        }

        for (const section of sections) {
            const question = section.questions.find(
                (item) => item.id === activeQuestionId
            );
            if (question) {
                return question;
            }
        }

        return null;
    }, [activeQuestionId, sections]);

    const handleDragStart = (event) => {
        if (!isEditingDraft || isPublishing) {
            return;
        }
        setActiveQuestionId(event.active?.id ?? null);
    };

    const handleDragCancel = () => {
        setActiveQuestionId(null);
    };

    const handleDragEnd = (event) => {
        if (!isEditingDraft || isPublishing) {
            setActiveQuestionId(null);
            return;
        }
        const { active, over } = event;
        setActiveQuestionId(null);

        if (!active || !over) {
            return;
        }

        const activeData = active.data?.current;
        const overData = over.data?.current;

        if (!activeData?.sectionId || !activeData?.questionId) {
            return;
        }

        const sourceSectionId = activeData.sectionId;
        if (!overData?.sectionId) {
            return;
        }

        const targetSectionId = overData.sectionId;

        const targetSection = sections.find(
            (section) => section.id === targetSectionId
        );

        if (!targetSection) {
            return;
        }

        let targetIndex = targetSection.questions.length;

        if (overData?.questionId) {
            const overIndex = targetSection.questions.findIndex(
                (question) => question.id === overData.questionId
            );
            if (overIndex !== -1) {
                targetIndex = overIndex;
            }
        }

        actions.moveQuestion(
            sourceSectionId,
            targetSectionId,
            activeData.questionId,
            targetIndex
        );
    };

    useEffect(() => {
        if (status === 'ready' && !hasLoadedRef.current) {
            hasLoadedRef.current = true;
        }
    }, [status]);

    useEffect(() => {
        if (!hasLoadedRef.current || !lastSavedAt) {
            return;
        }

        const now = Date.now();
        if (now - lastSaveToastRef.current < 10000) {
            return;
        }

        toast.success('Draft saved.');
        lastSaveToastRef.current = now;
    }, [lastSavedAt, toast]);

    useEffect(() => {
        if (isPublishing) {
            wasPublishingRef.current = true;
            return;
        }

        if (!wasPublishingRef.current) {
            return;
        }

        wasPublishingRef.current = false;

        if (publishedVersion && publishedVersion.id !== lastPublishedIdRef.current) {
            lastPublishedIdRef.current = publishedVersion.id;
            toast.success('Form published.');
        }
    }, [isPublishing, publishedVersion, toast]);

    if (status === 'loading') {
        return <PageSpinner message="Loading form..." />;
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-4 py-10 sm:px-6">
                <div className="w-full max-w-xl rounded-xl border border-default bg-secondary px-6 py-6 text-center">
                    <h1 className="text-lg font-semibold text-primary">
                        Unable to load form
                    </h1>
                    <p className="mt-2 text-sm text-secondary">
                        {loadError || 'Please try again in a moment.'}
                    </p>
                </div>
            </div>
        );
    }

    const statusLabel = !isEditingDraft
        ? 'Draft locked'
        : isPublishing
            ? 'Publishing...'
            : isSaving
                ? 'Saving...'
                : 'Saved';
    const isReadOnly = !isEditingDraft || isPublishing;
    const showPublished = Boolean(publishedVersion);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-primary text-primary">
                <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
                    <div className="flex flex-col gap-6">
                        <section className="rounded-xl border border-default bg-secondary p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('builder')}
                                        className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${activeTab === 'builder'
                                            ? 'bg-primary-500 text-primary'
                                            : 'bg-tertiary text-secondary hover:text-primary'
                                            }`}
                                    >
                                        Builder
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('responses')}
                                        className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${activeTab === 'responses'
                                            ? 'bg-primary-500 text-primary'
                                            : 'bg-tertiary text-secondary hover:text-primary'
                                            }`}
                                    >
                                        Responses
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <label className="text-xs text-secondary">
                                        Form title
                                    </label>
                                    <div className="flex flex-wrap items-center gap-3">
                                        {showPublished && (
                                            <span className="rounded-full border border-default bg-tertiary px-3 py-1 text-xs text-secondary">
                                                Published
                                            </span>
                                        )}
                                        {showPublished && (
                                            <button
                                                type="button"
                                                onClick={actions.editDraft}
                                                disabled={isEditingDraft || isPublishing}
                                                className={`rounded-lg border border-default px-3 py-1 text-xs font-semibold transition ${isEditingDraft || isPublishing
                                                    ? 'text-muted opacity-60 cursor-not-allowed'
                                                    : 'bg-tertiary text-secondary hover:text-primary'
                                                    }`}
                                            >
                                                Edit draft
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => setIsShareOpen(true)}
                                            className="rounded-lg border border-default bg-tertiary px-3 py-1 text-xs font-semibold text-secondary transition hover:text-primary"
                                        >
                                            Share
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsPublishConfirmOpen(true)}
                                            disabled={isReadOnly}
                                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${isReadOnly
                                                ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                                                : 'bg-primary-500 text-primary hover:bg-primary-600'
                                                }`}
                                        >
                                            {isPublishing ? (
                                                <span className="inline-flex items-center gap-2">
                                                    <Spinner size="sm" />
                                                    Publishing...
                                                </span>
                                            ) : (
                                                'Publish'
                                            )}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) =>
                                            actions.setTitle(event.target.value)
                                        }
                                        placeholder="Untitled form"
                                        disabled={isReadOnly}
                                        className="w-full rounded-lg border border-default bg-tertiary px-3 py-2 text-base text-primary placeholder:text-muted focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                    />
                                    {validationErrors.title && (
                                        <p className="text-xs text-danger">
                                            {validationErrors.title}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-secondary">
                                        Description
                                    </label>
                                    <textarea
                                        value={description}
                                        onChange={(event) =>
                                            actions.setDescription(event.target.value)
                                        }
                                        placeholder="Describe what this form collects"
                                        rows={3}
                                        disabled={isReadOnly}
                                        className="w-full resize-none rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                    />
                                </div>
                                <div className="text-xs text-secondary">
                                    {statusLabel}
                                </div>
                                {saveError && (
                                    <p className="text-xs text-danger">{saveError}</p>
                                )}
                            </div>
                        </section>

                        {activeTab === 'builder' ? (
                            <>
                                <section className="flex flex-col gap-6">
                                    {sections.map((section, index) => (
                                        <SectionCard
                                            key={section.id}
                                            section={section}
                                            sectionIndex={index}
                                            sectionError={
                                                validationErrors.sections[section.id]
                                            }
                                            questionErrors={validationErrors.questions}
                                            sections={sections}
                                            canDelete={sections.length > 1}
                                            isDragDisabled={isSaving || isReadOnly}
                                            isEditing={!isReadOnly}
                                            onUpdateSection={actions.updateSection}
                                            onDuplicateSection={actions.duplicateSection}
                                            onDeleteSection={actions.deleteSection}
                                            onAddQuestion={actions.addQuestion}
                                            onUpdateQuestion={actions.updateQuestion}
                                            onDeleteQuestion={actions.deleteQuestion}
                                            onMoveQuestion={actions.moveQuestion}
                                        />
                                    ))}
                                </section>

                                <button
                                    type="button"
                                    onClick={actions.addSection}
                                    disabled={isReadOnly}
                                    className={`w-full rounded-lg border border-default px-4 py-3 text-sm font-semibold transition ${isReadOnly
                                        ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                                        : 'bg-tertiary text-secondary hover:text-primary'
                                        }`}
                                >
                                    Add section
                                </button>
                            </>
                        ) : (
                            <ResponsesPanel formId={id} />
                        )}
                    </div>
                </div>
            </div>
            {isPublishConfirmOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
                    <div className="w-full max-w-md rounded-xl border border-default bg-secondary p-6 shadow-lg">
                        <h2 className="text-lg font-semibold text-primary">Publish form?</h2>
                        <p className="mt-2 text-sm text-secondary">
                            Publishing locks the current draft into a versioned snapshot. You
                            can edit a new draft afterward.
                        </p>
                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setIsPublishConfirmOpen(false)}
                                className="rounded-lg border border-default bg-tertiary px-4 py-2 text-sm font-semibold text-secondary transition hover:text-primary"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsPublishConfirmOpen(false);
                                    actions.publishForm();
                                }}
                                disabled={isPublishing}
                                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${isPublishing
                                    ? 'bg-tertiary text-muted opacity-70 cursor-not-allowed'
                                    : 'bg-primary-500 text-primary hover:bg-primary-600'
                                    }`}
                            >
                                {isPublishing ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Spinner size="sm" />
                                        Publishing...
                                    </span>
                                ) : (
                                    'Publish'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isShareOpen && (
                <ShareModal
                    formId={id}
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                />
            )}
            <DragOverlay>
                {activeQuestion ? (
                    <QuestionCardPreview question={activeQuestion} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default FormBuilderPage;