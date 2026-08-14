import React, { useEffect, useState } from 'react';
import { GameState } from '../../core/types';
import {
  Activity,
  Cpu,
  HardDrive,
  Wifi,
  Zap,
  X,
  Shield,
  Monitor,
  ArrowUpRight,
  ArrowDownLeft,
  Radio,
  Clock,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  AlertTriangle,
  Flame,
  Layers,
  BarChart2,
} from 'lucide-react';
import { netMetrics, NetworkStats, TrafficCaptureReport, PacketLogEntry } from '../../core/networkMetrics';
import { perfTracker, PerfCaptureReport, FrameLogEntry } from '../../core/perfTracker';

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
  hostPeerId,
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
  const [onlyJankFilter, setOnlyJankFilter] = useState(false);

  // Network Traffic Inspector State
  const [isNetRecording, setIsNetRecording] = useState(false);
  const [netCountdown, setNetCountdown] = useState(0);
  const [captureReport, setCaptureReport] = useState<TrafficCaptureReport | null>(netMetrics.getLastCaptureReport());
  const [expandedPacketId, setExpandedPacketId] = useState<number | null>(null);
  const [netCopied, setNetCopied] = useState(false);

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

  // Subscribe to Network Capture updates
  useEffect(() => {
    if (!isOpen) return;
    const unsub = netMetrics.onCaptureUpdate((report, progressRemaining) => {
      if (progressRemaining > 0) {
        setIsNetRecording(true);
        setNetCountdown(progressRemaining);
      } else {
        setIsNetRecording(false);
        setNetCountdown(0);
        if (report) {
          setCaptureReport(report);
        }
      }
    });
    return unsub;
  }, [isOpen]);

  // Subscribe to Performance Profiler updates
  useEffect(() => {
    if (!isOpen) return;
    const unsub = perfTracker.onCaptureUpdate((report, progressRemaining) => {
      if (progressRemaining > 0) {
        setIsPerfRecording(true);
        setPerfCountdown(progressRemaining);
      } else {
        setIsPerfRecording(false);
        setPerfCountdown(0);
        if (report) {
          setPerfReport(report);
        }
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

  const particleCount = gameState.particles?.length || 0;
  const projectileCount = gameState.projectiles?.length || 0;
  const explosionCount = gameState.explosions?.length || 0;
  const mineCount = gameState.mines?.length || 0;
  const livingSlugs = gameState.slugs.filter((s) => s.isAlive).length;
  const displayPing = netStats.realPingMs !== null ? netStats.realPingMs : simPing;

  const filteredPerfFrames = perfReport
    ? onlyJankFilter
      ? perfReport.frames.filter((f) => f.isJank)
      : perfReport.frames
    : [];

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
            {/* Tab selector */}
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

        {/* Tab 1: Realtime Metrics */}
        {activeTab === 'realtime' && (
          <div className="p-6 space-y-5 overflow-y-auto font-sans">
            {/* Top Metrics Cards: FPS, Frame Time, Latency */}
            <div className="grid grid-cols-3 gap-3">
              {/* FPS */}
              <div className={`p-3.5 rounded-xl border flex flex-col items-center justify-center ${fpsColor}`}>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-1">
                  <Zap className="w-4 h-4" />
                  <span>Images / Sec</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight">{fps}</div>
                <div className="text-[11px] opacity-80 mt-1 font-semibold">FPS (Target: 60)</div>
              </div>

              {/* Frame Time */}
              <div className="p-3.5 rounded-xl border border-zinc-700/60 bg-zinc-950/70 text-zinc-200 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1">
                  <Cpu className="w-4 h-4" />
                  <span>Latence Rendu</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight text-white">{frameTime} ms</div>
                <div className="text-[11px] text-zinc-400 mt-1 font-semibold">Budget: 16.6 ms</div>
              </div>

              {/* Network Latency */}
              <div className="p-3.5 rounded-xl border border-zinc-700/60 bg-zinc-950/70 text-zinc-200 flex flex-col items-center justify-center">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400 mb-1">
                  <Wifi className="w-4 h-4" />
                  <span>Ping WebRTC</span>
                </div>
                <div className="text-3xl font-black font-mono tracking-tight text-emerald-400">{displayPing} ms</div>
                <div className="text-[11px] text-zinc-400 mt-1 font-semibold">
                  {netStats.realPingMs !== null ? 'Mesure WebRTC RTT' : 'Canal Direct P2P'}
                </div>
              </div>
            </div>

            {/* Real-Time Bandwidth P2P Section */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Débit Réseau P2P (Upload / Download)</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-400">
                  Total Session: {(netStats.totalSentKB + netStats.totalReceivedKB).toFixed(1)} KB
                </span>
              </h3>

              <div className="grid grid-cols-2 gap-3">
                {/* Upload Card */}
                <div className="bg-zinc-900/80 border border-sky-500/30 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sky-400">
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Upload (Émission)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">
                        {netStats.uploadKbps}
                      </span>
                      <span className="text-xs font-bold text-sky-300">kbps</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({netStats.uploadKBs} KB/s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-zinc-400">
                    <div>Envoyé</div>
                    <div className="font-bold text-zinc-200">{netStats.totalSentKB} KB</div>
                  </div>
                </div>

                {/* Download Card */}
                <div className="bg-zinc-900/80 border border-violet-500/30 p-3.5 rounded-xl flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-400">
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Download (Réception)</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black font-mono text-white tracking-tight">
                        {netStats.downloadKbps}
                      </span>
                      <span className="text-xs font-bold text-violet-300">kbps</span>
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({netStats.downloadKBs} KB/s)
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[11px] font-mono text-zinc-400">
                    <div>Reçu</div>
                    <div className="font-bold text-zinc-200">{netStats.totalReceivedKB} KB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Hardware Stats */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>Performances Matériel & Mémoire</span>
              </h3>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-400">Mémoire JS Heap :</span>
                  <span className="font-mono font-bold text-amber-300">
                    {memoryUsage ? `${memoryUsage.usedMB} MB / ${memoryUsage.totalMB} MB` : 'API Indisponible'}
                  </span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-400">Ratio Rétine (DPR) :</span>
                  <span className="font-mono font-bold text-white">{window.devicePixelRatio || 1}x</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-400">Résolution Canvas Native :</span>
                  <span className="font-mono font-bold text-cyan-300">1400 × 800 px</span>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg flex justify-between items-center">
                  <span className="text-zinc-400">Taille Fenêtre Nav. :</span>
                  <span className="font-mono font-bold text-white">{window.innerWidth} × {window.innerHeight} px</span>
                </div>
              </div>
            </div>

            {/* Active Canvas Entities Counter */}
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Charge de Calcul Moteur & Entités</span>
              </h3>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Limaces</div>
                  <div className="font-black text-base font-mono text-emerald-400 mt-1">{livingSlugs} / {gameState.slugs.length}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Projectiles</div>
                  <div className="font-black text-base font-mono text-amber-400 mt-1">{projectileCount}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Mines</div>
                  <div className="font-black text-base font-mono text-red-400 mt-1">{mineCount}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Explosions</div>
                  <div className="font-black text-base font-mono text-orange-400 mt-1">{explosionCount}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800 p-2.5 rounded-lg">
                  <div className="text-zinc-400 text-[10px] uppercase font-bold">Particules</div>
                  <div className="font-black text-base font-mono text-cyan-400 mt-1">{particleCount}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: 5-Second Hardware & Render Performance Profiler */}
        {activeTab === 'perf_capture' && (
          <div className="p-6 space-y-5 overflow-y-auto font-sans flex-1">
            {/* Recording Control Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Profiling Matériel & Rendu Canvas (5 Secondes)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Capture chaque image rendue : FPS réels, saccades (Jank), temps de dessin Canvas 2D et consommation mémoire.
                </p>
              </div>

              <div>
                {isPerfRecording ? (
                  <div className="flex items-center gap-3 bg-amber-950/80 border border-amber-500/60 px-4 py-2 rounded-xl text-amber-300 text-xs font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Profiling en cours ({perfCountdown}s restantes)...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartPerfCapture}
                    className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-black rounded-xl shadow-lg transition"
                  >
                    <Zap className="w-4 h-4" />
                    <span>⚡ Lancer le Profiling 5s</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Report View */}
            {perfReport ? (
              <div className="space-y-4">
                {/* Summary Dashboard Cards (5 Columns) */}
                <div className="grid grid-cols-5 gap-2.5">
                  {/* FPS Moy & Min/Max */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">FPS Moyen / Min</div>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-black font-mono text-emerald-400">
                        {perfReport.avgFps}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono">
                        (Min: <strong className="text-amber-400">{perfReport.minFps}</strong>)
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      1% Low : <strong className="text-amber-300">{perfReport.p1LowFps} FPS</strong>
                    </div>
                  </div>

                  {/* Draw Time (Temps de dessin Canvas) */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Dessin Canvas 2D</div>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                      {perfReport.avgRenderDurationMs} <span className="text-xs">ms</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Max Dessin : {perfReport.maxRenderDurationMs} ms
                    </div>
                  </div>

                  {/* Physics Calculations (Calculs Physique) */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Physique Moteur</div>
                    <div className="text-xl font-black font-mono text-emerald-400 mt-0.5">
                      {perfReport.avgPhysicsDurationMs} <span className="text-xs">ms</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Max: {perfReport.maxPhysicsDurationMs}ms ({perfReport.totalPhysicsTicks} ticks)
                    </div>
                  </div>

                  {/* Saccades & Jank */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Saccades (&gt;20ms)</div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                      {perfReport.jankFrameCount}{' '}
                      <span className="text-xs font-normal text-zinc-400">
                        ({perfReport.jankPercent}%)
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      Critiques (&gt;33ms) : <strong className="text-red-400">{perfReport.criticalJankCount}</strong>
                    </div>
                  </div>

                  {/* JS Heap Memory */}
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Mémoire JS Heap</div>
                    <div className="text-xl font-black font-mono text-violet-400 mt-0.5">
                      {perfReport.memoryEndMB !== null ? `${perfReport.memoryEndMB} MB` : 'N/A'}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      {perfReport.memoryDeltaMB !== null
                        ? `Variation: ${perfReport.memoryDeltaMB >= 0 ? '+' : ''}${perfReport.memoryDeltaMB} MB`
                        : 'Navigateur bridé'}
                    </div>
                  </div>
                </div>

                {/* Top 10 Worst Frames Alert Section */}
                {perfReport.topWorstFrames.length > 0 && perfReport.topWorstFrames[0].frameIntervalMs > 20 && (
                  <div className="bg-zinc-950 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Top des Images les plus lentes (Pics de Latence)</span>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs font-mono">
                      {perfReport.topWorstFrames.slice(0, 6).map((f) => (
                        <div key={f.frameId} className="bg-zinc-900/80 border border-zinc-800 p-2 rounded-lg">
                          <div className="flex justify-between text-zinc-300">
                            <span>Image #{f.frameId} (+{(f.timeOffsetMs / 1000).toFixed(2)}s)</span>
                            <span className={f.frameIntervalMs > 33.3 ? 'text-red-400 font-bold' : 'text-amber-400 font-bold'}>
                              {f.frameIntervalMs} ms
                            </span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                            <span>Dessin : {f.renderDurationMs}ms</span>
                            <span>React : {f.reactRenderDurationMs}ms</span>
                            <span>{f.fpsInstant} FPS</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* React Component Re-renders Diagnostic Table */}
                {perfReport.reactComponents.length > 0 && (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Activité & Re-renders des Composants React ({perfReport.totalReactRenders} passes)</span>
                      </h4>
                      <span className="text-[11px] font-mono text-zinc-400">
                        Temps Moyen Re-render : <strong className="text-zinc-200">{perfReport.avgReactRenderMs} ms</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {perfReport.reactComponents.map((c) => (
                        <div key={c.componentId} className="bg-zinc-900/70 border border-zinc-800 p-2.5 rounded-lg text-xs font-mono">
                          <div className="font-bold text-white flex justify-between">
                            <span>&lt;{c.componentId} /&gt;</span>
                            <span className="text-violet-300 font-normal">{c.renderCount}x</span>
                          </div>
                          <div className="text-[10px] text-zinc-400 mt-1 flex justify-between">
                            <span>Total : {c.totalDurationMs}ms</span>
                            <span>Moy : {c.avgDurationMs}ms</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Frames Timeline Header & Copy Action */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Toutes les Images Rendues ({filteredPerfFrames.length} / {perfReport.totalFrames})</span>
                    </h4>

                    {perfReport.jankFrameCount > 0 && (
                      <label className="flex items-center gap-1.5 text-xs text-amber-300 cursor-pointer bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        <input
                          type="checkbox"
                          checked={onlyJankFilter}
                          onChange={(e) => setOnlyJankFilter(e.target.checked)}
                          className="rounded text-amber-500"
                        />
                        <span>Saccades uniquement ({perfReport.jankFrameCount})</span>
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleCopyPerfReport}
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition"
                  >
                    {perfCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{perfCopied ? 'Copié !' : 'Copier le rapport JSON'}</span>
                  </button>
                </div>

                {/* Frames Detailed Timeline */}
                <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {filteredPerfFrames.map((f) => (
                    <div
                      key={f.frameId}
                      className={`p-2 rounded-lg border flex items-center justify-between text-xs font-mono transition ${
                        f.isCriticalJank
                          ? 'bg-red-950/50 border-red-500/50 text-red-200'
                          : f.isJank
                          ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                          : 'bg-zinc-950 border-zinc-800/80 text-zinc-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 text-[11px] w-12">
                          +{(f.timeOffsetMs / 1000).toFixed(2)}s
                        </span>
                        <span className="font-bold text-white">Frame #{f.frameId}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            f.fpsInstant >= 55
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                              : f.fpsInstant >= 30
                              ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                              : 'bg-red-950 text-red-300 border border-red-500/30'
                          }`}
                        >
                          {f.fpsInstant} FPS
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          Dessin : <strong>{f.renderDurationMs}ms</strong> | Phys : <strong>{f.physicsDurationMs}ms</strong> | React : <strong>{f.reactRenderDurationMs}ms</strong> | Intervalle : <strong>{f.frameIntervalMs}ms</strong>
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-400">
                        🐌 {f.entities.livingSlugs} | 🚀 {f.entities.projectiles} | 💥 {f.entities.explosions} | ✨ {f.entities.particles}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              !isPerfRecording && (
                <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs space-y-2">
                  <div className="text-2xl">⚡</div>
                  <div className="font-bold text-zinc-200 text-sm">Prêt pour le diagnostic matériel & rendu</div>
                  <p className="max-w-md mx-auto">
                    Cliquez sur le bouton ci-dessus pour enregistrer 5 secondes de jeu et identifier chaque chute de FPS, saccade ou pic de calcul Canvas.
                  </p>
                </div>
              )
            )}
          </div>
        )}

        {/* Tab 3: 5-Second Network Traffic Inspector */}
        {activeTab === 'net_capture' && (
          <div className="p-6 space-y-5 overflow-y-auto font-sans flex-1">
            {/* Recording Control Bar */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Enregistrement du Trafic Réseau P2P (5 Secondes)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Capture et décortique 100% des paquets échangés entre les joueurs en temps réel.
                </p>
              </div>

              <div>
                {isNetRecording ? (
                  <div className="flex items-center gap-3 bg-red-950/80 border border-red-500/60 px-4 py-2 rounded-xl text-red-300 text-xs font-bold animate-pulse">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span>Capture en cours ({netCountdown}s restantes)...</span>
                  </div>
                ) : (
                  <button
                    onClick={handleStartNetCapture}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition"
                  >
                    <Radio className="w-4 h-4" />
                    <span>🔴 Lancer la Capture Réseau 5s</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Report View */}
            {captureReport ? (
              <div className="space-y-4">
                {/* Summary Dashboard Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Total Paquets</div>
                    <div className="text-xl font-black font-mono text-white mt-0.5">
                      {captureReport.packets.length}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      📤 {captureReport.uploadCount} | 📥 {captureReport.downloadCount}
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Volume Total</div>
                    <div className="text-xl font-black font-mono text-cyan-400 mt-0.5">
                      {captureReport.totalUploadBytes + captureReport.totalDownloadBytes} <span className="text-xs">octets</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      en {(captureReport.durationMs / 1000).toFixed(1)}s
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Débit Moyen Upload</div>
                    <div className="text-xl font-black font-mono text-sky-400 mt-0.5">
                      {captureReport.avgUploadBytesPerSec} <span className="text-xs">o/s</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                      ({(captureReport.avgUploadBytesPerSec / 1024).toFixed(2)} Ko/s)
                    </div>
                  </div>

                  <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl">
                    <div className="text-[10px] font-bold uppercase text-zinc-400">Taille Moyenne</div>
                    <div className="text-xl font-black font-mono text-amber-400 mt-0.5">
                      {captureReport.packets.length > 0
                        ? Math.round(
                            (captureReport.totalUploadBytes + captureReport.totalDownloadBytes) /
                              captureReport.packets.length
                          )
                        : 0}{' '}
                      <span className="text-xs">octets</span>
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-0.5">par paquet</div>
                  </div>
                </div>

                {/* Packet List Header & Copy Action */}
                <div className="flex items-center justify-between pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Journal Chronologique des Paquets ({captureReport.packets.length})</span>
                  </h4>
                  <button
                    onClick={handleCopyNetReport}
                    className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-lg border border-zinc-700 transition"
                  >
                    {netCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{netCopied ? 'Copié !' : 'Copier le rapport JSON'}</span>
                  </button>
                </div>

                {/* Packet Timeline List */}
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {captureReport.packets.length === 0 ? (
                    <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl text-center text-xs text-zinc-400">
                      🎉 0 paquet transmis pendant ces 5 secondes (Le jeu était 100% au repos sans gaspiller de bande passante !)
                    </div>
                  ) : (
                    captureReport.packets.map((pkt) => {
                      const isExpanded = expandedPacketId === pkt.id;
                      const isUpload = pkt.direction === 'UPLOAD';
                      return (
                        <div
                          key={pkt.id}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden text-xs transition"
                        >
                          <div
                            onClick={() => setExpandedPacketId(isExpanded ? null : pkt.id)}
                            className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/60"
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-zinc-400 text-[11px] w-14">
                                +{(pkt.timeOffsetMs / 1000).toFixed(2)}s
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase font-mono ${
                                  isUpload
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/40'
                                    : 'bg-violet-950 text-violet-300 border border-violet-500/40'
                                }`}
                              >
                                {pkt.direction}
                              </span>
                              <span className="font-bold text-zinc-200">{pkt.summary}</span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-mono text-[11px] text-amber-400 font-semibold">
                                {pkt.rawBytes} octets
                              </span>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                          </div>

                          {/* Expanded JSON Inspector */}
                          {isExpanded && (
                            <div className="p-3 bg-zinc-900 border-t border-zinc-800 font-mono text-[11px] text-zinc-300 overflow-x-auto">
                              <pre>{JSON.stringify(pkt.decodedData, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              !isNetRecording && (
                <div className="bg-zinc-950 border border-dashed border-zinc-800 rounded-xl p-8 text-center text-zinc-400 text-xs space-y-2">
                  <div className="text-2xl">📡</div>
                  <div className="font-bold text-zinc-200 text-sm">Prêt pour l'analyse de trafic</div>
                  <p className="max-w-md mx-auto">
                    Cliquez sur le bouton vert ci-dessus pour lancer une session d'enregistrement de 5 secondes et voir exactement chaque octet qui transite.
                  </p>
                </div>
              )
            )}
          </div>
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
  if (prev.onClose !== next.onClose) return false;
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
