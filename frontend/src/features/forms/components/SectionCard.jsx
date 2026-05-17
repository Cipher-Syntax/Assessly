import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import AddQuestionBar from './AddQuestionBar';
import { SortableQuestionCard } from './QuestionCard';

const SectionCard = ({
    section,
    sectionIndex,
    sectionError,
    questionErrors,
    sections,
    canDelete,
    isDragDisabled,
    onUpdateSection,
    onDuplicateSection,
    onDeleteSection,
    onAddQuestion,
    onUpdateQuestion,
    onDeleteQuestion,
    onMoveQuestion,
}) => {
    const { setNodeRef } = useDroppable({
        id: `section-${section.id}`,
        data: { sectionId: section.id },
    });

    const questionIds = section.questions.map((question) => question.id);

    const handleTitleChange = (event) => {
        onUpdateSection(section.id, { title: event.target.value });
    };

    const handleDescriptionChange = (event) => {
        onUpdateSection(section.id, { description: event.target.value });
    };

    const handleMoveQuestion = (questionId, targetSectionId) => {
        if (targetSectionId === section.id) {
            return;
        }

        onMoveQuestion(section.id, targetSectionId, questionId, null);
    };

    return (
        <section className="rounded-xl border border-default bg-secondary p-6">
            <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-full border border-default bg-tertiary px-3 py-1 text-xs text-secondary">
                        Section {sectionIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onDuplicateSection(section.id)}
                            className="text-xs text-secondary transition hover:text-primary"
                        >
                            Duplicate
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteSection(section.id)}
                            disabled={!canDelete}
                            className={`text-xs transition ${canDelete
                                ? 'text-muted hover:text-danger'
                                : 'text-muted opacity-50 cursor-not-allowed'
                                }`}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-secondary">Section title</label>
                    <input
                        type="text"
                        value={section.title}
                        onChange={handleTitleChange}
                        placeholder="Untitled section"
                        className="w-full rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                    {sectionError && (
                        <p className="text-xs text-danger">{sectionError}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-secondary">Description</label>
                    <textarea
                        value={section.description}
                        onChange={handleDescriptionChange}
                        placeholder="Describe this section"
                        rows={2}
                        className="w-full resize-none rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                </div>

                <SortableContext items={questionIds} strategy={verticalListSortingStrategy}>
                    <div
                        ref={setNodeRef}
                        className="flex min-h-12 flex-col gap-4"
                    >
                        {section.questions.map((question) => (
                            <SortableQuestionCard
                                key={question.id}
                                question={question}
                                error={questionErrors[question.id]}
                                sectionId={section.id}
                                sections={sections}
                                isDragDisabled={isDragDisabled}
                                onChange={onUpdateQuestion}
                                onDelete={onDeleteQuestion}
                                onMoveSection={handleMoveQuestion}
                            />
                        ))}
                    </div>
                </SortableContext>

                <AddQuestionBar onAdd={(type) => onAddQuestion(section.id, type)} />
            </div>
        </section>
    );
};

export default SectionCard;
