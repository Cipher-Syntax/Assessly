import { Copy, EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const FormActionsMenu = ({ onRename, onDelete, onCopy }) => {
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

    const runAction = (action) => {
        setIsOpen(false);
        action();
    };

    return (
        <div ref={menuRef} className="relative">
            <button
                type="button"
                aria-label="Open form actions"
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={() => setIsOpen((current) => !current)}
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
                        onClick={() => runAction(onRename)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-secondary transition hover:bg-secondary hover:text-primary"
                    >
                        <Pencil aria-hidden="true" size={15} />
                        Rename
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => runAction(onDelete)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-danger transition hover:bg-secondary"
                    >
                        <Trash2 aria-hidden="true" size={15} />
                        Delete
                    </button>
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => runAction(onCopy)}
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
