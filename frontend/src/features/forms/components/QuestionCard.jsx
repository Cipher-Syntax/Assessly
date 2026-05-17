import { useSortable } from '@dnd-kit/sortable';

const QuestionCard = ({
    question,
    error,
    sectionId,
    sections,
    onChange,
    onDelete,
    onMoveSection,
    dragHandleProps,
    isDragDisabled,
    isDragging,
    setNodeRef,
    style,
    isDragOverlay,
}) => {
    if (isDragOverlay) {
        return (
            <div className="rounded-xl border border-default bg-tertiary p-4 shadow-lg">
                <div className="text-sm text-primary">
                    {question.label || 'Untitled question'}
                </div>
                <div className="text-xs text-secondary">
                    {question.type === 'paragraph' ? 'Paragraph' : 'Short text'}
                </div>
            </div>
        );
    }

    const handleLabelChange = (event) => {
        onChange(sectionId, question.id, { label: event.target.value });
    };

    const handleTypeChange = (event) => {
        onChange(sectionId, question.id, { type: event.target.value });
    };

    const handleRequiredChange = (event) => {
        onChange(sectionId, question.id, { required: event.target.checked });
    };

    const handleSectionChange = (event) => {
        onMoveSection(question.id, event.target.value);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`rounded-xl border border-default bg-tertiary p-5 transition ${isDragging ? 'opacity-60' : 'opacity-100'
                }`}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <label className="text-xs text-secondary">Question label</label>
                    <input
                        type="text"
                        value={question.label}
                        onChange={handleLabelChange}
                        placeholder="Untitled question"
                        className="w-full rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                    />
                    {error && <p className="text-xs text-danger">{error}</p>}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary">Type</label>
                        <select
                            value={question.type}
                            onChange={handleTypeChange}
                            className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none"
                        >
                            <option value="short_text">Short text</option>
                            <option value="paragraph">Paragraph</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary">Section</label>
                        <select
                            value={sectionId}
                            onChange={handleSectionChange}
                            className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none"
                        >
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.title || 'Untitled section'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <label className="flex items-center gap-2 text-xs text-secondary">
                        <input
                            type="checkbox"
                            checked={question.required}
                            onChange={handleRequiredChange}
                            className="h-4 w-4 rounded border-default bg-secondary text-primary-500 focus:ring-0"
                        />
                        Required
                    </label>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            {...dragHandleProps}
                            disabled={isDragDisabled}
                            className={`text-xs transition ${isDragDisabled
                                    ? 'text-muted opacity-50 cursor-not-allowed'
                                    : 'text-secondary hover:text-primary cursor-grab active:cursor-grabbing'
                                }`}
                        >
                            Drag
                        </button>
                        <button
                            type="button"
                            onClick={() => onDelete(sectionId, question.id)}
                            className="text-xs text-muted transition hover:text-danger"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SortableQuestionCard = ({
    question,
    error,
    sectionId,
    sections,
    onChange,
    onDelete,
    onMoveSection,
    isDragDisabled,
}) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
        useSortable({
            id: question.id,
            data: { sectionId, questionId: question.id },
            disabled: isDragDisabled,
        });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
            transition,
        }
        : { transition };

    const dragHandleProps = isDragDisabled
        ? {}
        : {
            ...attributes,
            ...listeners,
        };

    return (
        <QuestionCard
            question={question}
            error={error}
            sectionId={sectionId}
            sections={sections}
            onChange={onChange}
            onDelete={onDelete}
            onMoveSection={onMoveSection}
            dragHandleProps={dragHandleProps}
            isDragDisabled={isDragDisabled}
            isDragging={isDragging}
            setNodeRef={setNodeRef}
            style={style}
        />
    );
};

export const QuestionCardPreview = ({ question }) => (
    <QuestionCard question={question} isDragOverlay />
);

export default QuestionCard;