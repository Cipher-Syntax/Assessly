import { Link } from 'react-router-dom';

const FinalCta = () => {
    return (
        <section className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal rounded-2xl border border-default bg-secondary px-8 py-10 text-center" data-reveal>
                    <h2 className="text-title font-semibold text-primary">Ready to publish your next assessment?</h2>
                    <p className="mt-3 text-base text-secondary">
                        Start building in minutes with versioned publishing and role-based access baked in.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Link
                            to="/login"
                            className="rounded-md bg-gradient-primary px-6 py-3 text-sm font-semibold text-primary transition hover:-translate-y-0.5"
                        >
                            Get started
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default FinalCta;
