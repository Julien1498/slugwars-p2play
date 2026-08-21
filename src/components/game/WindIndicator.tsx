import React from 'react';
import { Wind, ChevronLeft, ChevronRight, Minus } from 'lucide-react';

interface WindIndicatorProps {
  wind: number; // -5 to +5
}

export const WindIndicatorComponent: React.FC<WindIndicatorProps> = ({ wind }) => {
  const isLeft = wind < -0.05;
  const isRight = wind > 0.05;
  const absWind = Math.abs(wind);
  const roundedAbs = Math.round(absWind * 10) / 10;
  const percent = Math.min(100, (absWind / 5) * 100);

  // Dynamic theme based on intensity
  const getTheme = () => {
    if (absWind < 0.2) {
      return {
        badgeBg: 'bg-zinc-900/90 text-zinc-400 border-zinc-700/50',
        glow: 'border-zinc-800',
        barGradient: 'from-zinc-600 to-zinc-500',
        textColor: 'text-zinc-400',
        iconColor: 'text-zinc-500',
        label: 'Calme',
      };
    }
    if (absWind < 2.0) {
      return {
        badgeBg: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
        glow: 'border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.15)]',
        barGradient: 'from-cyan-500 to-sky-400 shadow-[0_0_8px_#06b6d4]',
        textColor: 'text-cyan-300',
        iconColor: 'text-cyan-400',
        label: isLeft ? 'Brise Ouest' : 'Brise Est',
      };
    }
    if (absWind < 3.8) {
      return {
        badgeBg: 'bg-sky-950/90 text-sky-300 border-sky-500/50',
        glow: 'border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.25)]',
        barGradient: 'from-sky-500 to-indigo-400 shadow-[0_0_10px_#0ea5e9]',
        textColor: 'text-sky-200',
        iconColor: 'text-sky-400',
        label: isLeft ? 'Vent Ouest' : 'Vent Est',
      };
    }
    return {
      badgeBg: 'bg-amber-950/90 text-amber-300 border-amber-500/60',
      glow: 'border-amber-500/50 shadow-[0_0_18px_rgba(245,158,11,0.3)]',
      barGradient: 'from-amber-500 via-orange-500 to-red-500 shadow-[0_0_12px_#f59e0b]',
      textColor: 'text-amber-200',
      iconColor: 'text-amber-400',
      label: isLeft ? 'Bourrasque Ouest' : 'Bourrasque Est',
    };
  };

  const theme = getTheme();

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1 rounded-xl bg-zinc-950/80 backdrop-blur-xl border transition-all duration-300 ${theme.glow}`}
      title={`Vent: ${theme.label} (${roundedAbs} m/s)`}
    >
      {/* Icon & Value */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Wind className={`w-3.5 h-3.5 transition-transform duration-300 ${theme.iconColor} ${absWind > 2 ? 'animate-pulse' : ''}`} />
        <span className="font-mono text-xs font-black text-white">
          {roundedAbs.toFixed(1)} <span className="text-[9px] text-zinc-400 font-semibold">m/s</span>
        </span>
      </div>

      {/* Aerodynamic Wind Vane Tube */}
      <div className="relative flex items-center w-28 sm:w-32 h-4 bg-zinc-900/90 rounded-full border border-zinc-800 overflow-hidden px-1">
        {/* Animated Background Wind Grid Marks */}
        <div className="absolute inset-0 flex justify-between px-2 items-center pointer-events-none opacity-20">
          <span className="w-px h-2 bg-zinc-400" />
          <span className="w-px h-1 bg-zinc-400" />
          <span className="w-px h-1 bg-zinc-400" />
          <span className="w-px h-2 bg-zinc-400" />
          <span className="w-px h-1 bg-zinc-400" />
          <span className="w-px h-1 bg-zinc-400" />
          <span className="w-px h-2 bg-zinc-400" />
        </div>

        {/* Center Neutral Zero Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-600/80 -translate-x-1/2 z-10" />

        {/* Left Wind Flow Bar */}
        <div className="absolute right-1/2 top-0.5 bottom-0.5 left-1 flex items-center justify-end overflow-hidden">
          {isLeft && (
            <div
              className={`h-full rounded-l-full bg-gradient-to-l ${theme.barGradient} transition-all duration-300 flex items-center justify-start pl-1`}
              style={{ width: `${percent}%` }}
            >
              {absWind >= 1.5 && (
                <div className="flex items-center text-[10px] text-slate-950 font-black animate-pulse">
                  «
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Wind Flow Bar */}
        <div className="absolute left-1/2 top-0.5 bottom-0.5 right-1 flex items-center justify-start overflow-hidden">
          {isRight && (
            <div
              className={`h-full rounded-r-full bg-gradient-to-r ${theme.barGradient} transition-all duration-300 flex items-center justify-end pr-1`}
              style={{ width: `${percent}%` }}
            >
              {absWind >= 1.5 && (
                <div className="flex items-center text-[10px] text-slate-950 font-black animate-pulse">
                  »
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Arrow Badge */}
      <div
        className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-black border flex items-center justify-center shrink-0 ${theme.badgeBg}`}
      >
        {isLeft ? (
          <span className="flex items-center">
            <ChevronLeft className="w-3 h-3 -mr-1" />
            <ChevronLeft className="w-3 h-3" />
          </span>
        ) : isRight ? (
          <span className="flex items-center">
            <ChevronRight className="w-3 h-3" />
            <ChevronRight className="w-3 h-3 -ml-1" />
          </span>
        ) : (
          <Minus className="w-3 h-3 text-zinc-500" />
        )}
      </div>
    </div>
  );
};

export const WindIndicator = React.memo(WindIndicatorComponent);
