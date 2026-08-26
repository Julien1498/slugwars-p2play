import React, { useCallback, useRef, useEffect } from 'react';
import { GameState, Slug, ActiveProjectile, Vector2D } from '../../../core/types';
import { getWeapon, isWeaponChargeable } from '../../../core/weapons/registry';
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
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right', targetPoint?: Vector2D) => void;
  onFire?: (targetPoint?: Vector2D) => void;
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
  pendingPlacement?: Vector2D | null;
  onConfirmPlacement?: () => void;
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
  onFire,
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
  pendingPlacement,
  onConfirmPlacement,
}) => {
  const isTouch = useIsTouchDevice();
  const isHoldingFireRef = useRef<boolean>(false);
  const lastDirectFireTimeRef = useRef<number>(0);

  const triggerHaptic = useCallback((duration = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(duration);
      } catch {
        // Ignored if haptic unsupported
      }
    }
  }, []);

  const isRetreat = gameState.phase === 'RETREAT';

  const handleDirectFire = useCallback(() => {
    if (!isMyTurn || isRetreat || gameState.phase !== 'AIMING') return;
    const now = Date.now();
    if (now - lastDirectFireTimeRef.current < 400) return;
    lastDirectFireTimeRef.current = now;
    setShowWeaponPicker(false);
    triggerHaptic(30);
    const target = activeSlug?.currentTargetPoint;
    onFire?.(target);
  }, [isMyTurn, isRetreat, gameState.phase, triggerHaptic, activeSlug?.currentTargetPoint, onFire, setShowWeaponPicker]);

  // Window-level safety fallback: guarantees shot release even if finger drifts off-screen
  useEffect(() => {
    const handleGlobalRelease = () => {
      if (isHoldingFireRef.current) {
        isHoldingFireRef.current = false;
        triggerHaptic(25);
        onReleaseCharge?.(activeSlug?.currentTargetPoint);
      }
    };
    window.addEventListener('pointerup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    window.addEventListener('pointercancel', handleGlobalRelease);
    return () => {
      window.removeEventListener('pointerup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
      window.removeEventListener('pointercancel', handleGlobalRelease);
    };
  }, [onReleaseCharge, activeSlug?.currentTargetPoint, triggerHaptic]);

  if (!isTouch) return null;

  const inVehicle = !!activeSlug?.inVehicleId;
  const isAimingPhase = gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME';
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
    try {
      window.dispatchEvent(new CustomEvent('slugwars:recenter-camera'));
    } catch {}
    if (activeSlug.selectedWeaponId === 'girder') {
      const angles = [0, 45, 90, 135];
      const curIdx = angles.indexOf(activeSlug.aimAngle);
      const nextIdx = (curIdx + (delta > 0 ? 1 : -1) + angles.length) % angles.length;
      onUpdateAim(angles[nextIdx], activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
    } else {
      const newAngle = Math.max(-85, Math.min(85, activeSlug.aimAngle + delta));
      onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing, activeSlug.currentTargetPoint);
    }
  };

  const handleFirePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isMyTurn || isRetreat) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture not supported
    }
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
      } catch {
        // Ignored
      }
    }
    if (!isHoldingFireRef.current) return;
    isHoldingFireRef.current = false;
    lastDirectFireTimeRef.current = Date.now();
    triggerHaptic(25);
    onReleaseCharge?.(activeSlug?.currentTargetPoint);
  };

  const isPlacementPhase = gameState.phase === 'PLACEMENT';
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 pointer-events-none p-2 sm:p-3 pl-[max(0.75rem,env(safe-area-inset-left))] pr-[max(0.75rem,env(safe-area-inset-right))] pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-end justify-between select-none">
      {/* 0. PLACEMENT PHASE (Discreet confirmation button / instruction pill) */}
      {isPlacementPhase ? (
        <div className="w-full flex justify-center pb-2 pointer-events-auto">
          {pendingPlacement ? (
            <button
              type="button"
              onClick={() => {
                triggerHaptic(20);
                onConfirmPlacement?.();
              }}
              className="px-4 py-2 rounded-xl bg-emerald-600/95 active:bg-emerald-500 border border-emerald-400 text-white font-bold text-sm shadow-xl backdrop-blur-md flex items-center gap-1.5 active:scale-95 transition-transform"
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
      ) : (
        <>
          {/* 1. LEFT THUMB CLUSTER (Movement, D-Pad, Jump, Vehicle / Sheep Controls) - Full 74px buttons */}
          <div className="pointer-events-auto flex items-end gap-2">
            {activeSheep ? (
              // Super Sheep flight controls
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
            ) : inVehicle ? (
              // Helicopter directional cross-pad with Sortir in the center
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
            ) : (
              // Standard Slug D-Pad (Walk & Jump) - Balanced comfortable touch targets
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
            )}
          </div>

          {/* 2. CENTER CLUSTER (Chat Drawer Toggle) */}
          <div className="pointer-events-auto flex items-end gap-1.5 pb-1">
            {onToggleDrawer && (
              <button
                type="button"
                onClick={() => {
                  triggerHaptic(15);
                  onToggleDrawer();
                }}
                className={`p-2.5 rounded-2xl border flex items-center gap-1.5 shadow-xl backdrop-blur-md active:scale-95 transition-all ${
                  showDrawer
                    ? 'bg-violet-950/90 border-violet-500 text-white'
                    : 'bg-zinc-900/80 border-zinc-700/80 text-zinc-300'
                }`}
                title="Journal et Tchat"
              >
                <MessageSquare className="w-5 h-5 text-violet-400" />
                {chatMessageCount > 0 && !showDrawer && (
                  <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                )}
              </button>
            )}
          </div>

          {/* 3. RIGHT THUMB CLUSTER (Weapon Dossier Card, Fuse, Angle Nudges, Fire Button) */}
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

                {currentWeapon?.id === 'girder' && (
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

            {/* Actions: In Landscape, Weapon card + Nudges + Fire in a single row. In Portrait, Weapon card stacked above Nudges + Fire */}
            <div className="flex flex-col portrait:items-end landscape:flex-row landscape:items-center gap-2">
              {/* Equipped Weapon Card (Tap to open Arsenal) */}
              {currentWeapon && isMyTurn && !isRetreat && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (gameState.phase !== 'AIMING' || !isMyTurn || isRetreat) return;
                    if (Date.now() - lastDirectFireTimeRef.current < 1000) return; // Prevent ghost click on unmount!
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

              {/* Angle Nudges + Fire Button row */}
              <div className="flex items-center gap-2">
                {/* Angle Nudges / Rope Length ▲ / ▼ */}
                {isMyTurn && !isRetreat && currentWeapon?.id !== 'girder' && (
                  <div className="flex flex-col gap-1.5">
                    <button
                      type="button"
                      className="w-12 h-10 rounded-xl bg-slate-900/90 active:bg-slate-700 border-2 border-slate-700/90 text-slate-200 font-black text-base flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(10);
                        if (activeSlug?.ropeState) {
                          onStartSteer?.('left');
                        } else {
                          handleAngleChange(3);
                        }
                      }}
                      onPointerUp={(e) => {
                        e.preventDefault();
                        if (activeSlug?.ropeState) onStopSteer?.();
                      }}
                      onPointerCancel={() => {
                        if (activeSlug?.ropeState) onStopSteer?.();
                      }}
                      title={activeSlug?.ropeState ? "Raccourcir la corde (Monter)" : "Augmenter l'angle"}
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="w-12 h-10 rounded-xl bg-slate-900/90 active:bg-slate-700 border-2 border-slate-700/90 text-slate-200 font-black text-base flex items-center justify-center shadow-xl backdrop-blur-md active:scale-95"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        triggerHaptic(10);
                        if (activeSlug?.ropeState) {
                          onStartSteer?.('right');
                        } else {
                          handleAngleChange(-3);
                        }
                      }}
                      onPointerUp={(e) => {
                        e.preventDefault();
                        if (activeSlug?.ropeState) onStopSteer?.();
                      }}
                      onPointerCancel={() => {
                        if (activeSlug?.ropeState) onStopSteer?.();
                      }}
                      title={activeSlug?.ropeState ? "Rallonger la corde (Descendre)" : "Diminuer l'angle"}
                    >
                      ▼
                    </button>
                  </div>
                )}

                {/* Main Fire / Action Button - Full 74px comfortable button */}
                {isMyTurn && !isRetreat && (() => {
                  const isGirder = currentWeapon?.id === 'girder';
                  const isChargeable = isWeaponChargeable(currentWeapon);
                  const isInstantTarget = !!currentWeapon?.requiresTarget && !isChargeable;
                  const isHomingMissile = currentWeapon?.id === 'homing_missile';

                  return (
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
                      onPointerCancel={(e) => {
                        if (isAimingPhase && !isGirder && !isInstantTarget) {
                          handleFirePointerUp(e);
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
                      <span className="text-3xl leading-none">
                        {isGirder ? '🪜' : isHomingMissile ? '🎯' : currentWeapon?.requiresTarget ? '🎯' : '🔥'}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-tighter mt-0.5">
                        {isGirder ? 'POSER' : isHomingMissile ? 'TIRER' : currentWeapon?.requiresTarget ? 'CIBLER' : 'TIR'}
                      </span>
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
