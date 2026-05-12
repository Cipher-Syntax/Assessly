import { useState } from 'react';
import TopBar from './TopBar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleToggle = () => {
        setIsSidebarCollapsed((prev) => !prev);
    };

    return (
        <div className="min-h-screen bg-primary text-primary flex flex-col">
            <TopBar />
            <div className="flex flex-1">
                <Sidebar isCollapsed={isSidebarCollapsed} onToggle={handleToggle} />
                <main className="flex-1 bg-primary">
                    <div className="mx-auto w-full max-w-6xl px-6 py-8">
                        <section className="rounded-2xl border border-default bg-secondary p-6">
                            {children}
                        </section>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
