import React, { useEffect, useState } from 'react';
import { GameState } from '../../../core/types';
import { netMetrics, NetworkStats, TrafficCaptureReport } from '../../../core/networkMetrics';
import { perfTracker, PerfCaptureReport } from '../../../core/perfTracker';
import { RealtimeMetricsTab } from '../metrics/RealtimeMetricsTab';
import { PerfCaptureTab } from '../metrics/PerfCaptureTab';
import { NetCaptureTab } from '../metrics/NetCaptureTab';
import { MetricsModalHeader } from '../metrics/MetricsModalHeader';

interface MetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  hostPeerId: string;
}

export const MetricsModal: React.FC<MetricsModalProps> = React.memo(({
  isOpen,
  onClose,
  gameState,
}) => {
  const [activeTab, setActiveTab] = useState<'realtime' | 'perf_capture' | 'net_capture'>('realtime');
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.6);
  const [memoryUsage, setMemoryUsage] = useState<{ usedMB: number; totalMB: number } | null>(null);
  const [simPing, setSimPing] = useState(18);
  const [netStats, setNetStats] = useState<NetworkStats>(netMetrics.getStats());
  const [liveBgDpr, setLiveBgDpr] = useState<number>(perfTracker.liveBgDpr || 1.0);
  const [liveActionDpr, setLiveActionDpr] = useState<number>(perfTracker.liveActionDpr || 1.0);

  // Performance Profiler State
  const [isPerfRecording, setIsPerfRecording] = useState(false);
  const [perfCountdown, setPerfCountdown] = useState(0);
  const [perfReport, setPerfReport] = useState<PerfCaptureReport | null>(perfTracker.getLastReport());
  const [perfCopied, setPerfCopied] = useState(false);

  // Network Traffic Inspector State
  const [isNetRecording, setIsNetRecording] = useState(false);
  const [netCountdown, setNetCountdown] = useState(0);
  const [captureReport, setCaptureReport] = useState<TrafficCaptureReport | null>(netMetrics.getLastCaptureReport());
  const [netCopied, setNetCopied] = useState(false);

  // In-Game Permanent Zero-Cost FPS HUD Toggle State
  const [isFpsHudActive, setIsFpsHudActive] = useState<boolean>(() => perfTracker.getFpsHudEnabled());
  const [isFpsHudAdvancedActive, setIsFpsHudAdvancedActive] = useState<boolean>(() => perfTracker.getFpsHudAdvancedEnabled());

  const handleToggleFpsHud = () => {
    const nextVal = !isFpsHudActive;
    setIsFpsHudActive(nextVal);
    perfTracker.setFpsHudEnabled(nextVal);
  };

  const handleToggleFpsHudAdvanced = () => {
    const nextVal = !isFpsHudAdvancedActive;
    setIsFpsHudAdvancedActive(nextVal);
    perfTracker.setFpsHudAdvancedEnabled(nextVal);
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateInterval = setInterval(() => {
      setFps(perfTracker.currentFps);
      setFrameTime(perfTracker.currentFrameTimeMs);
      setSimPing(Math.round(14 + Math.random() * 8));
      setNetStats(netMetrics.getStats());
      setLiveBgDpr(perfTracker.liveBgDpr || 1.0);
      setLiveActionDpr(perfTracker.liveActionDpr || 1.0);

      const memory = (performance as any).memory;
      if (memory) {
        setMemoryUsage({
          usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
          totalMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
        });
      }
    }, 500);

    return () => clearInterval(updateInterval);
  }, [isOpen]);

  useEffect(() => {
    const unsub = netMetrics.onCaptureUpdate((report, progressRemaining) => {
      if (progressRemaining > 0) {
        setIsNetRecording(true);
        setNetCountdown(progressRemaining);
      } else {
        setIsNetRecording(false);
        setNetCountdown(0);
        if (report) setCaptureReport(report);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = perfTracker.onCaptureUpdate((report, progressRemaining) => {
      if (progressRemaining > 0) {
        setIsPerfRecording(true);
        setPerfCountdown(progressRemaining);
      } else {
        setIsPerfRecording(false);
        setPerfCountdown(0);
        if (report) {
          setPerfReport(report);
          setActiveTab('perf_capture');
        }
      }
    });
    return unsub;
  }, []);

  const handleStartNetCapture = () => {
    setIsNetRecording(true);
    setNetCountdown(5);
    setCaptureReport(null);
    netMetrics.startCapture(5);
  };

  const handleStartPerfCapture = () => {
    setIsPerfRecording(true);
    setPerfCountdown(5);
    setPerfReport(null);
    perfTracker.startCapture(5);
  };

  const handleCopyNetReport = () => {
    if (!captureReport) return;
    navigator.clipboard.writeText(JSON.stringify(captureReport, null, 2));
    setNetCopied(true);
    setTimeout(() => setNetCopied(false), 2000);
  };

  const handleCopyPerfReport = () => {
    if (!perfReport) return;
    navigator.clipboard.writeText(JSON.stringify(perfReport, null, 2));
    setPerfCopied(true);
    setTimeout(() => setPerfCopied(false), 2000);
  };

  if (!isOpen) return null;

  if (isPerfRecording) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-950/95 border-2 border-amber-500/80 px-5 py-2.5 rounded-2xl shadow-2xl text-amber-300 font-mono text-sm animate-pulse pointer-events-none">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
        <span className="font-extrabold text-white">⚡ PROFILING EN JEU 100% PLEIN DÉBIT :</span>
        <span className="font-bold text-amber-400">{perfCountdown}s restantes...</span>
      </div>
    );
  }

  const fpsColor =
    fps >= 55
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : fps >= 30
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-red-400 border-red-500/40 bg-red-950/40';

  const displayPing = netStats.realPingMs !== null ? netStats.realPingMs : simPing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        <MetricsModalHeader
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onClose={onClose}
        />

        {activeTab === 'realtime' && (
          <RealtimeMetricsTab
            fps={fps}
            frameTime={frameTime}
            displayPing={displayPing}
            fpsColor={fpsColor}
            netStats={netStats}
            memoryUsage={memoryUsage}
            liveBgDpr={liveBgDpr}
            liveActionDpr={liveActionDpr}
            gameState={gameState}
            isFpsHudActive={isFpsHudActive}
            onToggleFpsHud={handleToggleFpsHud}
            isFpsHudAdvancedActive={isFpsHudAdvancedActive}
            onToggleFpsHudAdvanced={handleToggleFpsHudAdvanced}
          />
        )}

        {activeTab === 'perf_capture' && (
          <PerfCaptureTab
            perfReport={perfReport}
            isPerfRecording={isPerfRecording}
            perfCountdown={perfCountdown}
            onStartPerfCapture={handleStartPerfCapture}
            onCopyPerfReport={handleCopyPerfReport}
            perfCopied={perfCopied}
          />
        )}

        {activeTab === 'net_capture' && (
          <NetCaptureTab
            captureReport={captureReport}
            isNetRecording={isNetRecording}
            netCountdown={netCountdown}
            onStartNetCapture={handleStartNetCapture}
            onCopyNetReport={handleCopyNetReport}
            netCopied={netCopied}
          />
        )}

        {/* Footer Bar */}
        <div className="px-6 py-3 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}, (prev, next) => {
  if (prev.isOpen !== next.isOpen) return false;
  if (prev.hostPeerId !== next.hostPeerId) return false;
  if (!next.isOpen) return true;

  const pState = prev.gameState;
  const nState = next.gameState;
  if (pState === nState) return true;

  if (pState.slugs.length !== nState.slugs.length) return false;
  if (pState.projectiles.length !== nState.projectiles.length) return false;
  if (pState.mines.length !== nState.mines.length) return false;
  if (pState.explosions.length !== nState.explosions.length) return false;
  if (pState.particles.length !== nState.particles.length) return false;

  return true;
});
