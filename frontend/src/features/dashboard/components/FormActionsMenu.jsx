import { Copy, EllipsisVertical, Pencil, Trash2, LayoutTemplate } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const FormActionsMenu = ({ isTemplate, onRename, onDelete, onCopy, onToggleTemplate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    // Update to accept the event and stop propagation
    const runAction = (event, action) => {
        event.stopPropagation();
        setIsOpen(false);
        action();
    };

    // New handler for the toggle button
    const toggleMenu = (event) => {
        event.stopPropagation();
        setIsOpen((current) => !current);
    };

    return (
        <div ref={menuRef} className={`relative ${isOpen ? 'z-50' : ''}`}>
            <button
                type="button"
                aria-label="Open form actions"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={toggleMenu}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-default bg-tertiary text-secondary transition hover:text-primary"
            >
                <EllipsisVertical aria-hidden="true" size={18} />
            </button>

            {isOpen && (
                <div
                    role="menu"
                    className="absolute right-0 top-11 z-20 w-40 overflow-hidden rounded-lg border border-default bg-tertiary py-1 shadow-lg"
                >
                    <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => runAction(e, onRename)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-secondary hover:text-primary"
                    >
                        <Pencil aria-hidden="true" size={15} />
                        Rename
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => runAction(e, onDelete)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition hover:bg-secondary"
                    >
                        <Trash2 aria-hidden="true" size={15} />
                        Delete
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => runAction(e, onToggleTemplate)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-secondary hover:text-primary"
                    >
                        <LayoutTemplate aria-hidden="true" size={15} />
                        {isTemplate ? 'Remove template' : 'Save as template'}
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={(e) => runAction(e, onCopy)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-secondary hover:text-primary"
                    >
                        <Copy aria-hidden="true" size={15} />
                        Copy responder link
                    </button>
                </div>
            )}
        </div>
    );
};

export default FormActionsMenu;