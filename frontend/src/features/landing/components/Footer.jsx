import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="relative z-10 border-t border-default bg-primary">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
                <div>
                    <p className="text-sm font-semibold text-primary">Assessly</p>
                    <p className="mt-2 text-xs text-secondary">Create, publish, and analyze structured assessments.</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-secondary">
                    <Link to="/login" className="transition hover:text-primary">
                        Sign in
                    </Link>
                    <Link to="/login" className="transition hover:text-primary">
                        Get started
                    </Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
