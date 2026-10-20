import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export default function ModuleCard({ title, badge, description, icon: Icon, color, features, onExplore }) {
  const colorMap = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/50',
      badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
      iconBg: 'from-indigo-600 to-indigo-500',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/20',
      accentText: 'text-indigo-400',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/50',
      badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
      iconBg: 'from-cyan-600 to-cyan-500',
      btn: 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/20',
      accentText: 'text-cyan-400',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/50',
      badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      iconBg: 'from-emerald-600 to-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20',
      accentText: 'text-emerald-400',
    },
  };

  const style = colorMap[color] || colorMap.indigo;

  return (
    <div
      className={`group relative bg-slate-900 rounded-2xl border ${style.border} p-6 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${style.iconBg} flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${style.badge}`}>
            {badge}
          </span>
        </div>

        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white flex items-center space-x-2">
          <span>{title}</span>
        </h3>

        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {description}
        </p>

        <div className="space-y-2 mb-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
            Key Visualizations:
          </p>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-center space-x-2">
                <Sparkles className={`w-3.5 h-3.5 ${style.accentText} shrink-0`} />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        onClick={onExplore}
        className={`w-full py-2.5 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-md ${style.btn}`}
      >
        <span>Explore {title}</span>
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
