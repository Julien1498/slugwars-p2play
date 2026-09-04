import React, { useState } from 'react';
import { Microscope, Copy, Check, TrendingUp, AlertTriangle } from 'lucide-react';
import { IsolateBenchmarkReport } from '../../../../core/perfTracker';

interface IsolateReportCardProps {
  report: IsolateBenchmarkReport;
}

export const IsolateReportCard: React.FC<IsolateReportCardProps> = ({ report }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topCulprit = report.culpritRanking[0];

  return (
    <div className="bg-zinc-950 border-2 border-indigo-500/40 rounded-2xl p-5 space-y-4 shadow-xl shadow-indigo-950/20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Microscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Rapport d'Isolation Matériel GPU</span>
              <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-full">
                Séquence Automatisée
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Mesure scientifique du coût GPU réel par désactivation séquentielle
            </p>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg text-xs font-bold transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copié !' : 'Copier JSON'}</span>
        </button>
      </div>

      {/* Summary Verdict Banner */}
      {topCulprit && topCulprit.savedMs > 0 ? (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold text-amber-300">
              Goulot d'étranglement n°1 identifié : {topCulprit.label}
            </span>
            <p className="text-zinc-300 mt-0.5">
              Couper ce composant libère <strong className="text-emerald-400">+{report.steps.find(s => s.target === topCulprit.target)?.deltaFps} FPS</strong> ({topCulprit.savedMs} ms de raster GPU récupérées).
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3.5 text-xs text-zinc-300">
          Toutes les couches graphiques ont une consommation équilibrée par rapport à la référence.
        </div>
      )}

      {/* Baseline Metric */}
      <div className="flex items-center justify-between bg-zinc-900/80 px-4 py-2.5 rounded-xl text-xs border border-zinc-800/80">
        <span className="font-bold text-zinc-300">Référence (Tous composants actifs) :</span>
        <div className="flex items-center gap-3">
          <span className="font-black text-amber-400">{report.baseline.avgFps} FPS</span>
          <span className="text-zinc-500">•</span>
          <span className="text-zinc-400">{report.baseline.avgFrameMs} ms/frame</span>
        </div>
      </div>

      {/* Isolation Steps Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-zinc-500 border-b border-zinc-800 text-[11px]">
              <th className="pb-2 font-bold">Composant Testé</th>
              <th className="pb-2 font-bold text-center">FPS Mesurés</th>
              <th className="pb-2 font-bold text-center">Gain Net</th>
              <th className="pb-2 font-bold text-center">Temps GPU Économisé</th>
              <th className="pb-2 font-bold text-right">Part du Goulot</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {report.steps.slice(1).map((step) => {
              const isAllFour = step.target === 'ALL_FOUR';
              const isTotalBlack = step.target === 'TOTAL_BLACK';
              const isSpecial = isAllFour || isTotalBlack;
              const isTop = !isSpecial && step.target === topCulprit?.target;
              return (
                <tr
                  key={step.target}
                  className={`hover:bg-zinc-900/40 transition ${
                    isTotalBlack
                      ? 'bg-emerald-950/30 border-t-2 border-emerald-500/50 font-bold'
                      : isAllFour
                      ? 'bg-violet-950/30 border-t-2 border-violet-500/40 font-semibold'
                      : isTop
                      ? 'bg-indigo-950/20'
                      : ''
                  }`}
                >
                  <td className="py-2.5 pr-2">
                    <div className="font-extrabold text-zinc-200 flex items-center gap-1.5">
                      {isTotalBlack && <span className="text-emerald-400">🖤</span>}
                      {isAllFour && <span className="text-violet-400">⚡</span>}
                      {isTop && <span className="text-amber-400">★</span>}
                      <span>{step.label}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500">{step.description}</div>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-zinc-300">
                    {step.avgFps} FPS
                  </td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full font-black text-[11px] ${
                      isTotalBlack
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                        : isAllFour
                        ? 'bg-violet-950/90 text-violet-300 border border-violet-500/50'
                        : step.deltaFps > 2
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                        : step.deltaFps > 0
                        ? 'bg-zinc-800 text-zinc-300'
                        : 'text-zinc-500'
                    }`}>
                      {step.deltaFps > 0 ? `+${step.deltaFps} FPS` : `${step.deltaFps} FPS`}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold">
                    {step.savedMs > 0 ? (
                      <span className="text-emerald-400 flex items-center justify-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>-{step.savedMs} ms</span>
                      </span>
                    ) : (
                      <span className="text-zinc-500">0 ms</span>
                    )}
                  </td>
                  <td className="py-2.5 pl-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isTotalBlack
                              ? 'bg-emerald-400'
                              : isAllFour
                              ? 'bg-violet-400'
                              : isTop
                              ? 'bg-indigo-400'
                              : 'bg-zinc-500'
                          }`}
                          style={{ width: `${Math.min(100, step.gpuBottleneckSharePercent)}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-zinc-300 min-w-[36px]">
                        {step.gpuBottleneckSharePercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
