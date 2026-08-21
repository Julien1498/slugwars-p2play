import React, { useEffect, useState } from 'react';
import { GameState } from '../../core/types';
import { Activity, Zap, X, Radio, BarChart2 } from 'lucide-react';
import { netMetrics, NetworkStats, TrafficCaptureReport } from '../../core/networkMetrics';
import { perfTracker, PerfCaptureReport } from '../../core/perfTracker';
import { RealtimeMetricsTab } from './metrics/RealtimeMetricsTab';
import { PerfCaptureTab } from './metrics/PerfCaptureTab';
import { NetCaptureTab } from './metrics/NetCaptureTab';

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

    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const tick = () => {
      const now = performance.now();
      const delta = now - lastTime;
      frameCount++;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / delta);
        const currentFrameTime = (delta / frameCount).toFixed(1);

        setFps(currentFps);
        setFrameTime(parseFloat(currentFrameTime));
        setSimPing(Math.round(14 + Math.random() * 8));
        setNetStats(netMetrics.getStats());

        const memory = (performance as any).memory;
        if (memory) {
          setMemoryUsage({
            usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
            totalMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)),
          });
        }

        frameCount = 0;
        lastTime = now;
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
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
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const unsub = perfTracker.onCaptureUpdate((report, progressRemaining) => {
      if (progressRemaining > 0) {
        setIsPerfRecording(true);
        setPerfCountdown(progressRemaining);
      } else {
        setIsPerfRecording(false);
        setPerfCountdown(0);
        if (report) setPerfReport(report);
      }
    });
    return unsub;
  }, [isOpen]);

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

  const fpsColor =
    fps >= 55
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40'
      : fps >= 30
      ? 'text-amber-400 border-amber-500/40 bg-amber-950/40'
      : 'text-red-400 border-red-500/40 bg-red-950/40';

  const displayPing = netStats.realPingMs !== null ? netStats.realPingMs : simPing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header Bar with 3 Tabs */}
        <div className="px-6 py-3.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-400 shadow-inner">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <span>Centre de Diagnostic & Performances</span>
              </h2>
              <p className="text-xs text-zinc-400">Analyse Temps Réel, Profiling Rendu/FPS & Inspecteur Réseau</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 p-1 rounded-xl gap-1">
              <button
                onClick={() => setActiveTab('realtime')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'realtime'
                    ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Temps Réel</span>
              </button>

              <button
                onClick={() => setActiveTab('perf_capture')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'perf_capture'
                    ? 'bg-amber-950/80 text-amber-300 shadow-sm border border-amber-500/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Capture Rendu 5s</span>
              </button>

              <button
                onClick={() => setActiveTab('net_capture')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'net_capture'
                    ? 'bg-emerald-950/80 text-emerald-300 shadow-sm border border-emerald-500/50'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Capture Réseau 5s</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {activeTab === 'realtime' && (
          <RealtimeMetricsTab
            fps={fps}
            frameTime={frameTime}
            displayPing={displayPing}
            fpsColor={fpsColor}
            netStats={netStats}
            memoryUsage={memoryUsage}
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
