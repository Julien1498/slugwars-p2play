import React, { useState, useEffect, useRef, Profiler } from 'react';
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
      if (activeSlug && activeSlug.inVehicleId && gameState.phase === 'AIMING') {
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
              const newAngle = Math.max(5, activeSlug.aimAngle - 5);
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
    <div className="flex flex-col h-screen max-h-screen overflow-hidden bg-zinc-950 p-2 text-zinc-100 relative">
      {/* Tactical Artillery Top Header */}
      <Profiler id="TurnHeader" onRender={perfTracker.onReactRender}>
        <TurnHeader
          gameState={gameState}
          hostPeerId={hostPeerId}
          isMyTurn={isMyTurn}
          onOpenWeaponPicker={() => setShowWeaponPicker(true)}
          onOpenRules={() => setShowRules(true)}
          onOpenMetrics={() => setShowMetrics(true)}
          onExit={onExit}
        />
      </Profiler>

      {/* Placement Phase Header Banner */}
      {gameState.phase === 'PLACEMENT' && (
        <div className="bg-amber-950/90 border border-amber-500/70 p-2 rounded-xl text-center text-xs font-extrabold text-amber-300 shadow-lg animate-pulse my-1 shrink-0">
          📍 Phase de Placement : Cliquez sur le terrain pour placer vos limaces ! (Tour de {activeSlug?.name})
        </div>
      )}

      {/* Main Full-Width Canvas Container */}
      <div className="relative flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden py-1">
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

      {/* Sleek Tactical Artillery Bottom HUD Controls Bar */}
      <div className="bg-zinc-900/90 border border-zinc-800 p-2 rounded-xl flex items-center justify-between text-xs text-zinc-300 gap-2 flex-wrap shadow-xl shrink-0">
          <div className="flex items-center gap-4">
            {activeSlug?.inVehicleId ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-amber-950/80 border border-amber-500/80 px-3 py-1 rounded-lg text-amber-200 font-black animate-pulse">
                  <span>🚁 Hélicoptère aux Commandes !</span>
                  <span className="font-mono text-xs text-amber-300">[ZQSD / Flèches] Voler</span>
                </div>
                {isMyTurn && (
                  <button
                    onClick={onExitVehicle}
                    className="px-3 py-1 bg-red-900/80 hover:bg-red-800 border border-red-500/80 text-red-200 font-bold rounded-lg transition"
                  >
                    Sortir [E]
                  </button>
                )}
              </div>
            ) : activeSheep ? (
              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-500/60 px-3 py-1 rounded-lg text-amber-200 font-bold animate-pulse">
                <span>🐑 Super Mouton en Vol !</span>
                <span className="font-mono text-zinc-300">[◄ / ►] Mettre le cap</span>
                <span className="font-mono text-zinc-300">[Entrée] Faire tout sauter</span>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-violet-300">◄ / ►</span>
                  <span className="text-zinc-400">ou</span>
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-violet-300">Q / D</span>
                  <span className="text-zinc-300 ml-1">Déplacer</span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="px-2.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-amber-300">Espace</span>
                  <span className="text-zinc-300">Sauter 🦘</span>
                </div>

                <div className="flex items-center gap-1.5 font-semibold">
                  <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-sky-300">▲ / ▼</span>
                  <span className="text-zinc-300">Angle</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Journal & Chat Toggle Drawer Button (Saves space!) */}
            <button
              onClick={() => setShowDrawer(!showDrawer)}
              className={`px-3 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition ${
                showDrawer
                  ? 'bg-violet-950 border-violet-500 text-violet-300'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Journal & Chat</span>
            </button>

            {/* Hitbox Toggle Button */}
            <button
              onClick={() => setShowHitboxes(!showHitboxes)}
              className={`px-3 py-1 rounded-lg border font-bold text-xs flex items-center gap-1.5 transition ${
                showHitboxes
                  ? 'bg-cyan-950 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-950'
                  : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-400 hover:text-zinc-200'
              }`}
              title="Afficher/Masquer les Hitboxes de collision"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Hitbox {showHitboxes ? 'Activées' : '🎯'}</span>
            </button>

            <div className="flex items-center gap-1.5 font-semibold">
              <span className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-emerald-300">Entrée / Clic</span>
              <span className="text-zinc-300">Tirer (Charger) 🚀</span>
            </div>

            <button
              onClick={() => setShowWeaponPicker(true)}
              disabled={!isMyTurn}
              className="px-3 py-1 bg-violet-950/90 hover:bg-violet-900 border border-violet-600 text-violet-200 rounded-lg font-bold text-xs transition disabled:opacity-40 shadow"
            >
              Armes 🎒
            </button>
          </div>
        </div>

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
            onClose={() => setShowWeaponPicker(false)}
          />
        </Profiler>
      )}

      {/* Rules Modal */}
      {showRules && (
        <Profiler id="RulesModal" onRender={perfTracker.onReactRender}>
          <RulesModal onClose={() => setShowRules(false)} />
        </Profiler>
      )}

      {/* Hardware & Network Performance Metrics Modal */}
      {showMetrics && (
        <Profiler id="MetricsModal" onRender={perfTracker.onReactRender}>
          <MetricsModal
            isOpen={showMetrics}
            onClose={() => setShowMetrics(false)}
            gameState={gameState}
            hostPeerId={hostPeerId}
          />
        </Profiler>
      )}
    </div>
  );
};
