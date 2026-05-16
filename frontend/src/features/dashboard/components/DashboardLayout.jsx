const DashboardLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-primary text-primary">
            <header className="border-b border-default bg-secondary">
                <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
                    <span className="text-lg font-semibold tracking-tight">Assessly</span>
                    <span className="rounded-full border border-default bg-tertiary px-3 py-1 text-xs text-secondary">
                        Dashboard
                    </span>
                </div>
            </header>
            <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
        </div>
    );
};

export default DashboardLayout;