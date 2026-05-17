import { useMemo, useState } from 'react';
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

const FormBuilderPage = () => {
    const { id } = useParams();
    const {
        status,
        loadError,
        title,
        description,
        sections,
        isSaving,
        saveError,
        validationErrors,
        actions,
    } = useFormBuilder({ formId: id });

    const [activeQuestionId, setActiveQuestionId] = useState(null);

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
        setActiveQuestionId(event.active?.id ?? null);
    };

    const handleDragCancel = () => {
        setActiveQuestionId(null);
    };

    const handleDragEnd = (event) => {
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

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-6 py-10">
                <p className="text-sm text-secondary">Loading form...</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-6 py-10">
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

    const statusLabel = isSaving ? 'Saving...' : 'Saved';

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
        >
            <div className="min-h-screen bg-primary text-primary">
                <div className="mx-auto w-full max-w-4xl px-6 py-10">
                    <div className="flex flex-col gap-6">
                        <section className="rounded-xl border border-default bg-secondary p-6">
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs text-secondary">
                                        Form title
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(event) =>
                                            actions.setTitle(event.target.value)
                                        }
                                        placeholder="Untitled form"
                                        className="w-full rounded-lg border border-default bg-tertiary px-3 py-2 text-base text-primary placeholder:text-muted focus:border-focus focus:outline-none"
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
                                        className="w-full resize-none rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
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
                                    isDragDisabled={isSaving}
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
                            className="w-full rounded-lg border border-default bg-tertiary px-4 py-3 text-sm font-semibold text-secondary transition hover:text-primary"
                        >
                            Add section
                        </button>
                    </div>
                </div>
            </div>
            <DragOverlay>
                {activeQuestion ? (
                    <QuestionCardPreview question={activeQuestion} />
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default FormBuilderPage;