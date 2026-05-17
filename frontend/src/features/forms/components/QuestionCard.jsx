import { useSortable } from '@dnd-kit/sortable';
import {
    addOption,
    createQuestion,
    duplicateOption,
    isChoiceType,
    removeOption,
} from '../utils/schemaHelpers';

const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

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
                    {getQuestionTypeLabel(question.type)}
                </div>
            </div>
        );
    }

    const questionError = typeof error === 'string' ? { label: error } : error || {};
    const optionErrors = questionError.options || {};
    const optionsListError = questionError.optionsList || '';
    const labelError = questionError.label || '';
    const isChoiceQuestion = isChoiceType(question.type);
    const options = Array.isArray(question.options) ? question.options : [];

    const handleLabelChange = (event) => {
        onChange(sectionId, question.id, { label: event.target.value });
    };

    const handleTypeChange = (event) => {
        const nextType = event.target.value;
        const patch = { type: nextType };

        if (isChoiceType(nextType)) {
            const nextOptions =
                Array.isArray(question.options) && question.options.length > 0
                    ? question.options
                    : createQuestion(nextType).options;
            patch.options = nextOptions || [];
        }

        onChange(sectionId, question.id, patch);
    };

    const handleRequiredChange = (event) => {
        onChange(sectionId, question.id, { required: event.target.checked });
    };

    const handleSectionChange = (event) => {
        onMoveSection(question.id, event.target.value);
    };

    const handleOptionChange = (index, value) => {
        const nextOptions = [...options];
        nextOptions[index] = value;
        onChange(sectionId, question.id, { options: nextOptions });
    };

    const handleAddOption = () => {
        onChange(sectionId, question.id, { options: addOption(question) });
    };

    const handleDuplicateOption = (index) => {
        onChange(sectionId, question.id, { options: duplicateOption(question, index) });
    };

    const handleRemoveOption = (index) => {
        onChange(sectionId, question.id, { options: removeOption(question, index) });
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
                    {labelError && <p className="text-xs text-danger">{labelError}</p>}
                </div>

                {isChoiceQuestion && (
                    <div className="flex flex-col gap-3">
                        <label className="text-xs text-secondary">Options</label>
                        <div className="flex flex-col gap-2">
                            {options.map((option, index) => {
                                const isDeleteDisabled = options.length <= 1;
                                const optionError = optionErrors[index];

                                return (
                                    <div
                                        key={`${question.id}-option-${index}`}
                                        className="rounded-md border border-default bg-secondary p-3"
                                    >
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(event) =>
                                                        handleOptionChange(index, event.target.value)
                                                    }
                                                    placeholder={`Option ${index + 1}`}
                                                    className="w-full flex-1 rounded-lg border border-default bg-tertiary px-3 py-2 text-sm text-primary placeholder:text-muted focus:border-focus focus:outline-none"
                                                />
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDuplicateOption(index)}
                                                        className="text-xs text-secondary transition hover:text-primary"
                                                    >
                                                        Duplicate
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveOption(index)}
                                                        disabled={isDeleteDisabled}
                                                        className={`text-xs transition ${isDeleteDisabled
                                                            ? 'text-muted opacity-50 cursor-not-allowed'
                                                            : 'text-muted hover:text-danger'
                                                            }`}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                            {optionError && (
                                                <p className="text-xs text-muted">{optionError}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {optionsListError && (
                            <p className="text-xs text-muted">{optionsListError}</p>
                        )}
                        <button
                            type="button"
                            onClick={handleAddOption}
                            className="text-xs text-secondary transition hover:text-primary"
                        >
                            Add option
                        </button>
                    </div>
                )}

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
                            <option value="multiple_choice">Multiple choice</option>
                            <option value="checkboxes">Checkboxes</option>
                            <option value="dropdown">Dropdown</option>
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