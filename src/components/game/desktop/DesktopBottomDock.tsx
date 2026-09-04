import React from 'react';
import { GameState, Slug, ActiveProjectile } from '../../../core/types';
import { getWeapon } from '../../../core/weapons/registry';
import { DesktopCombatLog } from './DesktopCombatLog';
import type { ChatMessage } from 'p2play-core';
import { Crosshair, Layers } from 'lucide-react';

interface DesktopBottomDockProps {
  gameState: GameState;
  activeSlug: Slug | undefined;
  activeSheep: ActiveProjectile | undefined;
  isMyTurn: boolean;
  showDrawer: boolean;
  onToggleDrawer: () => void;
  onOpenWeaponPicker: () => void;
  onSetFuseTimer?: (seconds: number) => void;
  onUpdateAim?: (angle: number, power: number, facing: 'left' | 'right') => void;
  onExitVehicle?: () => void;
  chatMessages: ChatMessage[];
  sendChat?: (text: string) => void;
}

export const DesktopBottomDock: React.FC<DesktopBottomDockProps> = React.memo(({
  gameState,
  activeSlug,
  activeSheep,
  isMyTurn,
  showDrawer,
  onToggleDrawer,
  onOpenWeaponPicker,
  onSetFuseTimer,
  onUpdateAim,
  onExitVehicle,
  chatMessages,
  sendChat,
}) => {
  const currentWeapon = activeSlug ? getWeapon(activeSlug.selectedWeaponId) : null;
  const myTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const ammo = currentWeapon && myTeam ? (myTeam.inventory[currentWeapon.id] ?? currentWeapon.defaultAmmo) : -1;
  const ammoLabel =
    currentWeapon?.id === 'blowtorch'
      ? `${Math.round(ammo)}% ⛽`
      : ammo === -1
      ? '∞'
      : `x${ammo}`;

  const isAimingPhase = gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME';
  const isRetreat = gameState.phase === 'RETREAT';

  const handleGirderRotate = () => {
    if (!activeSlug || isRetreat) return;
    const nextAngle = (activeSlug.aimAngle + 45) % 360;
    onUpdateAim?.(nextAngle, activeSlug.aimPower, activeSlug.facing);
  };


  return (
    <footer className="relative w-full flex items-end justify-between pointer-events-none select-none px-4 pb-3">
      {/* ========================================================================= */}
      {/* 1. BOTTOM-LEFT: COMBAT LOG & FLOATING CHAT                                */}
      {/* ========================================================================= */}
      <div className="pointer-events-auto z-10 max-w-[380px]">
        <DesktopCombatLog
          gameState={gameState}
          chatMessages={chatMessages}
          sendChat={sendChat}
          showDrawer={showDrawer}
          onToggleDrawer={onToggleDrawer}
        />
      </div>

      {/* ========================================================================= */}
      {/* 2. BOTTOM-CENTER: THE TACTICAL ARSENAL DOCK (Anchored, never shifts!)     */}
      {/* ========================================================================= */}
      <div className="pointer-events-auto absolute left-1/2 -translate-x-1/2 bottom-3 z-10 flex flex-col items-center gap-2">
        {activeSlug?.inVehicleId ? (
          /* Vehicle Control Bay */
          <div className="flex items-center gap-3 bg-amber-950/90 border border-amber-500/80 px-4 py-2 rounded-2xl text-amber-200 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95">
            <span className="font-black text-sm flex items-center gap-2 text-amber-300">
              <span className="text-xl animate-bounce">🚁</span> Hélicoptère de Combat
            </span>
            <span className="font-mono text-xs text-amber-200 bg-black/50 px-2.5 py-1 rounded-xl border border-amber-500/40">
              ZQSD / Flèches pour voler
            </span>
            {isMyTurn && (
              <button
                type="button"
                onClick={onExitVehicle}
                className="px-3 py-1 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-black text-xs rounded-xl transition shadow flex items-center gap-1 active:scale-95"
              >
                Sortir [E]
              </button>
            )}
          </div>
        ) : activeSheep ? (
          /* Super Sheep Remote Bay */
          <div className="flex items-center gap-3 bg-purple-950/90 border border-purple-500/80 px-4 py-2 rounded-2xl text-purple-200 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95">
            <span className="font-black text-sm flex items-center gap-2 text-purple-300">
              <span className="text-xl animate-bounce">🐑</span> Super-Mouton en Vol
            </span>
            <span className="font-mono text-xs text-purple-200 bg-black/50 px-2.5 py-1 rounded-xl border border-purple-500/40">
              ◄ / ► Pivoter
            </span>
            <span className="font-mono text-xs text-purple-200 bg-black/50 px-2.5 py-1 rounded-xl border border-purple-500/40">
              Espace / Entrée : Faire exploser 💥
            </span>
          </div>
        ) : (
          /* Standard Tactical Weapon Dock */
          <div className="flex items-center gap-2.5 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 p-2 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.85)]">
            {/* Equipped Weapon Card */}
            {currentWeapon && (
              <div className="flex items-center gap-3 bg-gradient-to-r from-zinc-900 to-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-700/80 shadow-inner">
                {/* Weapon Icon */}
                <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  {currentWeapon.icon}
                </div>

                {/* Weapon Name + Ammo */}
                <div className="flex flex-col min-w-[100px]">
                  <span className="text-xs font-black text-zinc-100 truncate">
                    {currentWeapon.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {isMyTurn && (
                      <span
                        className={`text-[11px] font-black px-1.5 py-0.2 rounded-md ${
                          currentWeapon.id === 'blowtorch'
                            ? 'bg-amber-950/90 text-amber-300 border border-amber-500/60'
                            : ammo === -1
                            ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/60'
                            : ammo > 0
                            ? 'bg-violet-950/90 text-violet-300 border border-violet-500/60'
                            : 'bg-zinc-900 text-zinc-600'
                        }`}
                      >
                        {ammoLabel}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 font-semibold">
                      {currentWeapon.windAffected ? '💨 Vent' : '🎯 Direct'}
                    </span>
                  </div>
                </div>

                {/* Integrated Fuse Timer / Magnet Polarity Selector */}
                {currentWeapon.allowCustomFuse && isMyTurn && !isRetreat && (
                  <div className="flex items-center gap-1 pl-2 border-l border-zinc-800">
                    {currentWeapon.id === 'magnet' ? (
                      <>
                        <span className="text-xs font-bold text-sky-400">🧲</span>
                        {(() => {
                          const currentFuse = activeSlug?.fuseTimerSec ?? 1;
                          return (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => onSetFuseTimer?.(1)}
                                className={`px-2 h-7 rounded-lg font-black text-xs flex items-center gap-1 border transition-all ${
                                  currentFuse !== 2
                                    ? 'bg-blue-600 text-white border-blue-300 shadow-[0_0_12px_#3b82f6] scale-105'
                                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 active:scale-95'
                                }`}
                                title="Attirer les projectiles métalliques (Touche 1)"
                              >
                                <span>Attirer</span>
                                <span className="text-[9px] opacity-70">[1]</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => onSetFuseTimer?.(2)}
                                className={`px-2 h-7 rounded-lg font-black text-xs flex items-center gap-1 border transition-all ${
                                  currentFuse === 2
                                    ? 'bg-red-600 text-white border-red-300 shadow-[0_0_12px_#ef4444] scale-105'
                                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 active:scale-95'
                                }`}
                                title="Repousser les projectiles métalliques (Touche 2)"
                              >
                                <span>Repousser</span>
                                <span className="text-[9px] opacity-70">[2]</span>
                              </button>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      <>
                        <span className="text-xs font-bold text-amber-400">⏱️</span>
                        {[1, 2, 3, 4, 5].map((sec) => {
                          const currentFuse =
                            activeSlug?.fuseTimerSec ??
                            (currentWeapon.fuseTimeMs ? Math.round(currentWeapon.fuseTimeMs / 1000) : 3);
                          const isSelected = currentFuse === sec;
                          return (
                            <button
                              key={sec}
                              type="button"
                              onClick={() => onSetFuseTimer?.(sec)}
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_#f59e0b] scale-105'
                                  : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border-zinc-800 active:scale-95'
                              }`}
                              title={`Régler la mèche sur ${sec}s (Touche ${sec})`}
                            >
                              {sec}s
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}

                {/* Girder Rotate Button (if Girder is selected) */}
                {currentWeapon.id === 'girder' && isMyTurn && !isRetreat && (
                  <button
                    type="button"
                    onClick={handleGirderRotate}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black text-xs flex items-center gap-1.5 border border-sky-400 shadow-md active:scale-95 transition"
                    title="Changer l'angle d'inclinaison de la poutre (Clic Droit pour verrouiller l'emplacement, Touche R ou Flèches)"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>↻ {Math.round((activeSlug?.aimAngle || 0) % 360)}°</span>
                  </button>


                )}
              </div>
            )}


            {/* Prominent Arsenal Button */}
            <button
              type="button"
              onClick={onOpenWeaponPicker}
              disabled={!isMyTurn || gameState.phase !== 'AIMING' || isRetreat}
              className={`px-4 py-2.5 rounded-xl border font-black text-xs transition-all shadow-xl flex items-center gap-2 ${
                isMyTurn && gameState.phase === 'AIMING' && !isRetreat
                  ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-violet-400 shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
              title="Ouvrir l'Arsenal (Touche I ou Tab)"
            >
              <Crosshair className="w-4 h-4 text-violet-200" />
              <span>ARSENAL</span>
              <span className="font-mono text-[10px] bg-black/40 px-1.5 py-0.5 rounded-md border border-white/20">
                [I / TAB]
              </span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. BOTTOM-RIGHT: KEYBOARD SHORTCUTS REMINDER                              */}
      {/* ========================================================================= */}
      <div className="pointer-events-auto flex items-center gap-2">
        {/* Compact Keybinds Reminder */}
        <div className="hidden lg:flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-2xl border border-zinc-800/90 px-3 py-2 rounded-2xl shadow-2xl text-[11px] text-zinc-400">
          <span className="font-mono font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            Q / D
          </span>
          <span>Marcher</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            Espace
          </span>
          <span>Sauter</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            ▲ / ▼
          </span>
          <span>Viser</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            Clic-Droit
          </span>
          <span>Caméra</span>
          <span className="text-zinc-700">•</span>
          <span className="font-mono font-bold text-zinc-300 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
            C
          </span>
          <span>Centrer</span>
        </div>
      </div>
    </footer>
  );
});

DesktopBottomDock.displayName = 'DesktopBottomDock';
