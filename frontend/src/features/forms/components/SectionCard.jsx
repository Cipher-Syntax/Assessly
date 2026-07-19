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
    isEditing,
    onUpdateSection,
    onDuplicateSection,
    onDeleteSection,
    onAddQuestion,
    onUpdateQuestion,
    onDeleteQuestion,
    onMoveQuestion,
    isActive,
    onActivate,
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
        <section 
            className={`relative rounded-xl border bg-secondary p-6 transition-colors ${isActive ? 'border-primary-500 shadow-sm' : 'border-default'}`}
            onClick={onActivate}
            onFocusCapture={onActivate}
        >
            <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <span className="rounded-full border border-default bg-tertiary px-3 py-1 text-xs text-secondary">
                        Section {sectionIndex + 1}
                    </span>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => onDuplicateSection(section.id)}
                            disabled={!isEditing}
                            className={`text-xs transition ${isEditing
                                ? 'text-secondary hover:text-primary'
                                : 'text-muted opacity-50 cursor-not-allowed'
                                }`}
                        >
                            Duplicate
                        </button>
                        <button
                            type="button"
                            onClick={() => onDeleteSection(section.id)}
                            disabled={!isEditing || !canDelete}
                            className={`text-xs transition ${isEditing && canDelete
                                ? 'text-muted hover:text-danger'
                                : 'text-muted opacity-50 cursor-not-allowed'
                                }`}
                        >
                            Delete
                        </button>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={section.title}
                        onChange={handleTitleChange}
                        placeholder="Untitled section"
                        disabled={!isEditing}
                        className="w-full bg-transparent border-b border-default px-0 py-2 text-3xl font-normal text-primary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                    />
                    {sectionError && (
                        <p className="text-xs text-danger">{sectionError}</p>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <textarea
                        value={section.description}
                        onChange={handleDescriptionChange}
                        placeholder="Form description"
                        rows={2}
                        disabled={!isEditing}
                        className="w-full resize-none bg-transparent border-b border-default px-0 py-2 text-sm text-secondary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
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
                                isEditing={isEditing}
                                onChange={onUpdateQuestion}
                                onDelete={onDeleteQuestion}
                                onMoveSection={handleMoveQuestion}
                            />
                        ))}
                    </div>
                </SortableContext>
            </div>
        </section>
    );
};

export default SectionCard;
