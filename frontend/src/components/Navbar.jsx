import React, { useEffect, useState } from 'react';
import { Brain, Activity, RefreshCw, Cpu } from 'lucide-react';
import { checkHealth } from '../services/api';

export default function Navbar({ activeTab, setActiveTab }) {
  const [isOnline, setIsOnline] = useState(null);
  const [checking, setChecking] = useState(false);

  const pingBackend = async () => {
    setChecking(true);
    const res = await checkHealth();
    setIsOnline(res.success);
    setChecking(false);
  };

  useEffect(() => {
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold tracking-wider text-white font-mono">DL TUTOR</span>
            <span className="hidden sm:inline text-xs bg-indigo-500/10 text-indigo-400 font-medium px-2 py-0.5 rounded-full border border-indigo-500/20">
              Interactive Lab
            </span>
          </div>
          <p className="hidden sm:block text-xs text-slate-400">Deep Learning Step-by-Step Simulator</p>
        </div>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        {/* Backend status indicator */}
        <div
          onClick={pingBackend}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
            isOnline
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : isOnline === false
              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="Click to re-check backend FastAPI connection"
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
          <span>{checking ? 'Checking...' : isOnline ? <><span className="hidden md:inline">Backend Online (127.0.0.1:8000)</span><span className="md:hidden">Online</span></> : <><span className="hidden md:inline">Backend Offline</span><span className="md:hidden">Offline</span></>}</span>
          <RefreshCw className={`w-3 h-3 ml-1 ${checking ? 'animate-spin' : ''}`} />
        </div>

        <div className="hidden md:block h-4 w-px bg-slate-800"></div>

        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-lg border border-slate-700/50">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>NumPy Backend</span>
        </div>
      </div>
    </header>
  );
}
