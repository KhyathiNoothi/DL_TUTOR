import React from 'react';
import { fmt } from '../utils/format';

export default function NumberDisplay({ label, value, symbol, highlight = false, color = 'indigo', precision = 4, size = 'md' }) {
  const formatVal = (v) => {
    if (v === null || v === undefined) return 'N/A';
    if (Array.isArray(v)) return `[${v.map((item) => (typeof item === 'number' ? fmt(item, precision) : JSON.stringify(item))).join(', ')}]`;
    return fmt(v, precision);
  };

  const colors = {
    indigo: 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300',
    emerald: 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300',
    amber: 'bg-amber-950/40 border-amber-800/40 text-amber-300',
    rose: 'bg-rose-950/40 border-rose-800/40 text-rose-300',
    cyan: 'bg-cyan-950/40 border-cyan-800/40 text-cyan-300',
    slate: 'bg-slate-900 border-slate-800 text-slate-300',
  };
  const activeColor = colors[color] || colors.indigo;

  return (
    <div
      className={`rounded-xl border p-3 flex flex-col gap-1 min-w-0 max-w-full transition-all ${activeColor} ${
        highlight ? 'ring-2 ring-indigo-500/50 shadow-lg' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2 text-xs text-slate-400 font-mono">
        <span className="break-words min-w-0">{label}</span>
        {symbol && <span className="font-serif italic text-slate-500 text-sm shrink-0">{symbol}</span>}
      </div>
      {/* Wraps at ", " so every element stays visible; a very long vector scrolls inside this box. */}
      <div
        className={`math-text scroll-box max-h-32 font-bold tracking-tight text-slate-100 ${
          size === 'lg' ? 'text-lg' : size === 'sm' ? 'text-xs' : 'text-sm'
        }`}
      >
        {formatVal(value)}
      </div>
    </div>
  );
}
