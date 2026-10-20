import React, { useState } from 'react';
import { AlertTriangle, ChevronDown } from 'lucide-react';

// Shared input styling so every module's form looks identical.
export const inputCls =
  'w-full min-w-0 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none';

const accents = {
  indigo: { icon: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30', focus: 'focus:border-indigo-500', btn: 'from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 shadow-indigo-600/30', text: 'text-indigo-300' },
  cyan: { icon: 'bg-cyan-600/20 text-cyan-400 border-cyan-500/30', focus: 'focus:border-cyan-500', btn: 'from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 shadow-cyan-600/30', text: 'text-cyan-300' },
  emerald: { icon: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30', focus: 'focus:border-emerald-500', btn: 'from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-600/30', text: 'text-emerald-300' },
};
export const accentOf = (a) => accents[a] || accents.indigo;

// Compact page header: icon + module name + one-line description, optional right-side slot.
export function PageHeader({ icon: Icon, accent = 'indigo', title, subtitle, children }) {
  const a = accentOf(accent);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 rounded-2xl border border-slate-800 px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center border ${a.icon}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white font-mono break-words">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400 break-words">{subtitle}</p>}
        </div>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 min-w-0">{children}</div>}
    </div>
  );
}

export function ErrorBanner({ message, onClose }) {
  if (!message) return null;
  return (
    <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl text-xs flex items-start justify-between gap-3">
      <div className="flex items-start gap-2 min-w-0">
        <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
        <span className="break-words min-w-0">{message}</span>
      </div>
      <button onClick={onClose} className="shrink-0 text-rose-400 hover:text-white font-bold" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

// Standard card: one border, one padding, one heading size.
export function Panel({ title, subtitle, badge, actions, children, className = '' }) {
  return (
    <section className={`bg-slate-900/90 rounded-2xl border border-slate-800 p-4 min-w-0 space-y-3 ${className}`}>
      {(title || badge || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-bold text-white font-mono break-words">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-400 break-words">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            {badge && (
              <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 break-words">
                {badge}
              </span>
            )}
            {actions}
          </div>
        </div>
      )}
      {children}
    </section>
  );
}

// Expandable section (progressive disclosure for advanced details and secondary forms).
export function Collapsible({ title, subtitle, defaultOpen = false, children, className = '' }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-xl border border-slate-800 bg-slate-950/50 min-w-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left"
      >
        <span className="min-w-0">
          <span className="block text-xs font-mono font-bold text-slate-200 break-words">{title}</span>
          {subtitle && <span className="block text-[11px] text-slate-500 break-words">{subtitle}</span>}
        </span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-3 pb-3 pt-1 space-y-3 min-w-0">{children}</div>}
    </div>
  );
}

export function Field({ label, children, className = '' }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="block text-xs font-mono text-slate-400 mb-1 break-words">{label}</span>
      {children}
    </label>
  );
}

// Controls column + main column. Stacks vertically below xl so nothing is squeezed
// between the 16rem app sidebar and a fixed-width form column.
export function ModuleLayout({ controls, children }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[19rem_minmax(0,1fr)] gap-6 items-start">
      <div className="space-y-4 min-w-0">{controls}</div>
      <div className="space-y-4 min-w-0">{children}</div>
    </div>
  );
}

// Compact numbered tab-like selector for timesteps / BPTT steps (wraps, never overflows).
export function IndexSelector({ count, selected, onSelect, label = (i) => `t = ${i + 1}`, accent = 'emerald' }) {
  const on = accent === 'indigo' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white';
  return (
    <div className="flex flex-wrap gap-1 min-w-0">
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${selected === i ? on : 'bg-slate-800 text-slate-400 hover:text-slate-200'}`}
        >
          {label(i)}
        </button>
      ))}
    </div>
  );
}

// Consistency-check banner: green when recomputed values agree with the backend, amber with a
// diagnostic when they do not, neutral when a check cannot be performed.
export function CheckBanner({ status = 'info', title, children }) {
  const styles = {
    ok: 'border-emerald-600/40 bg-emerald-950/30 text-emerald-300',
    warn: 'border-amber-500/60 bg-amber-950/40 text-amber-200',
    info: 'border-slate-700 bg-slate-950/60 text-slate-300',
  };
  const mark = status === 'ok' ? '✓' : status === 'warn' ? '⚠' : 'ⓘ';
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs min-w-0 max-w-full ${styles[status] || styles.info}`} role={status === 'warn' ? 'alert' : undefined}>
      <div className="font-mono font-bold break-words">
        {mark} {title}
      </div>
      {children && <div className="mt-1 leading-relaxed break-words [overflow-wrap:anywhere] text-[11px] opacity-90">{children}</div>}
    </div>
  );
}
