import React from 'react';
import { Slug } from '../../../core/types';
import { WeaponDefinition } from '../../../core/weapons/types';

interface MobileFuseSelectorProps {
  currentWeapon: WeaponDefinition | null;
  activeSlug: Slug | undefined;
  onSetFuseTimer?: (seconds: number) => void;
  triggerHaptic: (ms: number) => void;
}

export const MobileFuseSelector: React.FC<MobileFuseSelectorProps> = React.memo(({
  currentWeapon,
  activeSlug,
  onSetFuseTimer,
  triggerHaptic,
}) => {
  if (!currentWeapon?.allowCustomFuse) return null;

  if (currentWeapon.id === 'magnet') {
    const isRepel = (activeSlug?.fuseTimerSec ?? 1) === 2;
    return (
      <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
        <span className="text-xs font-bold text-sky-400 px-1">🧲</span>
        <button
          type="button"
          className={`px-2.5 h-8 rounded-lg font-black text-xs flex items-center gap-1 border transition-all ${
            !isRepel
              ? 'bg-blue-600 text-white border-blue-300 font-black shadow-[0_0_10px_#3b82f6] scale-105'
              : 'bg-slate-950/80 text-slate-300 border-slate-800'
          }`}
          onClick={() => {
            triggerHaptic(15);
            onSetFuseTimer?.(1);
          }}
        >
          Attirer
        </button>
        <button
          type="button"
          className={`px-2.5 h-8 rounded-lg font-black text-xs flex items-center gap-1 border transition-all ${
            isRepel
              ? 'bg-red-600 text-white border-red-300 font-black shadow-[0_0_10px_#ef4444] scale-105'
              : 'bg-slate-950/80 text-slate-300 border-slate-800'
          }`}
          onClick={() => {
            triggerHaptic(15);
            onSetFuseTimer?.(2);
          }}
        >
          Repousser
        </button>
      </div>
    );
  }

  const currentFuse =
    activeSlug?.fuseTimerSec ?? (currentWeapon.fuseTimeMs ? Math.round(currentWeapon.fuseTimeMs / 1000) : 3);

  return (
    <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
      <span className="text-xs font-bold text-amber-400 px-1">⏱️</span>
      {[1, 2, 3, 4, 5].map((sec) => {
        const isSelected = currentFuse === sec;
        return (
          <button
            key={sec}
            type="button"
            className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center border transition-all ${
              isSelected
                ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-[0_0_10px_#f59e0b] scale-105'
                : 'bg-slate-950/80 text-slate-300 border-slate-800 active:bg-amber-500 active:text-slate-950'
            }`}
            onClick={() => {
              triggerHaptic(15);
              onSetFuseTimer?.(sec);
            }}
          >
            {sec}s
          </button>
        );
      })}
    </div>
  );
});
