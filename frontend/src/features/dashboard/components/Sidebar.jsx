import { Link } from 'react-router-dom';

const Sidebar = ({ isCollapsed, onToggle }) => {
    const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-60';
    const toggleLabel = isCollapsed ? 'Expand' : 'Collapse';

    return (
        <aside className={`border-r border-default bg-secondary transition-[width] duration-200 ${sidebarWidth}`}>
            <div className="flex h-full flex-col p-4">
                <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-end'}`}>
                    <button
                        type="button"
                        onClick={onToggle}
                        aria-expanded={!isCollapsed}
                        aria-label={`${toggleLabel} sidebar`}
                        className={`flex items-center rounded-lg border border-default bg-tertiary px-3 py-2 text-xs font-semibold text-secondary transition hover:text-primary ${isCollapsed ? 'justify-center' : 'gap-2'
                            }`}
                    >
                        <span aria-hidden="true">{isCollapsed ? '>' : '<'}</span>
                        <span
                            className={`transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                                }`}
                        >
                            {toggleLabel}
                        </span>
                    </button>
                </div>

                <nav className="mt-6 flex flex-col gap-2">
                    <Link
                        to="/dashboard"
                        className={`flex items-center rounded-lg px-3 py-2 text-sm font-semibold text-primary-500 bg-primary-soft ${isCollapsed ? 'justify-center' : ''
                            }`}
                    >
                        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-tertiary text-xs font-semibold text-secondary">
                            F
                        </span>
                        <span
                            className={`ml-3 whitespace-nowrap text-sm transition-opacity duration-200 ${isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                                }`}
                        >
                            Forms
                        </span>
                        <span className="sr-only">Forms</span>
                    </Link>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
