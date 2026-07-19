import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ToastContext } from './useToast';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
const TOAST_TTL_MS = 4500;

const buildToastStyle = (type) => {
    switch (type) {
        case 'error':
            return {
                bg: 'bg-primary',
                border: 'border-danger text-danger',
                icon: <AlertCircle className="w-5 h-5 text-danger" />,
            };
        case 'success':
            return {
                bg: 'bg-primary',
                border: 'border-success text-success',
                icon: <CheckCircle2 className="w-5 h-5 text-success" />,
            };
        default:
            return {
                bg: 'bg-primary',
                border: 'border-primary-500 text-primary-500',
                icon: <Info className="w-5 h-5 text-primary-500" />,
            };
    }
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
            <div className="pointer-events-none fixed top-6 right-6 z-[9999] flex w-full max-w-sm flex-col items-end gap-3 px-4">
                {toasts.map((toast) => {
                    const style = buildToastStyle(toast.type);
                    return (
                        <div
                            key={toast.id}
                            role="status"
                            aria-live="polite"
                            className={`pointer-events-auto flex w-full items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-right-8 ${style.bg} ${style.border}`}
                        >
                            <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
                            <div className="flex-1 text-sm font-medium text-primary leading-relaxed">
                                {toast.message}
                            </div>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="flex-shrink-0 ml-4 text-muted hover:text-primary transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
};

