const AntiCheat = () => {
    return (
        <section id="anti-cheat" className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal rounded-2xl border border-default bg-secondary px-8 py-10" data-reveal>
                    <div className="flex flex-col gap-12 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 rounded-full bg-alert-high/10 px-3 py-1 text-xs font-semibold text-alert-high mb-4">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-alert-high opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-alert-high"></span>
                                </span>
                                Intelligent Monitoring
                            </div>
                            <h2 className="text-4xl font-bold text-primary">
                                Behavioral tracking without heavy proctoring
                            </h2>
                            <p className="mt-4 text-lg text-secondary leading-relaxed">
                                Assessly logs tab switches and focus loss per session, giving creators context at review
                                time without interrupting responders or requiring invasive permissions.
                            </p>
                        </div>
                        
                        <div className="w-full max-w-sm rounded-2xl border border-default bg-primary p-6 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-alert-high/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-6 border-b border-default pb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-lg bg-alert-high/10 flex items-center justify-center text-alert-high font-bold text-xs">AC</div>
                                        <p className="text-sm font-bold uppercase text-primary">Signal meter</p>
                                    </div>
                                    <span className="px-2 py-1 bg-alert-low/20 text-alert-low text-xs font-bold rounded">Medium Risk</span>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-secondary font-medium">Tab Switches</span>
                                        <span className="text-alert-mid font-bold">3 detected</span>
                                    </div>
                                    <div className="w-full bg-tertiary rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-alert-mid h-2.5 rounded-full" style={{ width: '45%' }}></div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between text-sm mt-4">
                                        <span className="text-secondary font-medium">Focus Lost</span>
                                        <span className="text-alert-high font-bold">1 min 20s</span>
                                    </div>
                                    <div className="w-full bg-tertiary rounded-full h-2.5 overflow-hidden">
                                        <div className="bg-alert-high h-2.5 rounded-full" style={{ width: '70%' }}></div>
                                    </div>
                                </div>

                                <div className="mt-6 rounded-xl bg-tertiary p-4 flex gap-3">
                                    <div className="h-5 w-5 rounded-full bg-alert-mid/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <div className="h-2 w-2 rounded-full bg-alert-mid" />
                                    </div>
                                    <p className="text-xs text-secondary leading-relaxed">
                                        Warnings, repeats, and critical events are logged and reviewed at submission.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AntiCheat;
