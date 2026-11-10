import React, { useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

export const fieldClass =
  'bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-400/70 focus:ring-2 focus:ring-sky-400/20 disabled:opacity-60 disabled:cursor-not-allowed transition';

export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-2',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-3">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-slate-700 border-t-sky-400 rounded-full animate-spin`}
      />
      {text && <span className="text-xs text-slate-400 font-medium">{text}</span>}
    </div>
  );
};

export const SkeletonLines = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2.5 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-3 rounded bg-slate-800/80 animate-pulse"
        style={{ width: `${92 - i * 14}%` }}
      />
    ))}
  </div>
);

export const ErrorAlert = ({ message, onDismiss }) => {
  const reduceMotion = useReducedMotion();
  const text = typeof message === 'string' ? message : JSON.stringify(message);

  return (
    <AnimatePresence initial={false}>
      {message && (
        <motion.div
          key="error-alert"
          role="alert"
          initial={reduceMotion ? false : { opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="mx-4 mt-3 px-3.5 py-2.5 text-sm bg-rose-500/10 border border-rose-500/25 text-rose-200 rounded-lg flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" aria-hidden="true" />
            <span className="truncate">{text}</span>
          </div>
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="p-1 rounded-md text-rose-300 hover:text-rose-100 hover:bg-rose-500/15 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl shadow-black/40 w-full max-w-md overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="p-1 -mr-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const MethodBadge = ({ method }) => {
  const styles = {
    GET: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
    POST: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
    PUT: 'text-sky-400 bg-sky-400/10 border-sky-400/25',
    PATCH: 'text-teal-300 bg-teal-300/10 border-teal-300/25',
    DELETE: 'text-rose-400 bg-rose-400/10 border-rose-400/25',
    HEAD: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/25',
    OPTIONS: 'text-slate-300 bg-slate-400/10 border-slate-400/25',
  };

  const currentStyle = styles[method] || styles.OPTIONS;

  return (
    <span
      className={`inline-flex items-center px-1.5 py-px text-[10px] font-mono font-semibold tracking-wide rounded border ${currentStyle}`}
    >
      {method}
    </span>
  );
};
