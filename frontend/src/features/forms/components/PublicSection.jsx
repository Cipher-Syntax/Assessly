import PublicQuestion from './PublicQuestion';

const PublicSection = ({ section, index, answers, errors, onAnswerChange, isDisabled }) => {
    const title = section?.title || `Section ${index + 1}`;
    const description = section?.description || '';
    const questions = Array.isArray(section?.questions) ? section.questions : [];

    return (
        <div className="flex flex-col gap-4">
            <section className="rounded-xl border border-default bg-secondary p-6 shadow-sm border-t-8 border-t-primary-500">
                <div className="flex flex-col">
                    <h2 className="text-3xl font-normal text-primary">{title}</h2>
                    {description && (
                        <p className="mt-4 text-sm text-secondary whitespace-pre-wrap">{description}</p>
                    )}
                </div>
            </section>
            
            <div className="flex flex-col gap-4">
                {questions.map((question, questionIndex) => (
                    <PublicQuestion
                        key={question.id || `question-${questionIndex}`}
                        question={question}
                        index={questionIndex}
                        value={answers?.[question.id]}
                        error={errors?.[question.id]}
                        onChange={onAnswerChange}
                        isDisabled={isDisabled}
                    />
                ))}
            </div>
        </div>
    );
};

export default PublicSection;
