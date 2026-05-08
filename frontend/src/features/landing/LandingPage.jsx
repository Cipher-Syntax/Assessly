import TopNav from './components/TopNav';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import AntiCheat from './components/AntiCheat';
import Testimonials from './components/Testimonials';
import Faq from './components/Faq';
import FinalCta from './components/FinalCta';
import Footer from './components/Footer';
import useScrollReveal from './hooks/useScrollReveal';

const LandingPage = () => {
    useScrollReveal();

    return (
        <div className="relative min-h-screen overflow-x-hidden bg-gradient-surface text-primary">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 bg-grid opacity-40" />
                <div className="glow-orb glow-orb--one" />
                <div className="glow-orb glow-orb--two" />
            </div>
            <TopNav />
            <main className="relative z-10">
                <Hero />
                <Features />
                <HowItWorks />
                <AntiCheat />
                <Testimonials />
                <Faq />
                <FinalCta />
            </main>
            <Footer />
        </div>
    );
};

export default LandingPage;
