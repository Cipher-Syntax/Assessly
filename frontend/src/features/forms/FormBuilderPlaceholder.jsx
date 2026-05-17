import { useLocation, useParams } from "react-router-dom";

const FormBuilderPlaceholder = () => {
    const { id } = useParams();
    const location = useLocation();
    const titleFormState = location.state?.formTitle;

    const title =
        typeof titleFormState === 'string' && titleFormState.trim().length > 0
            ? titleFormState
            : 'Untitiled form';

    return (
        <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-6 py-10">
            <div className="w-full max-w-2xl rounded-xl border border-default bg-secondary px-6 py-8 text-center">
                <h1 className="text-xl font-semibold text-primary">{title}</h1>
                <p className="mt-3 text-sm text-secondary">Builder coming soon</p>
                {id && (
                    <p className="mt-6 text-xs text-muted font-mono">
                        Form ID: {id}
                    </p>
                )}
            </div>
        </div>
    );
}

export default FormBuilderPlaceholder