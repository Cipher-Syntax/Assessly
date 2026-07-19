import { features } from '../constants';
import { Database, FileBadge, Save, Layers, Users, Eye } from 'lucide-react';

const revealDelays = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

const iconMap = {
    'Schema': <Database className="w-5 h-5" />,
    'Version': <FileBadge className="w-5 h-5" />,
    'Drafts': <Save className="w-5 h-5" />,
    'Flow': <Layers className="w-5 h-5" />,
    'Roles': <Users className="w-5 h-5" />,
    'Signals': <Eye className="w-5 h-5" />,
};

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
                <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => {
                        const delayClass = revealDelays[index % revealDelays.length];
                        const icon = iconMap[feature.icon] || <Database className="w-5 h-5" />;

                        return (
                            <div
                                key={feature.title}
                                className={`reveal ${delayClass} group relative overflow-hidden rounded-2xl border border-default bg-secondary p-8 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary-500/10 cursor-default`}
                                data-reveal
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                                
                                <div className="relative z-10">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                        {icon}
                                    </span>
                                    <h3 className="mt-6 text-xl font-bold text-primary group-hover:text-primary-500 transition-colors">{feature.title}</h3>
                                    <p className="mt-3 text-sm text-secondary leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Features;
