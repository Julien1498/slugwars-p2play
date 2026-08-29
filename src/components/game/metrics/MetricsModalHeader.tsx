import React from 'react';
import { Activity, Zap, X, Radio, BarChart2 } from 'lucide-react';

interface MetricsModalHeaderProps {
  activeTab: 'realtime' | 'perf_capture' | 'net_capture';
  onSelectTab: (tab: 'realtime' | 'perf_capture' | 'net_capture') => void;
  onClose: () => void;
}

export const MetricsModalHeader: React.FC<MetricsModalHeaderProps> = ({
  activeTab,
  onSelectTab,
  onClose,
}) => {
  return (
    <div className="p-3 sm:px-6 sm:py-3.5 bg-zinc-950 border-b border-zinc-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 sm:p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-400 shadow-inner">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>Diagnostic & Performances</span>
            </h2>
            <p className="text-[10px] sm:text-xs text-zinc-400">FPS, Profiling Rendu & Réseau P2P</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center justify-between md:justify-end gap-1.5 overflow-x-auto">
        <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => onSelectTab('realtime')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'realtime'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Temps Réel</span>
          </button>

          <button
            onClick={() => onSelectTab('perf_capture')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'perf_capture'
                ? 'bg-amber-950/80 text-amber-300 shadow-sm border border-amber-500/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Rendu 5s</span>
          </button>

          <button
            onClick={() => onSelectTab('net_capture')}
            className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'net_capture'
                ? 'bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-500/50'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Réseau 5s</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="hidden md:flex p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition ml-2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
