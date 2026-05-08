import { useState } from 'react';
import { faqs } from '../constants';

const revealDelays = ['reveal-delay-1', 'reveal-delay-2', 'reveal-delay-3'];

const Faq = () => {
    const [openIndex, setOpenIndex] = useState(0);

    const toggle = (index) => {
        setOpenIndex((previous) => (previous === index ? -1 : index));
    };

    return (
        <section id="faq" className="py-20">
            <div className="mx-auto max-w-4xl px-6">
                <div className="reveal max-w-2xl" data-reveal>
                    <p className="text-sm font-semibold text-primary-500">FAQ</p>
                    <h2 className="mt-2 text-title font-semibold text-primary">Answers, up front</h2>
                    <p className="mt-3 text-base text-secondary">
                        Everything you need to know about publishing, permissions, and drafts.
                    </p>
                </div>
                <div className="mt-8 space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        const delayClass = revealDelays[index % revealDelays.length];
                        const panelId = `faq-panel-${index}`;

                        return (
                            <div
                                key={faq.question}
                                className={`reveal ${delayClass} rounded-xl border border-default bg-secondary p-5`}
                                data-reveal
                            >
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between text-left"
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    onClick={() => toggle(index)}
                                >
                                    <span className="text-base font-semibold text-primary">{faq.question}</span>
                                    <span className="ml-4 text-lg text-primary-500">{isOpen ? '-' : '+'}</span>
                                </button>
                                <div
                                    id={panelId}
                                    role="region"
                                    aria-hidden={!isOpen}
                                    className={`mt-3 text-sm text-secondary ${isOpen ? 'block' : 'hidden'}`}
                                >
                                    {faq.answer}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default Faq;
