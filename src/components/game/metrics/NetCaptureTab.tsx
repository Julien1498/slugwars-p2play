import React, { useState } from 'react';
import { TrafficCaptureReport } from '../../../core/networkMetrics';
import { Radio, FileText, Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';

interface NetCaptureTabProps {
  captureReport: TrafficCaptureReport | null;
  isNetRecording: boolean;
  netCountdown: number;
  onStartNetCapture: () => void;
  onCopyNetReport: () => void;
  netCopied: boolean;
}

export const NetCaptureTab: React.FC<NetCaptureTabProps> = ({
  captureReport,
  isNetRecording,
  netCountdown,
  onStartNetCapture,
  onCopyNetReport,
  netCopied,
}) => {
  const [expandedPacketId, setExpandedPacketId] = useState<number | null>(null);

  return (
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
              onClick={onStartNetCapture}
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

          {/* Packet List Header */}
          <div className="flex items-center justify-between pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              <span>Journal Chronologique des Paquets ({captureReport.packets.length})</span>
            </h4>
            <button
              onClick={onCopyNetReport}
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
  );
};
