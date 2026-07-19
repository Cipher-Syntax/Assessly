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
                            className="rounded-md bg-gradient-primary px-5 py-3 text-sm font-semibold text-on-primary transition hover:-translate-y-0.5"
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
                    <div className="relative w-full max-w-lg">
                        <div className="absolute -left-4 -top-4 h-full w-full rounded-2xl border border-default bg-secondary opacity-30 shadow-2xl float-slow delay-100" />
                        <div className="absolute -left-2 -top-2 h-full w-full rounded-2xl border border-default bg-secondary opacity-60 shadow-xl float-slow delay-75" />
                        
                        <div className="relative overflow-hidden rounded-2xl border border-default bg-primary shadow-2xl float-slow">
                            {/* Browser-like header */}
                            <div className="flex items-center gap-2 border-b border-default bg-secondary px-4 py-3">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-danger/80" />
                                    <div className="h-3 w-3 rounded-full bg-alert-low/80" />
                                    <div className="h-3 w-3 rounded-full bg-success/80" />
                                </div>
                                <div className="ml-4 h-5 w-48 rounded bg-tertiary" />
                            </div>
                            
                            {/* Form Mockup Body */}
                            <div className="p-6 pb-8">
                                <div className="mb-4">
                                    <h3 className="text-xl font-bold text-primary">Customer Feedback</h3>
                                    <p className="mt-1 text-xs text-secondary">Please let us know how we did today.</p>
                                </div>
                                
                                <div className="rounded-xl border border-default bg-secondary p-5 mb-5 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-default">
                                    <p className="font-semibold text-sm text-primary mb-3">How satisfied were you?</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded-full border-2 border-primary-500 bg-primary-500" />
                                            <span className="text-xs text-secondary">Very Satisfied</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded-full border-2 border-default" />
                                            <span className="text-xs text-secondary">Somewhat Satisfied</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-4 w-4 rounded-full border-2 border-default" />
                                            <span className="text-xs text-secondary">Not Satisfied</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="flex h-6 w-16 items-center justify-center rounded-full bg-alert-high/10 text-[10px] font-bold text-alert-high">Anti-Cheat</span>
                                        <span className="flex h-6 w-12 items-center justify-center rounded-full bg-primary-500/10 text-[10px] font-bold text-primary-500">Live</span>
                                    </div>
                                    <div className="flex items-center justify-center bg-primary-500 text-on-primary text-[11px] font-semibold px-4 py-1.5 rounded hover:bg-primary-600 cursor-pointer shadow-sm">
                                        Submit Form
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
