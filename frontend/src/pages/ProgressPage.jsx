import React from 'react';
import { BarChart3, Cpu, Network, Image as ImageIcon, Repeat, Flame, BookOpen, Info } from 'lucide-react';

export default function ProgressPage() {
  // Static description of what the app contains. Nothing here is measured from the learner.
  const modules = [
    { label: 'ANN: dense layers, activations, optimizers', value: 'ANN module', icon: Network },
    { label: 'CNN: convolution, ReLU, max pooling', value: 'CNN module', icon: ImageIcon },
    { label: 'RNN: embeddings, hidden states, BPTT', value: 'RNN module', icon: Repeat },
    { label: 'Backend address the app is configured to call', value: '127.0.0.1:8000', icon: Cpu },
  ];

  const concepts = [
    { title: 'Forward Propagation (z = xW + b)', category: 'ANN' },
    { title: 'Loss Functions (MSE & Binary Cross Entropy)', category: 'ANN/CNN' },
    { title: 'Optimizer updates (SGD, Momentum, Adam)', category: 'ANN' },
    { title: '2D Convolution & Kernel Filters', category: 'CNN' },
    { title: 'Max Pooling & Downsampling', category: 'CNN' },
    { title: 'Token Embeddings & Vocabulary Lookup', category: 'RNN' },
    { title: 'Unrolled Sequence Transitions (h_t = tanh)', category: 'RNN' },
    { title: 'Backpropagation Through Time (BPTT)', category: 'RNN' },
  ];

  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto min-w-0">
      <div className="flex flex-wrap items-center gap-3 bg-slate-900/90 rounded-2xl border border-slate-800 px-4 py-3">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
          <BarChart3 className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-white font-mono break-words">Concept Overview</h1>
          <p className="text-xs text-slate-400">What each simulator covers</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-700 bg-slate-950/60 p-3 text-xs text-slate-300">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
        <span className="min-w-0 break-words">
          Progress tracking is not implemented, so this page shows no scores, percentages or completion status. It only lists the concepts the simulators cover. Quiz scores exist only for the current browser session.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex items-start gap-3 min-w-0">
              <Icon className="w-5 h-5 shrink-0 text-indigo-400 mt-0.5" />
              <div className="min-w-0">
                <div className="text-sm font-bold text-white font-mono break-words">{m.value}</div>
                <div className="text-xs text-slate-400 font-mono mt-0.5 break-words">{m.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 min-w-0">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-400" />
          <span>Concepts covered by the simulators</span>
        </h3>
        <div className="space-y-2">
          {concepts.map((c, idx) => (
            <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-200 break-words min-w-0">{c.title}</span>
              <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-500/20 shrink-0">{c.category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
