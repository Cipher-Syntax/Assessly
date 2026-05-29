import Spinner from './Spinner';

const PageSpinner = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen bg-primary text-primary flex items-center justify-center px-4 py-10">
            <div className="flex flex-col items-center gap-3">
                <Spinner size="lg" />
                {message && <p className="text-sm text-secondary">{message}</p>}
            </div>
        </div>
    );
};

export default PageSpinner;
