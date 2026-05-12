import { Link } from 'react-router-dom';

const TopBar = () => {
    return (
        <header className="sticky top-0 z-30 border-b border-default bg-primary">
            <div className="flex h-16 items-center justify-between px-6">
                <Link to="/dashboard" className="text-sm font-semibold tracking-widest text-primary">
                    Assessly
                </Link>
                <div className="flex items-center gap-3 text-sm text-secondary">
                    <span className="hidden sm:inline">Signed in</span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-default bg-tertiary text-xs font-semibold text-secondary">
                        U
                    </div>
                </div>
            </div>
        </header>
    );
};

export default TopBar;
