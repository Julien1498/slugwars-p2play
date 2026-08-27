import React from 'react';
import { Vector2D } from '../../../core/types';
import { triggerHaptic } from './touchControlsUtils';

interface PlacementTouchBarProps {
  pendingPlacement?: Vector2D | null;
  onConfirmPlacement?: () => void;
}

export const PlacementTouchBar: React.FC<PlacementTouchBarProps> = ({
  pendingPlacement,
  onConfirmPlacement,
}) => {
  return (
    <div className="w-full flex justify-center pb-2 pointer-events-auto">
      {pendingPlacement ? (
        <button
          type="button"
          onClick={() => {
            triggerHaptic(20);
            onConfirmPlacement?.();
          }}
          className="px-4 py-2 rounded-xl bg-emerald-600/95 active:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm shadow-xl backdrop-blur-md flex items-center gap-1.5 active:scale-95 transition-transform cursor-pointer"
        >
          <span>✔️</span>
          <span>Confirmer le placement</span>
        </button>
      ) : (
        <div className="px-4 py-1.5 rounded-full bg-slate-900/80 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow backdrop-blur-md flex items-center gap-1.5">
          <span>📍</span>
          <span>Touchez le terrain pour positionner votre limace</span>
        </div>
      )}
    </div>
  );
};
