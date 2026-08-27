import React from 'react';
import { GameState, Slug, Vector2D } from '../../../core/types';
import { WeaponDefinition } from '../../../core/weapons/types';
import { isWeaponChargeable } from '../../../core/weapons/registry';
import { sfx } from '../../../core/audio';
import {
  cycleGirderAngle,
  clampAimAngle,
  getMobileFireButtonMode,
  getWeaponAmmoLabel,
  triggerHaptic,
} from './touchControlsUtils';

interface RightThumbClusterProps {
  isMyTurn: boolean;
  gameState: GameState;
  activeSlug?: Slug;
  currentWeapon: WeaponDefinition | null;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onFire?: (targetPoint?: Vector2D) => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onSetFuseTimer?: (seconds: number) => void;
  setShowWeaponPicker: React.Dispatch<React.SetStateAction<boolean>>;
  isHoldingFireRef: React.MutableRefObject<boolean>;
  lastDirectFireTimeRef: React.MutableRefObject<number>;
}

export const RightThumbCluster: React.FC<RightThumbClusterProps> = ({
  isMyTurn,
  gameState,
  activeSlug,
  currentWeapon,
  onUpdateAim,
  onFire,
  onStartCharge,
  onReleaseCharge,
  onSetFuseTimer,
  setShowWeaponPicker,
  isHoldingFireRef,
  lastDirectFireTimeRef,
}) => {
  const isRetreat = gameState.phase === 'RETREAT';
  const isAimingPhase = gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME';
  const myTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const ammo = currentWeapon && myTeam ? (myTeam.inventory[currentWeapon.id] ?? currentWeapon.defaultAmmo) : -1;
  const ammoLabel = getWeaponAmmoLabel(ammo);

  const handleAngleChange = (delta: number) => {
    if (!activeSlug || isRetreat) return;
    triggerHaptic(10);
    sfx.play('tick');
    try {
      window.dispatchEvent(new CustomEvent('slugwars:recenter-camera'));
    } catch {}
    if (activeSlug.selectedWeaponId === 'girder') {
      const nextAngle = cycleGirderAngle(activeSlug.aimAngle, delta);
      onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
    } else {
      const newAngle = clampAimAngle(activeSlug.aimAngle, delta);
      onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
    }
  };

  const handleDirectFire = () => {
    if (!isMyTurn || isRetreat || gameState.phase !== 'AIMING') return;
    const now = Date.now();
    if (now - lastDirectFireTimeRef.current < 400) return;
    lastDirectFireTimeRef.current = now;
    setShowWeaponPicker(false);
    triggerHaptic(30);
    onFire?.(activeSlug?.currentTargetPoint);
  };

  const handleFirePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMyTurn || isRetreat) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    triggerHaptic(20);
    const isChargeable = isWeaponChargeable(currentWeapon);
    if (currentWeapon?.id === 'blowtorch' || !isChargeable) {
      onFire?.(activeSlug?.currentTargetPoint);
    } else {
      isHoldingFireRef.current = true;
      onStartCharge?.(activeSlug?.currentTargetPoint);
    }
  };

  const handleFirePointerUp = (e?: React.PointerEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
      try {
        if (e.currentTarget?.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
    }
    if (!isHoldingFireRef.current) return;
    isHoldingFireRef.current = false;
    lastDirectFireTimeRef.current = Date.now();
    triggerHaptic(25);
    onReleaseCharge?.(activeSlug?.currentTargetPoint);
  };

  const fireButtonMode = getMobileFireButtonMode(currentWeapon);
  const isGirder = currentWeapon?.id === 'girder';
  const isChargeable = isWeaponChargeable(currentWeapon);
  const isInstantTarget = !!currentWeapon?.requiresTarget && !isChargeable;

  return (
    <div className="pointer-events-auto flex flex-col items-end gap-2">
      {/* Fuse Selector / Girder Rotate Widget */}
      {isMyTurn && !isRetreat && (
        <div className="flex items-center gap-1">
          {currentWeapon?.allowCustomFuse && (
            <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl">
              <span className="text-xs font-bold text-amber-400 px-1">⏱️</span>
              {[1, 2, 3, 4, 5].map((sec) => {
                const currentFuse =
                  activeSlug?.fuseTimerSec ?? (currentWeapon.fuseTimeMs ? Math.round(currentWeapon.fuseTimeMs / 1000) : 3);
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
          )}

          {isGirder && (
            <button
              type="button"
              className="px-3.5 py-2 rounded-xl bg-sky-600 active:bg-sky-500 text-white font-black text-xs flex items-center gap-1 border-2 border-sky-400 shadow-xl active:scale-95"
              onClick={() => handleAngleChange(45)}
            >
              ↻ 45° ({activeSlug?.aimAngle || 0}°)
            </button>
          )}
        </div>
      )}

      {/* Actions: Weapon Card + Nudges + Fire Button */}
      <div className="flex flex-col portrait:items-end landscape:flex-row landscape:items-center gap-2">
        {/* Equipped Weapon Card (Tap to open Arsenal) */}
        {currentWeapon && isMyTurn && !isRetreat && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (gameState.phase !== 'AIMING' || !isMyTurn || isRetreat) return;
              if (Date.now() - lastDirectFireTimeRef.current < 1000) return;
              triggerHaptic(20);
              setShowWeaponPicker((prev) => !prev);
            }}
            className="px-3 py-2 min-h-[58px] landscape:min-h-[64px] max-w-[110px] rounded-2xl bg-gradient-to-br from-violet-950/95 to-purple-950/90 border-2 border-violet-500/80 active:border-violet-400 text-left flex items-center gap-2 shadow-2xl backdrop-blur-md active:scale-95 transition-transform"
            title="Toucher pour ouvrir l'Arsenal"
          >
            <span className="text-3xl leading-none shrink-0">{currentWeapon.icon}</span>
            <div className="flex flex-col leading-none min-w-0">
              <span className="text-xs font-black text-violet-200 truncate">
                {currentWeapon.name}
              </span>
              <span className="text-[10px] font-bold text-violet-400 mt-1 truncate">
                {ammoLabel} • 🎒
              </span>
            </div>
          </button>
        )}

        {/* Angle Nudges + Fire Button */}
        <div className="flex items-center gap-2">
          {/* Angle Nudges ▲ / ▼ */}
          {isMyTurn && !isRetreat && !isGirder && (
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                className="w-12 h-10 rounded-xl bg-slate-900/90 active:bg-slate-700 border-2 border-slate-700/90 text-slate-200 font-black text-base flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAngleChange(3);
                }}
              >
                ▲
              </button>
              <button
                type="button"
                className="w-12 h-10 rounded-xl bg-slate-900/90 active:bg-slate-700 border-2 border-slate-700/90 text-slate-200 font-black text-base flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAngleChange(-3);
                }}
              >
                ▼
              </button>
            </div>
          )}

          {/* Main Fire / Action Button */}
          {isMyTurn && !isRetreat && (
            <button
              type="button"
              disabled={!isAimingPhase}
              className={`w-[74px] h-[74px] rounded-2xl border-2 text-white font-black flex flex-col items-center justify-center shadow-2xl transition-all ${
                !isAimingPhase
                  ? 'opacity-30 border-slate-700 bg-slate-900 cursor-not-allowed scale-95'
                  : isGirder
                  ? 'bg-gradient-to-tr from-sky-600 to-cyan-500 active:from-sky-700 active:to-cyan-600 border-sky-300 shadow-sky-600/50 active:scale-95'
                  : isInstantTarget
                  ? 'bg-gradient-to-tr from-amber-600 to-orange-500 active:from-amber-700 active:to-orange-600 border-amber-300 shadow-amber-600/50 active:scale-95'
                  : 'bg-gradient-to-tr from-red-600 via-rose-600 to-amber-500 active:from-red-700 active:to-amber-600 border-amber-300 shadow-red-600/50 active:scale-95'
              }`}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAimingPhase || isGirder || isInstantTarget) return;
                handleFirePointerDown(e);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAimingPhase) return;
                if (isGirder || isInstantTarget) {
                  handleDirectFire();
                  return;
                }
                handleFirePointerUp(e);
              }}
              onPointerCancel={() => {
                if (isAimingPhase && !isGirder && !isInstantTarget) {
                  handleFirePointerUp();
                }
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!isAimingPhase) return;
                if (isGirder || isInstantTarget) {
                  handleDirectFire();
                }
              }}
            >
              <span className="text-3xl leading-none">{fireButtonMode.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">
                {fireButtonMode.label}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
