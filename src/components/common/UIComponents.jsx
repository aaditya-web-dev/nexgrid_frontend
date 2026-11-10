import React from 'react';

export const LoadingSpinner = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-10 h-10 border-3',
  };

  return (
    <div className="flex flex-col items-center justify-center p-4 gap-2">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-slate-600 border-t-indigo-500 rounded-full animate-spin`}
      />
      {text && <span className="text-xs text-slate-400 font-medium">{text}</span>}
    </div>
  );
};

export const ErrorAlert = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="p-3 mb-3 text-sm bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{typeof message === 'string' ? message : JSON.stringify(message)}</span>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-rose-400 hover:text-rose-200 text-lg leading-none cursor-pointer px-1"
        >
          &times;
        </button>
      )}
    </div>
  );
};

export const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-100">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl font-light cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const MethodBadge = ({ method }) => {
  const styles = {
    GET: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    POST: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    PUT: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    PATCH: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    DELETE: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    HEAD: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    OPTIONS: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  };

  const currentStyle = styles[method] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  return (
    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${currentStyle}`}>
      {method}
    </span>
  );
};
