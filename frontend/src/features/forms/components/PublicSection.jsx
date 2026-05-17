import PublicQuestion from './PublicQuestion';

const PublicSection = ({ section, index }) => {
    const title = section?.title || `Section ${index + 1}`;
    const description = section?.description || '';
    const questions = Array.isArray(section?.questions) ? section.questions : [];

    return (
        <section className="rounded-xl border border-default bg-secondary p-6">
            <div className="flex flex-col gap-4">
                <div className="border-b border-default pb-3">
                    <h2 className="text-lg font-semibold text-primary">{title}</h2>
                    {description && (
                        <p className="mt-2 text-sm text-secondary">{description}</p>
                    )}
                </div>
                <div className="flex flex-col gap-4">
                    {questions.map((question, questionIndex) => (
                        <PublicQuestion
                            key={question.id || `question-${questionIndex}`}
                            question={question}
                            index={questionIndex}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PublicSection;
