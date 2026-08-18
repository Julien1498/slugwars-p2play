import React, { useCallback, useRef } from 'react';
import { GameState, Slug, ActiveProjectile, Vector2D } from '../../../core/types';
import { getWeapon } from '../../../core/weapons/registry';
import { useIsTouchDevice } from '../../../hooks/useIsTouchDevice';
import { sfx } from '../../../core/audio';
import { MessageSquare } from 'lucide-react';

interface MobileTouchOverlayProps {
  isMyTurn: boolean;
  gameState: GameState;
  activeSlug: Slug | undefined;
  activeSheep: ActiveProjectile | undefined;
  showDrawer?: boolean;
  onToggleDrawer?: () => void;
  chatMessageCount?: number;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right') => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onSetFuseTimer?: (seconds: number) => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onExitVehicle?: () => void;
  onEnterVehicle?: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onDetonate?: () => void;
  setShowWeaponPicker: React.Dispatch<React.SetStateAction<boolean>>;
}

export const MobileTouchOverlay: React.FC<MobileTouchOverlayProps> = ({
  isMyTurn,
  gameState,
  activeSlug,
  activeSheep,
  showDrawer,
  onToggleDrawer,
  chatMessageCount = 0,
  onStartMove,
  onStopMove,
  onJump,
  onUpdateAim,
  onStartCharge,
  onReleaseCharge,
  onSetFuseTimer,
  onSteerVehicle,
  onExitVehicle,
  onEnterVehicle,
  onStartSteer,
  onStopSteer,
  onDetonate,
  setShowWeaponPicker,
}) => {
  const isTouch = useIsTouchDevice();
  const isHoldingFireRef = useRef<boolean>(false);

  const triggerHaptic = useCallback((duration = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignored if haptic unsupported
      }
    }
  }, []);

  if (!isTouch) return null;

  const inVehicle = !!activeSlug?.inVehicleId;
  const isAimingPhase = gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME';
  const isRetreat = gameState.phase === 'RETREAT';
  const currentWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
  const myTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const ammo = currentWeapon && myTeam ? (myTeam.inventory[currentWeapon.id] ?? currentWeapon.defaultAmmo) : -1;
  const ammoLabel = ammo === -1 ? '∞' : `x${ammo}`;

  // Nearby helicopter check
  const nearbyHeli =
    activeSlug && !inVehicle && isAimingPhase
      ? gameState.helicopters?.find(
          (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
        )
      : null;

  const handleAngleChange = (delta: number) => {
    if (!activeSlug || isRetreat) return;
    triggerHaptic(10);
    sfx.play('tick');
    if (activeSlug.selectedWeaponId === 'girder') {
      const angles = [0, 45, 90, 135];
      const curIdx = angles.indexOf(activeSlug.aimAngle);
      const nextIdx = (curIdx + (delta > 0 ? 1 : -1) + angles.length) % angles.length;
      onUpdateAim(angles[nextIdx], activeSlug.aimPower, activeSlug.facing);
    } else {
      const newAngle = Math.max(-85, Math.min(85, activeSlug.aimAngle + delta));
      onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing);
    }
  };

  const handleFirePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isMyTurn || isRetreat) return;
    triggerHaptic(20);
    isHoldingFireRef.current = true;
    onStartCharge?.();
  };

  const handleFirePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    if (!isHoldingFireRef.current) return;
    isHoldingFireRef.current = false;
    triggerHaptic(25);
    onReleaseCharge?.();
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-end justify-between select-none">
      {/* 1. LEFT THUMB CLUSTER (Movement, D-Pad, Jump, Vehicle / Sheep Controls) */}
      <div className="pointer-events-auto flex items-end gap-2">
        {activeSheep ? (
          // Super Sheep flight controls
          <div className="flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-xl p-2.5 rounded-3xl border border-slate-800 shadow-2xl">
            <button
              type="button"
              className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-3xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
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
              className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-3xl flex items-center justify-center shadow-md active:scale-95 transition-transform"
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
            <button
              type="button"
              className="w-16 h-16 rounded-2xl bg-red-600 active:bg-red-500 border-2 border-red-400 text-white font-black text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
              onClick={() => {
                triggerHaptic(40);
                onDetonate?.();
              }}
            >
              💥
            </button>
          </div>
        ) : inVehicle ? (
          // Helicopter directional steering & exit
          <div className="bg-slate-950/90 backdrop-blur-xl p-2.5 rounded-3xl border border-slate-800 shadow-2xl flex flex-col items-center gap-2">
            <button
              type="button"
              className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-white text-xl flex items-center justify-center shadow"
              onClick={() => {
                triggerHaptic();
                onSteerVehicle?.('up');
              }}
            >
              ▲
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-white text-xl flex items-center justify-center shadow"
                onClick={() => {
                  triggerHaptic();
                  onSteerVehicle?.('left');
                }}
              >
                ◀
              </button>
              <button
                type="button"
                className="w-14 h-12 rounded-xl bg-red-600 active:bg-red-500 border border-red-400 text-white font-black text-xs flex items-center justify-center shadow"
                onClick={() => {
                  triggerHaptic(30);
                  onExitVehicle?.();
                }}
              >
                Sortir
              </button>
              <button
                type="button"
                className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-white text-xl flex items-center justify-center shadow"
                onClick={() => {
                  triggerHaptic();
                  onSteerVehicle?.('right');
                }}
              >
                ▶
              </button>
            </div>
            <button
              type="button"
              className="w-14 h-12 rounded-xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-white text-xl flex items-center justify-center shadow"
              onClick={() => {
                triggerHaptic();
                onSteerVehicle?.('down');
              }}
            >
              ▼
            </button>
          </div>
        ) : (
          // Standard Slug D-Pad (Walk & Jump) - Large, comfortable thumb controls
          <div className="flex items-center gap-2 bg-slate-950/90 backdrop-blur-xl p-2 rounded-3xl border border-slate-800 shadow-2xl">
            <button
              type="button"
              disabled={!isMyTurn}
              className="w-15 h-15 rounded-2xl bg-slate-900 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
              onPointerDown={(e) => {
                e.preventDefault();
                if (!isMyTurn) return;
                triggerHaptic();
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
              className="w-15 h-15 rounded-2xl bg-slate-900 active:bg-blue-600 border-2 border-slate-700 active:border-blue-400 text-white font-bold text-3xl flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
              onPointerDown={(e) => {
                e.preventDefault();
                if (!isMyTurn) return;
                triggerHaptic();
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

            <button
              type="button"
              disabled={!isMyTurn}
              className="w-15 h-15 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 active:from-emerald-700 active:to-teal-600 border-2 border-emerald-400 text-white font-black text-2xl flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-40"
              onClick={() => {
                if (!isMyTurn) return;
                triggerHaptic(20);
                onJump();
              }}
            >
              🦘
            </button>

            {nearbyHeli && (
              <button
                type="button"
                className="w-15 h-15 rounded-2xl bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white font-black text-sm flex items-center justify-center shadow-lg active:scale-95 transition-transform animate-pulse"
                onClick={() => {
                  triggerHaptic(30);
                  onEnterVehicle?.();
                }}
              >
                🚁
              </button>
            )}
          </div>
        )}
      </div>

      {/* 2. CENTER CLUSTER (Chat Drawer Toggle) */}
      <div className="pointer-events-auto flex items-center gap-1.5 pb-1">
        {onToggleDrawer && (
          <button
            type="button"
            onClick={() => {
              triggerHaptic(15);
              onToggleDrawer();
            }}
            className={`px-3.5 py-2 rounded-full border text-xs font-black flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all active:scale-95 ${
              showDrawer
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-slate-950/85 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
            {chatMessageCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-violet-600 text-[10px] font-black text-white">
                {chatMessageCount}
              </span>
            )}
          </button>
        )}
      </div>

      {/* 3. RIGHT THUMB CLUSTER (Weapon Card, Fuse/Girder, Fire Button, Angle Nudges) */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Fuse Selector / Girder Rotate Widget */}
        {isMyTurn && !isRetreat && (
          <div className="flex items-center gap-1 bg-slate-950/90 backdrop-blur-xl p-1.5 rounded-2xl border border-slate-800 shadow-xl">
            {currentWeapon?.allowCustomFuse && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400 px-1">⏱️</span>
                {[1, 2, 3, 4, 5].map((sec) => {
                  const currentFuse =
                    activeSlug?.fuseTimerSec ?? (currentWeapon.fuseTimeMs ? Math.round(currentWeapon.fuseTimeMs / 1000) : 3);
                  const isSelected = currentFuse === sec;
                  return (
                    <button
                      key={sec}
                      type="button"
                      className={`w-8 h-8 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-[0_0_10px_#f59e0b] scale-105'
                          : 'bg-slate-900 text-slate-300 border-slate-800 active:bg-amber-500 active:text-slate-950'
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
            )}

            {currentWeapon?.id === 'girder' && (
              <button
                type="button"
                className="px-3 py-1.5 rounded-xl bg-sky-600 active:bg-sky-500 text-white font-black text-xs flex items-center gap-1 border border-sky-400 shadow-md active:scale-95"
                onClick={() => handleAngleChange(45)}
              >
                ↻ 45° ({activeSlug?.aimAngle || 0}°)
              </button>
            )}
          </div>
        )}

        {/* Main Actions Row (Weapon Card + Angle Nudges + Big Fire Button) */}
        <div className="flex items-center gap-2.5 bg-slate-950/90 backdrop-blur-xl p-2 rounded-3xl border border-slate-800 shadow-2xl">
          {/* Equipped Weapon Card (Tap to open Arsenal) */}
          {currentWeapon && isMyTurn && !isRetreat && (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                setShowWeaponPicker((prev) => !prev);
              }}
              className="px-3 py-2 min-h-[58px] rounded-2xl bg-gradient-to-br from-violet-950 to-purple-950/90 border-2 border-violet-500/70 active:border-violet-400 text-left flex items-center gap-2 shadow-lg active:scale-95 transition-transform"
              title="Toucher pour ouvrir l'Arsenal"
            >
              <span className="text-2xl leading-none">{currentWeapon.icon}</span>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-black text-violet-200 truncate max-w-[80px]">
                  {currentWeapon.name}
                </span>
                <span className="text-[10px] font-bold text-violet-400 mt-0.5">
                  {ammoLabel} • 🎒
                </span>
              </div>
            </button>
          )}

          {/* Angle Nudges ▲ / ▼ */}
          {isMyTurn && !isRetreat && currentWeapon?.id !== 'girder' && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="w-11 h-9 rounded-xl bg-slate-900 active:bg-slate-700 border border-slate-800 text-slate-200 font-black text-sm flex items-center justify-center shadow"
                onClick={() => handleAngleChange(3)}
              >
                ▲
              </button>
              <button
                type="button"
                className="w-11 h-9 rounded-xl bg-slate-900 active:bg-slate-700 border border-slate-800 text-slate-200 font-black text-sm flex items-center justify-center shadow"
                onClick={() => handleAngleChange(-3)}
              >
                ▼
              </button>
            </div>
          )}

          {/* Main Fire / Hold-to-Charge Button */}
          {isMyTurn && isAimingPhase && (
            <button
              type="button"
              className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 active:from-red-700 active:to-amber-600 border-2 border-amber-300 text-white font-black flex flex-col items-center justify-center shadow-2xl shadow-red-600/40 active:scale-95 transition-transform"
              onPointerDown={handleFirePointerDown}
              onPointerUp={handleFirePointerUp}
              onPointerCancel={handleFirePointerUp}
            >
              <span className="text-2xl leading-none">🔥</span>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">TIR</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
