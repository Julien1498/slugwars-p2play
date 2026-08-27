import React from 'react';
import { Slug, ActiveProjectile, HelicopterVehicle } from '../../../core/types';
import { triggerHaptic } from './touchControlsUtils';

interface LeftThumbClusterProps {
  isMyTurn: boolean;
  activeSlug?: Slug;
  activeSheep?: ActiveProjectile;
  nearbyHeli?: HelicopterVehicle | null;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onExitVehicle?: () => void;
  onEnterVehicle?: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onDetonate?: () => void;
}

export const LeftThumbCluster: React.FC<LeftThumbClusterProps> = ({
  isMyTurn,
  activeSlug,
  activeSheep,
  nearbyHeli,
  onStartMove,
  onStopMove,
  onJump,
  onSteerVehicle,
  onExitVehicle,
  onEnterVehicle,
  onStartSteer,
  onStopSteer,
  onDetonate,
}) => {
  const inVehicle = !!activeSlug?.inVehicleId;

  if (activeSheep) {
    return (
      <div className="pointer-events-auto flex items-end gap-2">
        <div className="flex flex-col portrait:items-start landscape:flex-row landscape:items-center gap-2">
          <div className="portrait:order-first landscape:order-last">
            <button
              type="button"
              className="w-[74px] h-[74px] rounded-2xl bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
              onClick={() => {
                triggerHaptic(30);
                onDetonate?.();
              }}
            >
              💥
            </button>
          </div>
          <div className="flex items-center gap-2 landscape:order-first">
            <button
              type="button"
              className="w-[74px] h-[74px] rounded-2xl bg-slate-900/90 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-4xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform"
              onPointerDown={(e) => {
                e.preventDefault();
                triggerHaptic();
                onStartSteer?.('left');
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onStopSteer?.();
              }}
              onPointerCancel={() => onStopSteer?.()}
            >
              ◀
            </button>
            <button
              type="button"
              className="w-[74px] h-[74px] rounded-2xl bg-slate-900/90 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-4xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform"
              onPointerDown={(e) => {
                e.preventDefault();
                triggerHaptic();
                onStartSteer?.('right');
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                onStopSteer?.();
              }}
              onPointerCancel={() => onStopSteer?.()}
            >
              ▶
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (inVehicle) {
    return (
      <div className="pointer-events-auto flex items-end gap-2">
        <div className="grid grid-cols-3 gap-1.5 items-center justify-items-center">
          <div />
          <button
            type="button"
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-amber-600 border-2 border-slate-700 active:border-amber-400 text-white font-bold text-3xl flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95 transition-transform"
            onClick={() => {
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onSteerVehicle?.('up');
            }}
          >
            ▲
          </button>
          <div />

          <button
            type="button"
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-amber-600 border-2 border-slate-700 active:border-amber-400 text-white font-bold text-3xl flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95 transition-transform"
            onClick={() => {
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onSteerVehicle?.('left');
            }}
          >
            ◀
          </button>
          <button
            type="button"
            className="w-14 h-14 rounded-2xl bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-black text-xs flex items-center justify-center shadow-xl uppercase active:scale-95 transition-transform"
            onClick={() => {
              triggerHaptic(30);
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onExitVehicle?.();
            }}
          >
            Sortir
          </button>
          <button
            type="button"
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-amber-600 border-2 border-slate-700 active:border-amber-400 text-white font-bold text-3xl flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95 transition-transform"
            onClick={() => {
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onSteerVehicle?.('right');
            }}
          >
            ▶
          </button>

          <div />
          <button
            type="button"
            className="w-14 h-14 rounded-2xl bg-slate-900/90 active:bg-amber-600 border-2 border-slate-700 active:border-amber-400 text-white font-bold text-3xl flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95 transition-transform"
            onClick={() => {
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onSteerVehicle?.('down');
            }}
          >
            ▼
          </button>
          <div />
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto flex items-end gap-2">
      <div className="flex flex-col portrait:items-start landscape:flex-row landscape:items-center gap-2">
        <div className="flex items-center gap-2 landscape:order-2 portrait:order-first">
          <button
            type="button"
            disabled={!isMyTurn}
            className="w-[74px] h-[74px] rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 active:from-emerald-700 active:to-teal-600 border-2 border-emerald-400 text-white font-black text-3xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform disabled:opacity-40"
            onClick={() => {
              if (!isMyTurn) return;
              triggerHaptic(20);
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onJump();
            }}
            title="Sauter"
          >
            🦘
          </button>

          {nearbyHeli && (
            <button
              type="button"
              className="w-[74px] h-[74px] rounded-2xl bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white font-black text-2xl flex items-center justify-center shadow-2xl active:scale-95 transition-transform animate-pulse"
              onClick={() => {
                triggerHaptic(30);
                try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
                onEnterVehicle?.();
              }}
              title="Monter dans l'hélicoptère"
            >
              🚁
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 landscape:order-1">
          <button
            type="button"
            disabled={!isMyTurn}
            className="w-[74px] h-[74px] rounded-2xl bg-slate-900/90 active:bg-blue-600 border-2 border-slate-700/90 active:border-blue-400 text-white font-bold text-4xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform disabled:opacity-40"
            onPointerDown={(e) => {
              e.preventDefault();
              if (!isMyTurn) return;
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onStartMove('left');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onStopMove();
            }}
            onPointerCancel={() => onStopMove()}
          >
            ◀
          </button>

          <button
            type="button"
            disabled={!isMyTurn}
            className="w-[74px] h-[74px] rounded-2xl bg-slate-900/90 active:bg-blue-600 border-2 border-slate-700/90 active:border-blue-400 text-white font-bold text-4xl flex items-center justify-center shadow-2xl backdrop-blur-md active:scale-95 transition-transform disabled:opacity-40"
            onPointerDown={(e) => {
              e.preventDefault();
              if (!isMyTurn) return;
              triggerHaptic();
              try { window.dispatchEvent(new CustomEvent('slugwars:recenter-camera')); } catch {}
              onStartMove('right');
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onStopMove();
            }}
            onPointerCancel={() => onStopMove()}
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};
