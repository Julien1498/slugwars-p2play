import React, { useState, useEffect, useRef, useCallback, Profiler } from 'react';
import { GameState, Vector2D } from '../../core/types';
import { DestructibleTerrain } from '../../core/terrain';
import { TurnHeader } from './TurnHeader';
import { SlugWarsCanvas } from './SlugWarsCanvas';
import { WeaponPicker } from './WeaponPicker';
import { RulesModal } from './RulesModal';
import { MetricsModal } from './MetricsModal';
import { GameOverStatsModal } from './GameOverStatsModal';
import { TextChatPanel, JournalPanel } from 'p2play-core/chat';
import { Trophy, RefreshCw, MessageSquare, Eye, X } from 'lucide-react';
import type { ChatMessage, PeerManagerLike } from 'p2play-core';
import { sfx } from '../../core/audio';
import { perfTracker } from '../../core/perfTracker';

interface SlugWarsBoardProps {
  gameState: GameState;
  terrain: DestructibleTerrain;
  peerManager: PeerManagerLike;
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
  myPeerId: string;
  hostPeerId: string;
  isHost: boolean;
  onFire: (targetPoint?: Vector2D) => void;
  onPlaceSlug?: (point: Vector2D) => void;
  onUpdateAim: (aimAngle: number, aimPower: number, facing: 'left' | 'right') => void;
  onSelectWeapon: (weaponId: string) => void;
  onStartMove: (dir: 'left' | 'right') => void;
  onStopMove: () => void;
  onJump: () => void;
  onStartSteer?: (dir: 'left' | 'right') => void;
  onStopSteer?: () => void;
  onStartCharge?: (targetPoint?: Vector2D) => void;
  onReleaseCharge?: (targetPoint?: Vector2D) => void;
  onDetonate?: () => void;
  onEnterVehicle?: () => void;
  onExitVehicle?: () => void;
  onSteerVehicle?: (dir: 'left' | 'right' | 'up' | 'down') => void;
  onRestartGame: () => void;
  onExit?: () => void;
}

export const SlugWarsBoard: React.FC<SlugWarsBoardProps> = ({
  gameState,
  terrain,
  peerManager,
  chatMessages,
  sendChat,
  myPeerId,
  hostPeerId,
  isHost,
  onFire,
  onPlaceSlug,
  onUpdateAim,
  onSelectWeapon,
  onStartMove,
  onStopMove,
  onJump,
  onStartSteer,
  onStopSteer,
  onStartCharge,
  onReleaseCharge,
  onDetonate,
  onEnterVehicle,
  onExitVehicle,
  onSteerVehicle,
  onRestartGame,
  onExit,
}) => {
  const [showHitboxes, setShowHitboxes] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showWeaponPicker, setShowWeaponPicker] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'journal' | 'chat'>('journal');
  const activeMovingKeyRef = useRef<string | null>(null);

  const handleOpenWeaponPicker = useCallback(() => setShowWeaponPicker(true), []);
  const handleCloseWeaponPicker = useCallback(() => setShowWeaponPicker(false), []);
  const handleOpenRules = useCallback(() => setShowRules(true), []);
  const handleCloseRules = useCallback(() => setShowRules(false), []);
  const handleOpenMetrics = useCallback(() => setShowMetrics(true), []);
  const handleCloseMetrics = useCallback(() => setShowMetrics(false), []);

  const activeSlug = gameState.slugs.find((s) => s.id === gameState.activeSlugId);
  const activeTeam = gameState.teams.find((t) => t.id === gameState.activeTeamId);
  const myTeam = gameState.teams.find((t) => (t.isHost ? isHost : myPeerId === t.id)) || activeTeam;
  const isMyTurn = !!(activeTeam && (activeTeam.isHost ? isHost : myPeerId === activeTeam.id));
  const activeSheep = gameState.projectiles.find((p) => p.weaponId === 'super_sheep');

  // Keyboard Shortcuts for Movement, Aiming, Jumping, Vehicle & Super Sheep Steering
  useEffect(() => {
    if (!isMyTurn) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // Ignore OS auto-repeat!

      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', ' ', 'a', 'd', 'w', 's', 'q', 'z', 'e', 'enter'].includes(key)) {
        e.preventDefault();
      }

      // Vehicle Flight Controls (Helicopter 🚁)
      if (activeSlug && activeSlug.inVehicleId && (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT')) {
        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          onSteerVehicle?.('left');
        } else if (key === 'arrowright' || key === 'd') {
          onSteerVehicle?.('right');
        } else if (key === 'arrowup' || key === 'w' || key === 'z') {
          onSteerVehicle?.('up');
        } else if (key === 'arrowdown' || key === 's') {
          onSteerVehicle?.('down');
        } else if (key === 'e') {
          onExitVehicle?.();
        }
        return;
      }

      // Enter Vehicle (When standing near helicopter)
      if (key === 'e' && activeSlug && !activeSlug.inVehicleId && gameState.phase === 'AIMING') {
        const nearbyHeli = gameState.helicopters?.find(
          (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
        );
        if (nearbyHeli) {
          onEnterVehicle?.();
          return;
        }
      }

      // Super Sheep Active
      if (activeSheep) {
        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          activeMovingKeyRef.current = key;
          onStartSteer?.('left');
        } else if (key === 'arrowright' || key === 'd') {
          activeMovingKeyRef.current = key;
          onStartSteer?.('right');
        } else if (key === ' ' || key === 'enter') {
          onDetonate?.();
        }
        return;
      }

      // Normal Aiming, Walking, Rope Climbing & Retreating
      if (gameState.phase === 'AIMING' || gameState.phase === 'TURN_TIME' || gameState.phase === 'RETREAT') {
        if ((key === 'i' || key === 'tab') && gameState.phase !== 'RETREAT') {
          e.preventDefault();
          setShowWeaponPicker((prev) => !prev);
          return;
        }

        if (key === 'r' && activeSlug && activeSlug.selectedWeaponId === 'girder') {
          // Rotate Girder orientation (0, 45, 90, 135)
          const angles = [0, 45, 90, 135];
          const curIdx = angles.indexOf(activeSlug.aimAngle);
          const nextAngle = angles[(curIdx + 1) % angles.length];
          onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing);
          sfx.play('tick');
          return;
        }

        if (key === 'arrowleft' || key === 'q' || key === 'a') {
          activeMovingKeyRef.current = key;
          onStartMove('left');
        } else if (key === 'arrowright' || key === 'd') {
          activeMovingKeyRef.current = key;
          onStartMove('right');
        } else if (key === ' ' || key === 'spacebar') {
          onJump();
        } else if (key === 'w' || key === 'z') {
          if (activeSlug?.ropeState) {
            onStartSteer?.('left'); // Climb up
          } else {
            onJump();
          }
        } else if (key === 's') {
          if (activeSlug?.ropeState) {
            onStartSteer?.('right'); // Descend down
          }
        } else if (key === 'arrowup' && gameState.phase !== 'RETREAT') {
          if (activeSlug) {
            if (activeSlug.ropeState) {
              onStartSteer?.('left'); // Climb up
            } else if (activeSlug.selectedWeaponId === 'girder') {
              const angles = [0, 45, 90, 135];
              const curIdx = angles.indexOf(activeSlug.aimAngle);
              const nextAngle = angles[(curIdx + 1) % angles.length];
              onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing);
              sfx.play('tick');
            } else {
              const newAngle = Math.min(85, activeSlug.aimAngle + 5);
              onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing);
            }
          }
        } else if (key === 'arrowdown' && gameState.phase !== 'RETREAT') {
          if (activeSlug) {
            if (activeSlug.ropeState) {
              onStartSteer?.('right'); // Descend down
            } else if (activeSlug.selectedWeaponId === 'girder') {
              const angles = [0, 45, 90, 135];
              const curIdx = angles.indexOf(activeSlug.aimAngle);
              const nextAngle = angles[(curIdx - 1 + angles.length) % angles.length];
              onUpdateAim(nextAngle, activeSlug.aimPower, activeSlug.facing);
              sfx.play('tick');
            } else {
              const newAngle = Math.max(-85, activeSlug.aimAngle - 5);
              onUpdateAim(newAngle, activeSlug.aimPower, activeSlug.facing);
            }
          }
        } else if (key === 'enter' && gameState.phase !== 'RETREAT') {
          // Press & Hold Enter to Charge Power!
          onStartCharge?.();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'q', 'a', 'd'].includes(key)) {
        if (activeSheep) {
          onStopSteer?.();
        } else {
          onStopMove();
        }
        activeMovingKeyRef.current = null;
      } else if (['arrowup', 'arrowdown', 'w', 's', 'z'].includes(key)) {
        if (activeSlug?.ropeState) {
          onStopSteer?.();
        }
      } else if (key === 'enter' && !activeSheep && gameState.phase === 'AIMING') {
        // Release Enter to Fire at Charged Power!
        onReleaseCharge?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMyTurn, gameState.phase, activeSlug, activeSheep, onStartMove, onStopMove, onJump, onStartSteer, onStopSteer, onStartCharge, onReleaseCharge, onDetonate, onUpdateAim]);

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-zinc-950 p-1 md:p-1.5 text-zinc-100 relative">
      {/* Tactical Artillery Top Header */}
      <Profiler id="TurnHeader" onRender={perfTracker.onReactRender}>
        <TurnHeader
          gameState={gameState}
          hostPeerId={hostPeerId}
          isMyTurn={isMyTurn}
          isHost={isHost}
          showHitboxes={showHitboxes}
          onToggleHitboxes={() => setShowHitboxes(!showHitboxes)}
          onOpenWeaponPicker={handleOpenWeaponPicker}
          onOpenRules={handleOpenRules}
          onOpenMetrics={handleOpenMetrics}
          onRestartGame={onRestartGame}
          onExit={onExit}
        />
      </Profiler>

      {/* Main Full-Width Canvas Container */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden my-0.5">
        {/* Placement Phase Floating Overlay Chip (Does not push or steal any canvas height!) */}
        {gameState.phase === 'PLACEMENT' && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none px-4 py-1 bg-amber-950/90 border border-amber-500/80 rounded-full text-xs font-black text-amber-300 shadow-xl backdrop-blur-md animate-pulse">
            📍 Cliquez sur le terrain pour placer votre limace ({activeSlug?.name})
          </div>
        )}

        <Profiler id="SlugWarsCanvas" onRender={perfTracker.onReactRender}>
          <SlugWarsCanvas
            gameState={gameState}
            terrain={terrain}
            isMyTurn={isMyTurn}
            showHitboxes={showHitboxes}
            onFire={onFire}
            onPlaceSlug={onPlaceSlug}
            onStartCharge={onStartCharge}
            onReleaseCharge={onReleaseCharge}
            onUpdateAim={onUpdateAim}
          />
        </Profiler>
      </div>

      {/* Sleek Modern Floating Bottom HUD Controls Bar (Strict fixed height to guarantee 0px canvas resize!) */}
      <footer className="h-9 min-h-[36px] max-h-[36px] bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-xl px-2.5 flex items-center justify-between text-xs text-zinc-300 gap-2 shadow-2xl shrink-0 mx-1 mb-0.5 z-30 whitespace-nowrap overflow-hidden">
        <div className="flex items-center gap-2 shrink-0 overflow-hidden">
          {activeSlug?.inVehicleId ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/70 px-2.5 py-0.5 rounded-lg text-amber-200 shadow-md shrink-0">
              <span className="font-black flex items-center gap-1 text-amber-300">
                <span className="text-sm animate-bounce">🚁</span> Hélicoptère
              </span>
              <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
                ZQSD / Flèches pour voler
              </span>
              {isMyTurn && (
                <button
                  onClick={onExitVehicle}
                  className="px-2 py-0.2 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] rounded transition shadow flex items-center gap-1"
                >
                  Sortir [E]
                </button>
              )}
            </div>
          ) : activeSheep ? (
            <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/70 px-2.5 py-0.5 rounded-lg text-amber-200 shadow-md shrink-0">
              <span className="font-black flex items-center gap-1 text-amber-300">
                <span className="text-sm animate-bounce">🐑</span> Super-Mouton
              </span>
              <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
                ◄ / ► Naviguer
              </span>
              <span className="font-mono text-[11px] text-amber-200 bg-black/40 px-1.5 py-0.2 rounded border border-amber-500/30">
                Entrée : Faire sauter
              </span>
            </div>
          ) : (
            <>
              {/* Group 1: Movement & Jump */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-violet-300">
                  Q / D
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Marcher</span>

                <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-amber-300">
                  Espace
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Sauter 🦘</span>
              </div>

              {/* Group 2: Aim Angle */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-sky-300">
                  ▲ / ▼
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Visée</span>
              </div>

              {/* Group 3: Camera Pan & Zoom */}
              <div className="flex items-center gap-1 px-2 py-0.5 bg-zinc-900/80 border border-zinc-800/80 rounded-lg shadow-inner shrink-0">
                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                  Clic-Droit
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Caméra</span>

                <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                  Molette
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Zoom</span>

                <div className="w-px h-3 bg-zinc-700/60 mx-0.5" />

                <span className="px-1.5 py-0.2 bg-zinc-800 border border-zinc-700 rounded font-mono text-[10px] font-bold text-emerald-300">
                  C
                </span>
                <span className="text-zinc-400 text-[11px] font-semibold">Centrer</span>
              </div>
            </>
          )}
        </div>

        {/* Action Controls & Arsenal */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Journal & Chat Drawer Button */}
          <button
            onClick={() => setShowDrawer(!showDrawer)}
            className={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
              showDrawer
                ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_12px_#8b5cf6]'
                : 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Chat & Journal</span>
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.2 bg-violet-950 border border-violet-500/50 rounded-full text-[10px] text-violet-300 font-mono">
                {chatMessages.length}
              </span>
            )}
          </button>

          {/* Fire Prompt (Fixed space / no layout shift) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-950/80 border border-emerald-500/60 rounded-lg shadow shrink-0 transition-all ${
              isMyTurn ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0 px-0 overflow-hidden border-0'
            }`}
          >
            <span className="px-1.5 py-0.2 bg-emerald-900/90 border border-emerald-500/80 rounded font-mono text-[10px] font-black text-emerald-200">
              Clic / Entrée
            </span>
            <span className="font-black text-xs text-emerald-300">Tirer 🚀</span>
          </div>

          {/* Prominent Accessible Weapons Button */}
          <button
            onClick={() => setShowWeaponPicker(true)}
            disabled={!isMyTurn}
            className={`px-3.5 py-1 rounded-xl border font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0 ${
              isMyTurn
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white border-violet-400 shadow-[0_0_15px_rgba(147,51,234,0.45)] hover:scale-105 active:scale-95'
                : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 opacity-50 cursor-not-allowed'
            }`}
            title="Ouvrir l'Arsenal W.M.D (Touche I)"
          >
            <span>Armes 🎒 [I]</span>
          </button>
        </div>
      </footer>

      {/* Floating Collapsible Journal & Chat Drawer Panel (No canvas space wasted!) */}
      {showDrawer && (
        <div className="absolute right-4 top-16 z-40 w-80 max-h-[75vh] bg-zinc-900/95 border border-violet-500/40 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex flex-col space-y-2 animate-in fade-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('journal')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'journal' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Journal
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  activeTab === 'chat' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Chat ({chatMessages.length})
              </button>
            </div>
            <button
              onClick={() => setShowDrawer(false)}
              className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-hidden h-72">
            {activeTab === 'chat' ? (
              <TextChatPanel messages={chatMessages} onSend={sendChat} scrollbarAccent="violet" />
            ) : (
              <JournalPanel
                entries={gameState.journal.map((j) => ({
                  id: j.id,
                  timestamp: new Date(j.timestamp).toLocaleTimeString(),
                  message: j.message,
                  type: j.type === 'combat' ? 'action' : j.type === 'death' ? 'system' : 'info',
                }))}
                scrollbarAccent="violet"
              />
            )}
          </div>
        </div>
      )}

      {/* Victory / Game Over Stats Modal */}
      {gameState.phase === 'GAME_OVER' && (
        <Profiler id="GameOverStatsModal" onRender={perfTracker.onReactRender}>
          <GameOverStatsModal
            gameState={gameState}
            isHost={isHost}
            onRestartGame={onRestartGame}
          />
        </Profiler>
      )}

      {/* Weapon Picker Modal */}
      {showWeaponPicker && myTeam && (
        <Profiler id="WeaponPicker" onRender={perfTracker.onReactRender}>
          <WeaponPicker
            inventory={myTeam.inventory}
            selectedWeaponId={activeSlug?.selectedWeaponId || 'bazooka'}
            onSelectWeapon={(wId) => {
              sfx.play('tick');
              onSelectWeapon(wId);
            }}
            onClose={handleCloseWeaponPicker}
          />
        </Profiler>
      )}

      {/* Rules Modal */}
      {showRules && (
        <Profiler id="RulesModal" onRender={perfTracker.onReactRender}>
          <RulesModal onClose={handleCloseRules} />
        </Profiler>
      )}

      {/* Hardware & Network Performance Metrics Modal */}
      {showMetrics && (
        <Profiler id="MetricsModal" onRender={perfTracker.onReactRender}>
          <MetricsModal
            isOpen={showMetrics}
            onClose={handleCloseMetrics}
            gameState={gameState}
            hostPeerId={hostPeerId}
          />
        </Profiler>
      )}
    </div>
  );
};
