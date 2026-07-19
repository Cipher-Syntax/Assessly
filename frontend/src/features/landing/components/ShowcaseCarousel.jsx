import { FileText, Settings, LayoutTemplate, PieChart, ShieldAlert, Clock, Smartphone, Zap } from 'lucide-react';

const CAROUSEL_ITEMS = [
    { icon: FileText, label: 'Multi-section Forms' },
    { icon: PieChart, label: 'Real-time Analytics' },
    { icon: ShieldAlert, label: 'Anti-Cheat Signals' },
    { icon: LayoutTemplate, label: 'Custom Templates' },
    { icon: Settings, label: 'Advanced Settings' },
    { icon: Clock, label: 'Timed Assessments' },
    { icon: Smartphone, label: 'Mobile Optimized' },
    { icon: Zap, label: 'Instant Publishing' },
];

const ShowcaseCarousel = () => {
    return (
        <section className="relative w-full overflow-hidden py-5 bg-primary border-y border-default">
            <div className="absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-primary to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-primary to-transparent pointer-events-none" />
            
            <div className="flex w-max animate-marquee hover:pause-animation">
                {/* Double the items for infinite scroll effect */}
                {[...CAROUSEL_ITEMS, ...CAROUSEL_ITEMS].map((item, index) => (
                    <div 
                        key={index} 
                        className="mx-4 flex items-center gap-3 rounded-2xl border border-default bg-secondary px-6 py-4 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md cursor-default"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary-500">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-primary whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ShowcaseCarousel;
