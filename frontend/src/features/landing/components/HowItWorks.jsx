import { steps } from '../constants';

const revealDelays = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal max-w-2xl" data-reveal>
                    <p className="text-sm font-semibold text-primary-500">How it works</p>
                    <h2 className="mt-2 text-title font-semibold text-primary">Go from draft to responses fast</h2>
                    <p className="mt-3 text-base text-secondary">
                        A focused creator workflow keeps your team moving, while respondents get a calm, linear
                        experience.
                    </p>
                </div>
                <div className="mt-16 grid gap-6 md:grid-cols-3 relative">
                    {/* Optional: connecting line behind steps for desktop */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-primary-500/20 via-primary-500/40 to-primary-500/20 -translate-y-1/2 z-0" />
                    
                    {steps.map((step, index) => {
                        const delayClass = revealDelays[index % revealDelays.length];

                        return (
                            <div
                                key={step.title}
                                className={`reveal ${delayClass} relative z-10 group overflow-hidden rounded-2xl border border-default bg-secondary p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-500/10 cursor-default`}
                                data-reveal
                            >
                                <div className="absolute inset-0 bg-gradient-to-b from-primary-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                
                                <div className="relative flex flex-col items-center text-center">
                                    <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-2xl font-bold text-primary-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        {index + 1}
                                    </span>
                                    <h3 className="mt-6 text-xl font-bold text-primary group-hover:text-primary-500 transition-colors">{step.title}</h3>
                                    <p className="mt-3 text-sm text-secondary leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
