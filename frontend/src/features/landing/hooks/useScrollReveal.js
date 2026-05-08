import { useEffect } from 'react';

const useScrollReveal = () => {
    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const elements = Array.from(document.querySelectorAll('[data-reveal]'));
        if (!elements.length) {
            return;
        }

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
            elements.forEach((element) => element.classList.add('reveal-visible'));
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('reveal-visible');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.15 }
        );

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);
};

export default useScrollReveal;
