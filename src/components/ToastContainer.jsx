import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const toast = {
    success: (msg) => fireToast(msg, 'success'),
    error: (msg) => fireToast(msg, 'error'),
    info: (msg) => fireToast(msg, 'info')
};

const fireToast = (message, type) => {
    window.dispatchEvent(
        new CustomEvent('taskflow_toast', {
            detail: { id: Date.now() + Math.random(), message, type }
        })
    );
};

export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        const handleToast = (e) => {
            const newToast = e.detail;
            setToasts((prev) => [...prev, newToast]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
            }, 3500);
        };

        window.addEventListener('taskflow_toast', handleToast);
        return () => window.removeEventListener('taskflow_toast', handleToast);
    }, []);

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    if (toasts.length === 0) return null;

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-xs sm:max-w-sm w-full px-4 pointer-events-none">
            {toasts.map((t) => {
                const isSuccess = t.type === 'success';
                const isError = t.type === 'error';

                return (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold transition-all duration-300 ${isSuccess
                                ? 'bg-slate-900 text-white border-slate-800'
                                : isError
                                    ? 'bg-rose-600 text-white border-rose-500'
                                    : 'bg-white text-slate-800 border-slate-200'
                            }`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0">
                            {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                            {isError && <AlertCircle className="w-4 h-4 text-rose-200 shrink-0" />}
                            {!isSuccess && !isError && <Info className="w-4 h-4 text-indigo-600 shrink-0" />}
                            <span className="truncate">{t.message}</span>
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}