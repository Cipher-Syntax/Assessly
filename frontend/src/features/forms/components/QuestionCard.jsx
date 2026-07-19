import { useSortable } from '@dnd-kit/sortable';
import { Copy, GripVertical, Plus, Trash2, Circle, Square } from 'lucide-react';
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
    isEditing = true,
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
    const isInteractionDisabled = !isEditing;
    const isDragHandleDisabled = isDragDisabled || !isEditing;

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
            className={`group relative rounded-xl border border-default bg-secondary p-6 transition-colors shadow-sm ${isDragging ? 'opacity-60' : 'opacity-100'
                }`}
        >
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1">
                        <input
                            type="text"
                            value={question.label}
                            onChange={handleLabelChange}
                            placeholder="Question title"
                            disabled={isInteractionDisabled}
                            className="w-full bg-transparent border-b border-default px-0 py-2 text-lg font-medium text-primary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                        />
                        {labelError && <p className="mt-1 text-xs text-danger">{labelError}</p>}
                    </div>
                    
                    <div className="w-full sm:w-48 shrink-0">
                        <select
                            value={question.type}
                            onChange={handleTypeChange}
                            disabled={isInteractionDisabled}
                            className="w-full rounded-md border border-default bg-secondary px-3 py-3 text-sm text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <option value="short_text">Short answer</option>
                            <option value="paragraph">Paragraph</option>
                            <option value="multiple_choice">Multiple choice</option>
                            <option value="checkboxes">Checkboxes</option>
                            <option value="dropdown">Dropdown</option>
                        </select>
                    </div>
                </div>

                {!isChoiceQuestion && (
                    <div className="mt-2 w-1/2">
                        <div className="border-b border-dashed border-muted py-2">
                            <span className="text-sm text-muted">
                                {question.type === 'short_text' ? 'Short answer text' : 'Long answer text'}
                            </span>
                        </div>
                    </div>
                )}

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
                                        className="group relative flex items-center gap-3"
                                    >
                                        <div className="shrink-0 pt-2 text-muted">
                                            {question.type === 'multiple_choice' && <Circle size={20} />}
                                            {question.type === 'checkboxes' && <Square size={20} />}
                                            {question.type === 'dropdown' && <span className="w-5 text-center text-sm">{index + 1}.</span>}
                                        </div>
                                        
                                        <div className="flex-1 flex flex-col gap-1">
                                            <div className="flex items-center">
                                                <input
                                                    type="text"
                                                    value={option}
                                                    onChange={(event) =>
                                                        handleOptionChange(index, event.target.value)
                                                    }
                                                    placeholder={`Option ${index + 1}`}
                                                    disabled={isInteractionDisabled}
                                                    className="w-full bg-transparent border-b border-transparent hover:border-default px-0 py-1.5 text-sm text-primary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors"
                                                />
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity ml-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            if (window.confirm('Are you sure you want to delete this option?')) {
                                                                handleRemoveOption(index);
                                                            }
                                                        }}
                                                        disabled={isDeleteDisabled || isInteractionDisabled}
                                                        aria-label={`Delete option ${index + 1}`}
                                                        className={`p-2 rounded-full transition ${isDeleteDisabled || isInteractionDisabled
                                                            ? 'text-muted opacity-50 cursor-not-allowed'
                                                            : 'text-muted hover:bg-tertiary hover:text-danger'
                                                            }`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                            {optionError && (
                                                <p className="text-xs text-danger">{optionError}</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        {optionsListError && (
                            <p className="text-xs text-muted">{optionsListError}</p>
                        )}
                        <div className="flex items-center gap-3">
                            <div className="shrink-0 pt-2 text-muted">
                                {question.type === 'multiple_choice' && <Circle size={20} />}
                                {question.type === 'checkboxes' && <Square size={20} />}
                                {question.type === 'dropdown' && <span className="w-5 text-center text-sm">{options.length + 1}.</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleAddOption}
                                    disabled={isInteractionDisabled}
                                    className={`text-sm py-1.5 focus:outline-none transition ${isInteractionDisabled
                                        ? 'text-muted opacity-50 cursor-not-allowed'
                                        : 'text-secondary hover:text-primary border-b border-transparent hover:border-default'
                                        }`}
                                >
                                    Add option
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-default mt-4">
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-secondary">Section</label>
                        <select
                            value={sectionId}
                            onChange={handleSectionChange}
                            disabled={isInteractionDisabled}
                            className="rounded-lg border border-default bg-secondary px-3 py-2 text-sm text-primary focus:border-focus focus:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {sections.map((section) => (
                                <option key={section.id} value={section.id}>
                                    {section.title || 'Untitled section'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-4 border-l border-default pl-4">
                        <button
                            type="button"
                            onClick={() => {
                                // Duplicate question logic could go here
                                // For now, we'll just keep the button as an icon
                            }}
                            disabled={isInteractionDisabled}
                            aria-label="Duplicate question"
                            className={`p-2 rounded-full transition ${isInteractionDisabled
                                ? 'text-muted opacity-50 cursor-not-allowed'
                                : 'text-secondary hover:bg-tertiary hover:text-primary'
                                }`}
                        >
                            <Copy size={20} />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to delete this question?')) {
                                    onDelete(sectionId, question.id);
                                }
                            }}
                            disabled={isInteractionDisabled}
                            aria-label="Delete question"
                            className={`p-2 rounded-full transition ${isInteractionDisabled
                                ? 'text-muted opacity-50 cursor-not-allowed'
                                : 'text-secondary hover:bg-tertiary hover:text-danger'
                                }`}
                        >
                            <Trash2 size={20} />
                        </button>
                        <div className="h-6 w-px bg-default mx-1"></div>
                        <label className="flex items-center gap-2 text-sm text-secondary cursor-pointer">
                            <span>Required</span>
                            <div className="relative inline-flex h-5 w-9 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out">
                                <input
                                    type="checkbox"
                                    checked={question.required}
                                    onChange={handleRequiredChange}
                                    disabled={isInteractionDisabled}
                                    className="peer sr-only"
                                />
                                <div className="h-5 w-9 rounded-full bg-tertiary border border-default peer-checked:bg-[var(--primary-500)] peer-checked:border-[var(--primary-500)] peer-focus:ring-2 peer-focus:ring-[var(--primary-500)] peer-focus:ring-offset-2 peer-focus:ring-offset-secondary transition-colors duration-200"></div>
                                <div className="absolute left-1 top-1 h-3 w-3 rounded-full bg-white transition-transform duration-200 peer-checked:translate-x-4"></div>
                            </div>
                        </label>
                    </div>
                </div>
                
                {/* Drag Handle at top center */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <div 
                        {...dragHandleProps}
                        className={`p-1 pt-2 transition ${isDragHandleDisabled ? 'text-muted opacity-50 cursor-not-allowed' : 'text-muted hover:text-primary'}`}
                    >
                        <GripVertical size={16} className="rotate-90" />
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
    isEditing,
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
            isEditing={isEditing}
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