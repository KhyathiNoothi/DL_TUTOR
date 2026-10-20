import React from 'react';
import { Loader2, Brain } from 'lucide-react';

export default function Loading({ message = "Training Neural Network...", submessage = "Performing forward propagation and calculating loss..." }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
            <Brain className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
          <Loader2 className="w-20 h-20 text-indigo-500 animate-spin absolute -top-2 -left-2 opacity-80" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white font-mono">{message}</h3>
          <p className="text-xs text-slate-400 mt-1">{submessage}</p>
        </div>
      </div>
    </div>
  );
}
