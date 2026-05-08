import { features } from '../constants';

const revealDelays = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

const Features = () => {
    return (
        <section id="features" className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal max-w-2xl" data-reveal>
                    <p className="text-sm font-semibold text-primary-500">Why Assessly</p>
                    <h2 className="mt-2 text-title font-semibold text-primary">
                        Everything structured, nothing noisy
                    </h2>
                    <p className="mt-3 text-base text-secondary">
                        Keep every form aligned with your rules, permissions, and version history without wrestling with
                        cluttered layouts.
                    </p>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const delayClass = revealDelays[index % revealDelays.length];

                        return (
                            <div
                                key={feature.title}
                                className={`reveal ${delayClass} rounded-xl border border-default bg-secondary p-6 transition duration-300 hover:-translate-y-1`}
                                data-reveal
                            >
                                <div className="flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary-500">
                                        {feature.icon}
                                    </span>
                                    <h3 className="text-base font-semibold text-primary">{feature.title}</h3>
                                </div>
                                <p className="mt-3 text-sm text-secondary">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
