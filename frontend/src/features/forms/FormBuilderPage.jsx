import { useParams } from 'react-router-dom';
import AddQuestionBar from './components/AddQuestionBar';
import QuestionCard from './components/QuestionCard';
import useFormBuilder from './hooks/useFormBuilder';

const FormBuilderPage = () => {
    const { id } = useParams();
    const {
        status,
        loadError,
        title,
        description,
        questions,
        isSaving,
        saveError,
        validationErrors,
        actions,
    } = useFormBuilder({ formId: id });

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
                            <div className="text-xs text-secondary">{statusLabel}</div>
                            {saveError && (
                                <p className="text-xs text-danger">{saveError}</p>
                            )}
                        </div>
                    </section>

                    <section className="flex flex-col gap-4">
                        {questions.map((question) => (
                            <QuestionCard
                                key={question.id}
                                question={question}
                                error={validationErrors.questions[question.id]}
                                onChange={actions.updateQuestion}
                                onDelete={actions.deleteQuestion}
                            />
                        ))}
                    </section>

                    <AddQuestionBar onAdd={actions.addQuestion} />
                </div>
            </div>
        </div>
    );
};

export default FormBuilderPage;