import { Link } from 'react-router-dom';

const Hero = () => {
    return (
        <section className="relative pb-16 pt-16 sm:pt-24">
            <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
                <div className="fade-rise">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs text-primary-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
                        Structured assessments, simplified
                    </div>
                    <h1 className="mt-6 text-display font-semibold text-primary">
                        Create, Publish, Analyze
                    </h1>
                    <p className="mt-4 text-base text-secondary">
                        Assessly lets teams build multi-section forms, publish immutable versions, and review responses
                        with draft recovery and session signals built in.
                    </p>
                    <div className="mt-8 flex flex-wrap gap-4">
                        <Link
                            to="/login"
                            className="rounded-md bg-gradient-primary px-5 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5"
                        >
                            Get started
                        </Link>
                        <a
                            href="#how-it-works"
                            className="rounded-md border border-default px-5 py-3 text-sm font-semibold text-primary transition hover:border-focus hover:text-primary-500"
                        >
                            View demo
                        </a>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-6 text-xs text-muted">
                        <span>Versioned publishing</span>
                        <span>Draft autosave</span>
                        <span>Anti-cheat signals</span>
                    </div>
                </div>
                <div className="relative flex justify-center lg:justify-end reveal" data-reveal>
                    <div className="relative w-full max-w-md">
                        <div className="absolute left-6 top-6 h-full w-full rounded-2xl border border-default bg-secondary opacity-40" />
                        <div className="absolute left-3 top-3 h-full w-full rounded-2xl border border-default bg-secondary opacity-70" />
                        <div className="relative rounded-2xl border border-default bg-secondary p-6 shadow-lg float-slow">
                            <div className="flex items-center justify-between">
                                <div className="h-2 w-20 rounded-full bg-tertiary" />
                                <div className="h-2 w-10 rounded-full bg-primary-soft" />
                            </div>
                            <div className="mt-5 space-y-3">
                                <div className="h-3 w-3/4 rounded bg-tertiary" />
                                <div className="h-2 w-full rounded bg-tertiary" />
                                <div className="h-2 w-5/6 rounded bg-tertiary" />
                            </div>
                            <div className="mt-6 rounded-xl border border-default bg-tertiary p-4">
                                <div className="h-2 w-24 rounded bg-primary-soft" />
                                <div className="mt-3 space-y-2">
                                    <div className="h-2 w-full rounded bg-primary-soft" />
                                    <div className="h-2 w-5/6 rounded bg-primary-soft" />
                                </div>
                            </div>
                            <div className="mt-6 flex items-center gap-2">
                                <span className="h-2 w-10 rounded-full bg-alert-low" />
                                <span className="h-2 w-10 rounded-full bg-alert-mid" />
                                <span className="h-2 w-10 rounded-full bg-alert-high" />
                            </div>
                            <p className="mt-3 text-xs text-secondary">Session signals captured in real time.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
