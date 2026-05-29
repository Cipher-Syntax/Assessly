import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './useToast';
const TOAST_TTL_MS = 4500;

const buildToastStyle = (type) => {
    if (type === 'error') {
        return 'border-danger bg-tertiary text-danger';
    }

    return 'border-primary-500 bg-primary-soft text-primary';
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef(new Map());
    const nextIdRef = useRef(0);

    const removeToast = useCallback((toastId) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== toastId));
        const timeoutId = timersRef.current.get(toastId);
        if (timeoutId) {
            clearTimeout(timeoutId);
            timersRef.current.delete(toastId);
        }
    }, []);

    const pushToast = useCallback(
        (message, type = 'success') => {
            if (!message) {
                return;
            }

            const nextId = nextIdRef.current + 1;
            nextIdRef.current = nextId;

            const toast = {
                id: nextId,
                message,
                type,
            };

            setToasts((prev) => [...prev, toast]);

            const timeoutId = setTimeout(() => {
                removeToast(nextId);
            }, TOAST_TTL_MS);

            timersRef.current.set(nextId, timeoutId);
        },
        [removeToast]
    );

    const value = useMemo(
        () => ({
            pushToast,
            success: (message) => pushToast(message, 'success'),
            error: (message) => pushToast(message, 'error'),
        }),
        [pushToast]
    );

    useEffect(() => {
        const timers = timersRef.current;

        return () => {
            timers.forEach((timeoutId) => clearTimeout(timeoutId));
            timers.clear();
        };
    }, []);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-xs flex-col gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        role="status"
                        aria-live="polite"
                        className={`rounded-lg border px-4 py-3 text-sm shadow-lg ${buildToastStyle(
                            toast.type
                        )}`}
                    >
                        {toast.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};

