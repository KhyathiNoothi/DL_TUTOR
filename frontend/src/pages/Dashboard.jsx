import React from 'react';
import { Network, Image as ImageIcon, Repeat, Sparkles, BookOpen, Layers, Zap, Award } from 'lucide-react';
import ModuleCard from '../components/ModuleCard';

export default function Dashboard({ setActiveTab }) {
  const modules = [
    {
      id: 'ann',
      title: 'Artificial Neural Networks',
      badge: 'ANN',
      color: 'indigo',
      icon: Network,
      description: 'Understand neurons, weighted sum (z = xW + b), activation functions (ReLU, Sigmoid, Tanh), loss calculation, and backpropagation parameter updates.',
      features: [
        'Interactive Node & Connection Graph',
        'Forward & Backward Propagation',
        'Loss Curves & Optimizer Comparison',
        'Step-by-Step Calculation Breakdown',
      ],
    },
    {
      id: 'cnn',
      title: 'Convolutional Neural Networks',
      badge: 'CNN',
      color: 'cyan',
      icon: ImageIcon,
      description: 'See convolution matrix operations, kernel sliding, elementwise multiplication, feature map extraction, ReLU activation, max pooling, and dense classification.',
      features: [
        '2D Matrix Patch & Kernel Visualizer',
        'Feature Map & Max Pooling Gradients',
        'Flattening & Binary Logit Computation',
        'Kernel Filter Weight Updates',
      ],
    },
    {
      id: 'rnn',
      title: 'Recurrent Neural Networks',
      badge: 'RNN',
      color: 'emerald',
      icon: Repeat,
      description: 'Understand text tokenization, embeddings, unrolled sequence transitions h_t over time, final hidden representations, and Backpropagation Through Time (BPTT).',
      features: [
        'Text Tokenization & Vector Embeddings',
        'Unrolled Sequence Hidden State Flow',
        'Timestep Calculator (x_t, h_{t-1}, tanh)',
        'Full BPTT Gradient Flow Inspection',
      ],
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-indigo-500/20 p-8 sm:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive AI Laboratory + Educational Tutor</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
            DL TUTOR
          </h1>

          <p className="text-xl font-bold text-indigo-300">
            "Learn Deep Learning by Seeing It Happen"
          </p>

          <p className="text-sm text-slate-300 leading-relaxed">
            Understand ANN, CNN and RNN models through actual step-by-step mathematical calculations, interactive vector matrix visualizations, live loss graphs, and unrolled time sequence inspections powered by NumPy.
          </p>

          <div className="flex flex-wrap gap-4 pt-2 text-xs font-mono text-slate-400">
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Real NumPy Math</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Unrolled BPTT & Kernels</span>
            </div>
            <div className="flex items-center space-x-2 bg-slate-900/80 px-3 py-2 rounded-xl border border-slate-800">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              <span>Step-by-Step Mode</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
            <span>Explore Deep Learning Modules</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">3 Interactive Simulators</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map((mod) => (
            <ModuleCard
              key={mod.id}
              title={mod.title}
              badge={mod.badge}
              description={mod.description}
              icon={mod.icon}
              color={mod.color}
              features={mod.features}
              onExplore={() => setActiveTab(mod.id)}
            />
          ))}
        </div>
      </div>

      {/* Educational Highlights */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 space-y-4">
        <h3 className="text-base font-bold text-white font-mono flex items-center space-x-2">
          <Award className="w-5 h-5 text-amber-400" />
          <span>Designed For Viva, Demonstration & Learning</span>
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          DL Tutor avoids black-box abstractions. Every output shown in the interface is calculated live by the FastAPI backend using standard matrix equations. You can modify learning rates, epochs, inputs, kernel filters, and vocabulary texts to inspect how parameter weights adapt.
        </p>
      </div>
    </div>
  );
}
