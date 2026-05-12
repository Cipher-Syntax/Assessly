import { Link } from 'react-router-dom';

const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-default bg-tertiary px-8 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-default bg-secondary text-xs font-semibold text-secondary">
                F
            </div>
            <div>
                <h2 className="text-lg font-semibold text-primary">No forms yet</h2>
                <p className="mt-2 text-sm text-secondary">
                    Start with a blank form and publish when you are ready.
                </p>
            </div>
            <Link
                to="/forms/new"
                className="rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary-600"
            >
                Create blank form
            </Link>
        </div>
    );
};

export default EmptyState;
