import React from 'react';
import { BookOpen, CheckCircle2 } from 'lucide-react';

export default function FormulaCalcCard({
  title,
  whatIsHappening,
  formula,
  substitution,
  result,
  whyItMatters,
  badgeText = "Educational Breakdown",
  color = "indigo"
}) {
  const colorMap = {
    indigo: {
      border: 'border-indigo-500/30',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
      formulaBg: 'bg-slate-950 border-indigo-500/20 text-indigo-300',
      substBg: 'bg-slate-950 border-slate-800 text-amber-300',
      resultBg: 'bg-indigo-950/60 border-indigo-500/40 text-emerald-300',
    },
    cyan: {
      border: 'border-cyan-500/30',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      formulaBg: 'bg-slate-950 border-cyan-500/20 text-cyan-300',
      substBg: 'bg-slate-950 border-slate-800 text-amber-300',
      resultBg: 'bg-cyan-950/60 border-cyan-500/40 text-emerald-300',
    },
    emerald: {
      border: 'border-emerald-500/30',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      formulaBg: 'bg-slate-950 border-emerald-500/20 text-emerald-300',
      substBg: 'bg-slate-950 border-slate-800 text-amber-300',
      resultBg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
    },
    rose: {
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      formulaBg: 'bg-slate-950 border-rose-500/20 text-rose-300',
      substBg: 'bg-slate-950 border-slate-800 text-amber-300',
      resultBg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
    }
  };

  const style = colorMap[color] || colorMap.indigo;

  const Label = ({ children }) => (
    <span className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{children}</span>
  );

  return (
    <div className={`bg-slate-900/90 rounded-xl border ${style.border} p-4 space-y-3 min-w-0 max-w-full`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-white font-mono text-sm font-bold min-w-0">
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="break-words min-w-0">{title}</span>
        </div>
        <span className={`text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full border max-w-full break-words ${style.badge}`}>
          {badgeText}
        </span>
      </div>

      {whatIsHappening && (
        <p className="text-xs text-slate-300 leading-relaxed break-words">{whatIsHappening}</p>
      )}

      {/* Formula, substitution and result stay visually distinct: different label, tint and weight. */}
      {formula && (
        <div className="space-y-1 min-w-0">
          <Label>Formula</Label>
          <div className={`math-text scroll-box max-h-40 p-3 rounded-lg border text-xs font-bold ${style.formulaBg}`}>
            {formula}
          </div>
        </div>
      )}

      {substitution && (
        <div className="space-y-1 min-w-0">
          <Label>Substitution</Label>
          <div className={`math-text scroll-box max-h-48 p-3 rounded-lg border text-xs font-semibold ${style.substBg}`}>
            {substitution}
          </div>
        </div>
      )}

      {result !== undefined && result !== null && (
        <div className="space-y-1 min-w-0">
          <Label>Result</Label>
          <div className={`math-text scroll-box max-h-48 p-3 rounded-lg border text-xs font-bold ${style.resultBg}`}>
            {typeof result === 'object' ? JSON.stringify(result) : String(result)}
          </div>
        </div>
      )}

      {whyItMatters && (
        <details className="group rounded-lg border border-slate-800 bg-slate-950/60">
          <summary className="cursor-pointer list-none flex items-center gap-1.5 px-3 py-2 text-xs text-emerald-400 font-bold font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Why it matters</span>
            <span className="ml-auto text-slate-500 text-[10px] font-normal group-open:hidden">show</span>
          </summary>
          <p className="px-3 pb-3 text-[11px] text-slate-400 leading-relaxed break-words">{whyItMatters}</p>
        </details>
      )}
    </div>
  );
}
