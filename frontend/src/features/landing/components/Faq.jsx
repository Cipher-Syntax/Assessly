import { useState } from 'react';
import { faqs } from '../constants';
import { ChevronDown } from 'lucide-react';

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
                <div className="mt-12 space-y-4">
                    {faqs.map((faq, index) => {
                        const isOpen = openIndex === index;
                        const delayClass = revealDelays[index % revealDelays.length];
                        const panelId = `faq-panel-${index}`;

                        return (
                            <div
                                key={faq.question}
                                className={`reveal ${delayClass} overflow-hidden rounded-2xl border border-default bg-secondary transition-all duration-300 hover:border-primary-500/50 ${isOpen ? 'shadow-md shadow-primary-500/5 ring-1 ring-primary-500/20' : ''}`}
                                data-reveal
                            >
                                <button
                                    type="button"
                                    className="flex w-full items-center justify-between text-left p-6 outline-none"
                                    aria-expanded={isOpen}
                                    aria-controls={panelId}
                                    onClick={() => toggle(index)}
                                >
                                    <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-primary-500' : 'text-primary'}`}>{faq.question}</span>
                                    <span className="ml-4 flex items-center justify-center h-8 w-8 rounded-full bg-primary-soft text-primary-500 shrink-0">
                                        <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                                    </span>
                                </button>
                                <div
                                    id={panelId}
                                    role="region"
                                    aria-hidden={!isOpen}
                                    className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100 pb-6 px-6' : 'grid-rows-[0fr] opacity-0'}`}
                                >
                                    <div className="overflow-hidden">
                                        <p className="text-base text-secondary leading-relaxed">{faq.answer}</p>
                                    </div>
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
