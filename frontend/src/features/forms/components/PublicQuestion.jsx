const QUESTION_TYPE_LABELS = {
    short_text: 'Short text',
    paragraph: 'Paragraph',
    multiple_choice: 'Multiple choice',
    checkboxes: 'Checkboxes',
    dropdown: 'Dropdown',
};

const getQuestionTypeLabel = (type) => QUESTION_TYPE_LABELS[type] || 'Short text';

const PublicQuestion = ({ question, index, value, error, onChange, isDisabled }) => {
    const label = question?.label || `Question ${index + 1}`;
    const type = question?.type || 'short_text';
    const typeLabel = getQuestionTypeLabel(type);
    const questionId = question?.id;
    const required = Boolean(question?.required);
    const options = Array.isArray(question?.options) ? question.options : [];
    const hasError = Boolean(error);
    const inputBorderClass = hasError ? 'border-danger' : 'border-default';
    
    const isFieldset = type === 'multiple_choice' || type === 'checkboxes';
    const WrapperComponent = isFieldset ? 'fieldset' : 'div';
    const LabelComponent = isFieldset ? 'legend' : 'label';
    const idAttr = questionId || `question-${index}`;
    const labelProps = isFieldset ? {} : { htmlFor: idAttr };

    const handleTextChange = (event) => {
        if (!questionId) {
            return;
        }
        onChange(questionId, event.target.value);
    };

    const handleChoiceChange = (nextValue) => {
        if (!questionId) {
            return;
        }
        onChange(questionId, nextValue);
    };

    const handleCheckboxToggle = (option) => {
        if (!questionId) {
            return;
        }

        const current = Array.isArray(value) ? value : [];
        const next = current.includes(option)
            ? current.filter((item) => item !== option)
            : [...current, option];

        onChange(questionId, next);
    };

    const renderInput = () => {
        if (type === 'paragraph') {
            return (
                <div className="pt-2">
                    <textarea
                        id={idAttr}
                        rows={1}
                        value={typeof value === 'string' ? value : ''}
                        onChange={handleTextChange}
                        disabled={isDisabled}
                        aria-invalid={hasError}
                        onInput={(e) => {
                            e.target.style.height = 'auto';
                            e.target.style.height = (e.target.scrollHeight) + 'px';
                        }}
                        className={`w-full resize-none bg-transparent border-b ${inputBorderClass} px-0 py-2 text-sm text-primary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors overflow-hidden`}
                        placeholder="Your answer"
                        style={{ minHeight: '38px' }}
                    />
                </div>
            );
        }

        if (type === 'multiple_choice') {
            const selected = typeof value === 'string' ? value : '';
            return (
                <div className="flex flex-col gap-3 pt-2">
                    {options.map((option, optionIndex) => (
                        <label
                            key={`${questionId || index}-option-${optionIndex}`}
                            className={`flex items-start gap-3 text-sm text-primary cursor-pointer group`}
                        >
                            <div className="pt-0.5 shrink-0">
                                <input
                                    type="radio"
                                    name={`question-${questionId || index}`}
                                    value={option}
                                    checked={selected === option}
                                    onChange={() => handleChoiceChange(option)}
                                    disabled={isDisabled}
                                    className="h-5 w-5 border-default bg-transparent text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary disabled:cursor-not-allowed transition-all cursor-pointer"
                                />
                            </div>
                            <span className="leading-5">{option}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (type === 'checkboxes') {
            const selected = Array.isArray(value) ? value : [];
            return (
                <div className="flex flex-col gap-3 pt-2">
                    {options.map((option, optionIndex) => (
                        <label
                            key={`${questionId || index}-option-${optionIndex}`}
                            className={`flex items-start gap-3 text-sm text-primary cursor-pointer group`}
                        >
                            <div className="pt-0.5 shrink-0">
                                <input
                                    type="checkbox"
                                    value={option}
                                    checked={selected.includes(option)}
                                    onChange={() => handleCheckboxToggle(option)}
                                    disabled={isDisabled}
                                    className="h-5 w-5 rounded border-default bg-transparent text-primary-500 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-secondary disabled:cursor-not-allowed transition-all cursor-pointer"
                                />
                            </div>
                            <span className="leading-5">{option}</span>
                        </label>
                    ))}
                </div>
            );
        }

        if (type === 'dropdown') {
            return (
                <div className="pt-2 max-w-xs">
                    <select
                        id={idAttr}
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) => handleChoiceChange(event.target.value)}
                        disabled={isDisabled}
                        aria-invalid={hasError}
                        className={`w-full rounded-md border ${inputBorderClass} bg-transparent px-3 py-3 text-sm text-primary focus:border-primary-500 focus:ring-1 focus:ring-primary-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors`}
                    >
                        <option value="">Choose</option>
                        {options.map((option, optionIndex) => (
                            <option key={`${questionId || index}-option-${optionIndex}`} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        return (
            <div className="pt-2 w-1/2">
                <input
                    id={idAttr}
                    type="text"
                    value={typeof value === 'string' ? value : ''}
                    onChange={handleTextChange}
                    disabled={isDisabled}
                    aria-invalid={hasError}
                    className={`w-full bg-transparent border-b ${inputBorderClass} px-0 py-2 text-sm text-primary placeholder:text-muted focus:border-primary-500 focus:border-b-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-70 transition-colors`}
                    placeholder="Your answer"
                />
            </div>
        );
    };

    return (
        <WrapperComponent className="rounded-xl border border-default bg-secondary p-6 block w-full min-w-0 shadow-sm transition-colors">
            <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                    <LabelComponent {...labelProps} className="text-base text-primary">
                        {label}
                        {required && <span className="ml-1 text-danger" aria-hidden="true">*</span>}
                    </LabelComponent>
                </div>
                {renderInput()}
                {error && (
                    <div className="flex items-center gap-2 mt-1 text-danger text-xs" role="alert">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-alert"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                        <span>{error}</span>
                    </div>
                )}
            </div>
        </WrapperComponent>
    );
};

export default PublicQuestion;
