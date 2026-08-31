import React from 'react';
import { Slug } from '../../../core/types';
import { WeaponDefinition } from '../../../core/weapons/types';
import { sfx } from '../../../core/audio';

interface BoardFuseTimerWidgetProps {
  activeSlug: Slug | undefined;
  activeWeapon: WeaponDefinition | null;
  phase: string;
  isMyTurn: boolean;
  onSetFuseTimer?: (seconds: number) => void;
}

export const BoardFuseTimerWidget: React.FC<BoardFuseTimerWidgetProps> = React.memo(({
  activeSlug,
  activeWeapon,
  phase,
  isMyTurn,
  onSetFuseTimer,
}) => {
  if (!activeWeapon?.allowCustomFuse || (phase !== 'AIMING' && phase !== 'TURN_TIME')) {
    return null;
  }

  const isMagnet = activeWeapon.id === 'magnet';
  const currentFuse =
    activeSlug?.fuseTimerSec ?? (activeWeapon.fuseTimeMs ? Math.round(activeWeapon.fuseTimeMs / 1000) : 3);

  return (
    <div className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-zinc-950/92 backdrop-blur-md px-3.5 py-1.5 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] transition-all animate-in fade-in slide-in-from-bottom-2 duration-200 border ${
      isMagnet ? 'border-sky-500/60 shadow-[0_0_20px_rgba(14,165,233,0.25)]' : 'border-amber-500/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
    }`}>
      <div className="flex items-center gap-1.5 pr-2.5 border-r border-zinc-800">
        <span className="text-base animate-pulse">{isMagnet ? '🧲' : '⏱️'}</span>
        <div className="flex flex-col leading-none">
          <span className={`font-black text-xs tracking-tight ${isMagnet ? 'text-sky-300' : 'text-amber-300'}`}>
            {isMagnet ? 'POLARITÉ AIMANT' : 'MÈCHE DÉTONATION'}
          </span>
          <span className="font-mono text-[9px] text-zinc-400">
            {isMagnet ? 'Touches [1] ou [2]' : 'Touches [1 à 5]'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {isMagnet ? (
          <>
            <button
              type="button"
              disabled={!isMyTurn}
              onClick={() => {
                onSetFuseTimer?.(1);
                sfx.play('tick');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                currentFuse !== 2
                  ? 'bg-blue-600 text-white border-2 border-blue-300 shadow-[0_0_12px_#3b82f6] scale-105 font-black'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 active:scale-95'
              }`}
              title="Attirer les projectiles (Touche 1)"
            >
              <span>🧲 Attirer</span>
              <span className="text-[10px] opacity-70">[1]</span>
            </button>

            <button
              type="button"
              disabled={!isMyTurn}
              onClick={() => {
                onSetFuseTimer?.(2);
                sfx.play('tick');
              }}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                currentFuse === 2
                  ? 'bg-red-600 text-white border-2 border-red-300 shadow-[0_0_12px_#ef4444] scale-105 font-black'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 active:scale-95'
              }`}
              title="Repousser les projectiles (Touche 2)"
            >
              <span>⚡ Repousser</span>
              <span className="text-[10px] opacity-70">[2]</span>
            </button>
          </>
        ) : (
          [1, 2, 3, 4, 5].map((sec) => {
            const isSelected = currentFuse === sec;
            return (
              <button
                key={sec}
                disabled={!isMyTurn}
                onClick={() => {
                  onSetFuseTimer?.(sec);
                  sfx.play('tick');
                }}
                className={`relative w-8 h-8 rounded-xl font-mono font-black text-xs flex flex-col items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-400 to-amber-500 text-black shadow-[0_0_14px_#f59e0b] scale-110 ring-2 ring-amber-300 font-black'
                    : isMyTurn
                    ? 'bg-zinc-900/90 hover:bg-zinc-800 text-amber-400/90 border border-amber-900/60 hover:border-amber-500 hover:scale-105 active:scale-95'
                    : 'bg-zinc-900/60 text-zinc-600 opacity-40 cursor-not-allowed border border-zinc-800'
                }`}
                title={`Régler la mèche à ${sec} seconde${sec > 1 ? 's' : ''} (Touche ${sec})`}
              >
                <span>{sec}s</span>
                <span className={`text-[8px] leading-none ${isSelected ? 'text-zinc-950 font-bold' : 'text-zinc-500'}`}>
                  [{sec}]
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}, (prev, next) => {
  return (
    prev.isMyTurn === next.isMyTurn &&
    prev.phase === next.phase &&
    prev.activeSlug?.id === next.activeSlug?.id &&
    prev.activeSlug?.fuseTimerSec === next.activeSlug?.fuseTimerSec &&
    prev.activeSlug?.selectedWeaponId === next.activeSlug?.selectedWeaponId &&
    prev.activeWeapon?.id === next.activeWeapon?.id &&
    prev.onSetFuseTimer === next.onSetFuseTimer
  );
});
