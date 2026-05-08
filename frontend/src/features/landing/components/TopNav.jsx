import { Link } from 'react-router-dom';

const TopNav = () => {
    return (
        <header className="sticky top-0 z-40 border-b border-default bg-primary">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link to="/" className="text-sm font-semibold tracking-widest text-primary">
                    Assessly
                </Link>
                <nav className="hidden items-center gap-6 text-sm text-secondary md:flex">
                    <a href="#features" className="transition hover:text-primary">
                        Features
                    </a>
                    <a href="#how-it-works" className="transition hover:text-primary">
                        How it works
                    </a>
                    <a href="#anti-cheat" className="transition hover:text-primary">
                        Anti-cheat
                    </a>
                    <a href="#testimonials" className="transition hover:text-primary">
                        Testimonials
                    </a>
                    <a href="#faq" className="transition hover:text-primary">
                        FAQ
                    </a>
                </nav>
                <div className="flex items-center gap-3">
                    <Link
                        to="/login"
                        className="rounded-md border border-default px-4 py-2 text-sm font-semibold text-primary transition hover:border-focus hover:text-primary-500"
                    >
                        Sign in
                    </Link>
                </div>
            </div>
        </header>
    );
};

export default TopNav;
