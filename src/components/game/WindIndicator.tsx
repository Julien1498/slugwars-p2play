import React from 'react';
import { Wind } from 'lucide-react';

interface WindIndicatorProps {
  wind: number; // -5 to +5
}

export const WindIndicator: React.FC<WindIndicatorProps> = ({ wind }) => {
  const isLeft = wind < 0;
  const absWind = Math.abs(wind);

  return (
    <div className="flex items-center gap-2 bg-zinc-900/90 border border-zinc-800 px-3 py-1.5 rounded-lg text-xs">
      <Wind className="w-4 h-4 text-sky-400" />
      <span className="font-semibold text-zinc-300">Vent:</span>
      <div className="flex items-center gap-1 w-24">
        {/* Left Indicator */}
        <div className="flex-1 flex justify-end gap-0.5">
          {isLeft &&
            Array.from({ length: absWind }).map((_, i) => (
              <span key={i} className="w-1.5 h-3 bg-sky-400 rounded-sm" />
            ))}
        </div>
        <div className="w-1 h-4 bg-zinc-600 rounded-full" />
        {/* Right Indicator */}
        <div className="flex-1 flex justify-start gap-0.5">
          {!isLeft &&
            Array.from({ length: absWind }).map((_, i) => (
              <span key={i} className="w-1.5 h-3 bg-sky-400 rounded-sm" />
            ))}
        </div>
      </div>
    </div>
  );
};
