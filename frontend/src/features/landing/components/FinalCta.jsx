import { Link } from 'react-router-dom';

const FinalCta = () => {
    return (
        <section className="py-24 relative overflow-hidden">
            <div className="absolute inset-0 bg-primary-500/5" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-500/20 via-primary to-primary pointer-events-none" />
            
            <div className="mx-auto max-w-4xl px-6 relative z-10">
                <div className="reveal flex flex-col items-center text-center" data-reveal>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-1.5 text-sm font-semibold text-primary-500 mb-8 border border-primary-500/20 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                        Start for free today
                    </div>
                    
                    <h2 className="text-5xl md:text-6xl font-extrabold text-primary tracking-tight">
                        Ready to publish your <br className="hidden md:block" /> next assessment?
                    </h2>
                    
                    <p className="mt-6 text-xl text-secondary max-w-2xl mx-auto leading-relaxed">
                        Start building in minutes with versioned publishing, robust anti-cheat signals, and role-based access baked in.
                    </p>
                    
                    <div className="mt-10 flex justify-center">
                        <Link
                            to="/login"
                            className="group relative inline-flex items-center justify-center rounded-xl bg-primary-500 px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:scale-105 hover:bg-primary-600 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)]"
                        >
                            Get started now
                            <span className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCta;
