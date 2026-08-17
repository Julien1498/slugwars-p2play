import React from 'react';
import { Wind, ArrowLeft, ArrowRight, Minus } from 'lucide-react';

interface WindIndicatorProps {
  wind: number; // -5 to +5
}

export const WindIndicatorComponent: React.FC<WindIndicatorProps> = ({ wind }) => {
  const isLeft = wind < -0.05;
  const isRight = wind > 0.05;
  const absWind = Math.abs(wind);
  const intensity = Math.min(5, Math.round(absWind));

  // Determine wind intensity color theme
  const getWindColor = () => {
    if (absWind < 1.0) return 'text-zinc-400 border-zinc-700/50';
    if (absWind < 2.5) return 'text-cyan-400 border-cyan-500/40';
    if (absWind < 4.0) return 'text-sky-400 border-sky-500/50';
    return 'text-amber-400 border-amber-500/60';
  };

  return (
    <div
      className={`flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md border px-2 py-0.5 rounded-lg shadow transition-all ${getWindColor()}`}
      title={`Vent: ${wind < 0 ? 'Ouest ◄' : wind > 0 ? 'Est ►' : 'Calme'} (${absWind.toFixed(1)} m/s)`}
    >
      <div className="flex items-center gap-1">
        <Wind className="w-3 h-3 text-cyan-400 animate-pulse" />
        <span className="font-mono font-black text-[11px] text-zinc-100">
          {absWind.toFixed(1)} <span className="text-[9px] text-zinc-400 font-semibold">m/s</span>
        </span>
      </div>

      {/* Segmented Cyber Wind Meter */}
      <div className="flex items-center gap-1 w-20 px-1 py-0.5 bg-zinc-900/90 rounded-lg border border-zinc-800">
        {/* Left Indicator Bars */}
        <div className="flex-1 flex justify-end gap-0.5 items-center">
          {isLeft ? (
            Array.from({ length: 5 }).map((_, i) => {
              const active = 4 - i < intensity;
              return (
                <span
                  key={i}
                  className={`w-1 rounded-sm transition-all ${
                    active
                      ? 'h-3 bg-gradient-to-t from-cyan-500 to-sky-300 shadow-[0_0_6px_#06b6d4]'
                      : 'h-1.5 bg-zinc-800'
                  }`}
                />
              );
            })
          ) : (
            <span className="w-full h-1 bg-zinc-800/60 rounded" />
          )}
        </div>

        {/* Center Origin Pin */}
        <div className="w-1 h-3.5 bg-zinc-500 rounded-full shrink-0" />

        {/* Right Indicator Bars */}
        <div className="flex-1 flex justify-start gap-0.5 items-center">
          {isRight ? (
            Array.from({ length: 5 }).map((_, i) => {
              const active = i < intensity;
              return (
                <span
                  key={i}
                  className={`w-1 rounded-sm transition-all ${
                    active
                      ? 'h-3 bg-gradient-to-t from-cyan-500 to-sky-300 shadow-[0_0_6px_#06b6d4]'
                      : 'h-1.5 bg-zinc-800'
                  }`}
                />
              );
            })
          ) : (
            <span className="w-full h-1 bg-zinc-800/60 rounded" />
          )}
        </div>
      </div>

      {/* Dynamic Direction Arrow */}
      <div className="shrink-0 flex items-center justify-center w-4 h-4 rounded-md bg-zinc-900 border border-zinc-800">
        {isLeft ? (
          <ArrowLeft className="w-3 h-3 text-cyan-400 animate-pulse" />
        ) : isRight ? (
          <ArrowRight className="w-3 h-3 text-cyan-400 animate-pulse" />
        ) : (
          <Minus className="w-3 h-3 text-zinc-500" />
        )}
      </div>
    </div>
  );
};

export const WindIndicator = React.memo(WindIndicatorComponent);
