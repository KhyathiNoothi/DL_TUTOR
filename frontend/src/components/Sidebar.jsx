import React from 'react';
import { Home, Network, Image as ImageIcon, Repeat, HelpCircle, BarChart3 } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
    { id: 'ann', label: 'ANN Module', icon: Network, badge: 'Dense' },
    { id: 'cnn', label: 'CNN Module', icon: ImageIcon, badge: 'Spatial' },
    { id: 'rnn', label: 'RNN Module', icon: Repeat, badge: 'Sequence' },
    { id: 'quiz', label: 'DL Quiz', icon: HelpCircle, badge: 'Test' },
    { id: 'progress', label: 'Concept Overview', icon: BarChart3, badge: 'Info' },
  ];

  return (
    <aside className="w-full lg:w-64 bg-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col shrink-0 lg:min-h-[calc(100vh-65px)] min-w-0">
      <div className="p-2 lg:p-4 min-w-0">
        <p className="hidden lg:block text-[11px] font-semibold tracking-wider text-slate-500 uppercase px-3 mb-2 font-mono">
          Learning Modules
        </p>
        <nav className="flex lg:block gap-1 lg:space-y-1 overflow-x-auto lg:overflow-visible">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`lg:w-full shrink-0 flex items-center justify-between gap-2 px-3 lg:px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 whitespace-nowrap">
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`hidden lg:inline text-[10px] font-mono px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-400/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="hidden lg:block mt-auto p-4 border-t border-slate-800/80">
        <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-400">
          <div className="flex items-center space-x-2 text-indigo-400 font-semibold mb-1">
            <span>💡 How to Learn</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-400">
            Configure hyperparameters, run training, and use the <strong className="text-slate-200">Step-by-Step</strong> mode to trace mathematical values.
          </p>
        </div>
      </div>
    </aside>
  );
}
