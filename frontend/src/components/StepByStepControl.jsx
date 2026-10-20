import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Play, Pause, ListOrdered } from 'lucide-react';

export default function StepByStepControl({ currentStep, totalSteps, onNext, onPrev, onReset, steps = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        if (currentStep < totalSteps - 1) {
          onNext();
        } else {
          setIsPlaying(false);
        }
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentStep, totalSteps, onNext]);

  return (
    <div className="bg-slate-900 rounded-2xl border border-indigo-500/30 p-3 space-y-2 min-w-0 max-w-full">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 shrink-0 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <ListOrdered className="w-4 h-4" />
          </div>
          <p className="text-xs text-indigo-200 font-medium break-words min-w-0">
            <span className="font-mono font-bold text-white">
              Step {currentStep + 1}/{totalSteps}
            </span>
            {' · '}
            {steps[currentStep]?.title?.replace(/^\d+\.\s*/, '') || 'Calculation Phase'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 flex items-center gap-1 border border-slate-700 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              onNext();
            }}
            disabled={currentStep >= totalSteps - 1}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-semibold text-white flex items-center gap-1 border border-indigo-500 transition-all"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all border ${
              isPlaying
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Auto play'}</span>
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              onReset();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-all"
            title="Reset to Step 1"
            aria-label="Reset to Step 1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress dots bar */}
      <div className="flex items-center gap-1.5 pt-1">
        {Array.from({ length: totalSteps }).map((_, idx) => (
          <button
            key={idx}
            onClick={() => {
              setIsPlaying(false);
              if (idx < totalSteps) {
                // Navigate directly to step
                const diff = idx - currentStep;
                if (diff > 0) {
                  for (let i = 0; i < diff; i++) onNext();
                } else if (diff < 0) {
                  for (let i = 0; i < Math.abs(diff); i++) onPrev();
                }
              }
            }}
            className={`h-2 rounded-full transition-all flex-1 min-w-0 ${
              idx === currentStep
                ? 'bg-indigo-400 shadow-md shadow-indigo-500/50 scale-y-125'
                : idx < currentStep
                ? 'bg-indigo-600/70'
                : 'bg-slate-800'
            }`}
            title={`Step ${idx + 1}: ${steps[idx]?.title || ''}`}
          />
        ))}
      </div>
    </div>
  );
}
