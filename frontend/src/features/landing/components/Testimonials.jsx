import { testimonials } from '../constants';

const revealDelays = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

const Testimonials = () => {
    return (
        <section id="testimonials" className="py-20">
            <div className="mx-auto max-w-6xl px-6">
                <div className="reveal max-w-2xl" data-reveal>
                    <p className="text-sm font-semibold text-primary-500">Testimonials</p>
                    <h2 className="mt-2 text-title font-semibold text-primary">Teams that run on Assessly</h2>
                    <p className="mt-3 text-base text-secondary">
                        Educators and admins trust Assessly to keep assessments consistent and easy to review.
                    </p>
                </div>
                <div className="mt-10 grid gap-6 md:grid-cols-3">
                    {testimonials.map((testimonial, index) => {
                        const delayClass = revealDelays[index % revealDelays.length];

                        return (
                            <div
                                key={testimonial.name}
                                className={`reveal ${delayClass} rounded-xl border border-default bg-secondary p-6`}
                                data-reveal
                            >
                                <p className="text-sm text-secondary">"{testimonial.quote}"</p>
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-primary">{testimonial.name}</p>
                                    <p className="text-xs text-muted">{testimonial.role}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Testimonials;
