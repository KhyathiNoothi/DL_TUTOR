import React from 'react';
import { BookOpen, Info, CheckCircle2 } from 'lucide-react';

export default function ExplanationPanel({ title, formula, explanation, highlights = [] }) {
  return (
    <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 space-y-3 min-w-0 max-w-full">
      <div className="flex items-center gap-2.5 text-indigo-400 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
          <BookOpen className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold text-white font-mono break-words min-w-0">{title}</h4>
      </div>

      {formula && (
        <div className="math-text scroll-box max-h-40 bg-slate-950 p-3 rounded-lg border border-indigo-500/20 text-xs font-bold text-indigo-300">
          {formula}
        </div>
      )}

      <p className="text-xs text-slate-300 leading-relaxed break-words">{explanation}</p>

      {highlights.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {highlights.map((item, idx) => (
            <li key={idx} className="flex items-start space-x-2 text-xs text-slate-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span className="break-words min-w-0">{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
