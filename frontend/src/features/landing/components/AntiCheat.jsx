const AntiCheat = () => {
    return (
        <section id="anti-cheat" className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal rounded-2xl border border-default bg-secondary px-8 py-10" data-reveal>
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <p className="text-sm font-semibold text-primary-500">Anti-cheat signals</p>
                            <h2 className="mt-2 text-title font-semibold text-primary">
                                Behavioral tracking without heavy proctoring
                            </h2>
                            <p className="mt-3 text-base text-secondary">
                                Assessly logs tab switches and focus loss per session, giving creators context at review
                                time without interrupting responders.
                            </p>
                        </div>
                        <div className="w-full max-w-sm rounded-xl border border-default bg-tertiary p-6">
                            <p className="text-xs font-semibold uppercase text-muted">Signal meter</p>
                            <div className="mt-4 flex items-center gap-3">
                                <span className="h-2 w-16 rounded-full bg-alert-low" />
                                <span className="h-2 w-16 rounded-full bg-alert-mid" />
                                <span className="h-2 w-16 rounded-full bg-alert-high" />
                            </div>
                            <p className="mt-3 text-xs text-secondary">
                                Warnings, repeats, and critical events are logged and reviewed at submission.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AntiCheat;
