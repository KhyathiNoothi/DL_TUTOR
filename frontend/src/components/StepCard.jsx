import React from 'react';

export default function StepCard({ stepNumber, title, subtitle, children, active = false }) {
  return (
    <div
      className={`rounded-2xl border transition-all p-4 space-y-3 min-w-0 max-w-full ${
        active ? 'bg-slate-900 border-indigo-500/50 ring-1 ring-indigo-500/20' : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3 border-b border-slate-800/80 pb-3 min-w-0">
        <div className="w-7 h-7 shrink-0 rounded-lg bg-indigo-600 text-white font-mono text-xs font-bold flex items-center justify-center">
          {stepNumber}
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-white font-mono break-words">{title}</h4>
          {subtitle && <p className="text-xs text-slate-400 break-words">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3 min-w-0">{children}</div>
    </div>
  );
}
