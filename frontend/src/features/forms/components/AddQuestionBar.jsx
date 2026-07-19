import { Type, AlignJustify, CircleDot, CheckSquare, List, SplitSquareVertical, Sparkles } from 'lucide-react';

const AddQuestionBar = ({ onAdd, onAddSection, onAiGenerate, isDisabled = false }) => {
    return (
        <div className="flex w-fit gap-2 rounded-xl border border-default bg-tertiary p-2 shadow-sm md:flex-col md:shadow-md">
            <button
                type="button"
                onClick={onAiGenerate}
                disabled={isDisabled}
                title="Generate with AI"
                aria-label="Generate with AI"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-[var(--primary-500)] hover:bg-[var(--primary-500)] hover:text-white'
                    }`}
            >
                <Sparkles size={20} />
            </button>

            <div className="mx-2 h-px w-auto bg-default md:mx-auto md:h-auto md:w-5 md:border-t" />

            <button
                type="button"
                onClick={() => onAdd('short_text')}
                disabled={isDisabled}
                title="Add short text"
                aria-label="Add short text"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <Type size={20} />
            </button>
            <button
                type="button"
                onClick={() => onAdd('paragraph')}
                disabled={isDisabled}
                title="Add paragraph"
                aria-label="Add paragraph"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <AlignJustify size={20} />
            </button>
            <button
                type="button"
                onClick={() => onAdd('multiple_choice')}
                disabled={isDisabled}
                title="Add multiple choice"
                aria-label="Add multiple choice"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <CircleDot size={20} />
            </button>
            <button
                type="button"
                onClick={() => onAdd('checkboxes')}
                disabled={isDisabled}
                title="Add checkboxes"
                aria-label="Add checkboxes"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <CheckSquare size={20} />
            </button>
            <button
                type="button"
                onClick={() => onAdd('dropdown')}
                disabled={isDisabled}
                title="Add dropdown"
                aria-label="Add dropdown"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <List size={20} />
            </button>
            
            <div className="mx-2 h-px w-auto bg-default md:mx-auto md:h-auto md:w-5 md:border-t" />
            
            <button
                type="button"
                onClick={onAddSection}
                disabled={isDisabled}
                title="Add section"
                aria-label="Add section"
                className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${isDisabled
                    ? 'text-muted opacity-70 cursor-not-allowed'
                    : 'text-secondary hover:bg-secondary hover:text-primary'
                    }`}
            >
                <SplitSquareVertical size={20} />
            </button>
        </div>
    );
};

export default AddQuestionBar;