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
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {steps.map((step, index) => {
                        const delayClass = revealDelays[index % revealDelays.length];

                        return (
                            <div
                                key={step.title}
                                className={`reveal ${delayClass} rounded-xl border border-default bg-secondary p-6 transition duration-300 hover:-translate-y-1`}
                                data-reveal
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary-500">
                                        {index + 1}
                                    </span>
                                    <h3 className="text-base font-semibold text-primary">{step.title}</h3>
                                </div>
                                <p className="mt-3 text-sm text-secondary">{step.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
