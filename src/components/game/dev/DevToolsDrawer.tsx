import React from 'react';
import { X, Clock, Briefcase, User, Package, CloudRain, Eye, Bug, ShieldAlert, UserPlus } from 'lucide-react';
import { GameState } from '../../../core/types';
import { SlugWarsEngine } from '../../../core/gameEngine';
import { DevCursorTool, DevTab } from '../../../hooks/useDevMode';
import { DevTimeTab } from './tabs/DevTimeTab';
import { DevWeaponsTab } from './tabs/DevWeaponsTab';
import { DevSlugsTab } from './tabs/DevSlugsTab';
import { DevSpawnsTab } from './tabs/DevSpawnsTab';
import { DevEnvTab } from './tabs/DevEnvTab';
import { DevOverlaysTab } from './tabs/DevOverlaysTab';

interface DevToolsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: DevTab;
  onTabChange: (tab: DevTab) => void;
  engineRef: React.MutableRefObject<SlugWarsEngine>;
  isHost: boolean;
  gameState: GameState;
  syncState: () => void;
  broadcastDeltaState?: (state: GameState) => void;
  activeCursorTool: DevCursorTool | null;
  onSelectCursorTool: (tool: DevCursorTool | null) => void;
  showHitboxes: boolean;
  onToggleHitboxes: () => void;
  showPerfMetrics: boolean;
  onTogglePerfMetrics: () => void;
  roomCode?: string;
  brushRadius?: number;
  onSetBrushRadius?: (r: number) => void;
}

export const DevToolsDrawer: React.FC<DevToolsDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onTabChange,
  engineRef,
  isHost,
  gameState,
  syncState,
  broadcastDeltaState,
  activeCursorTool,
  onSelectCursorTool,
  showHitboxes,
  onToggleHitboxes,
  showPerfMetrics,
  onTogglePerfMetrics,
  roomCode,
  brushRadius,
  onSetBrushRadius,
}) => {
  if (!isOpen) return null;

  const triggerMutation = (fn: () => void) => {
    fn();
    syncState();
    if (broadcastDeltaState) {
      broadcastDeltaState(engineRef.current.state);
    }
  };

  const tabs: { id: DevTab; label: string; icon: React.ReactNode }[] = [
    { id: 'time', label: 'Temps', icon: <Clock className="w-3.5 h-3.5" /> },
    { id: 'weapons', label: 'Armes', icon: <Briefcase className="w-3.5 h-3.5" /> },
    { id: 'slugs', label: 'Limaces', icon: <User className="w-3.5 h-3.5" /> },
    { id: 'spawns', label: 'Spawns', icon: <Package className="w-3.5 h-3.5" /> },
    { id: 'env', label: 'Météo & Sol', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { id: 'overlays', label: 'Overlays', icon: <Eye className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed top-16 left-4 z-50 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-zinc-950/95 border border-amber-500/40 shadow-2xl shadow-black/90 backdrop-blur-2xl text-zinc-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/80 bg-zinc-900/60">
        <div className="flex items-center gap-2 font-black text-xs tracking-wider text-amber-400">
          <Bug className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>PANNEAU DEV / DEBUG</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const currentParams = new URLSearchParams(window.location.search);
              const room = roomCode || currentParams.get('room') || (window as any).__p2playRoomId || '';
              const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(room)}&autojoin=1`;
              window.open(url, '_blank');
            }}
            className="flex items-center gap-1 px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold border border-amber-500/40 transition-colors"
            title="Ouvrir un 2e joueur en nouvel onglet connecté instantanément"
          >
            <UserPlus className="w-3 h-3" />
            <span>+2e Onglet</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            title="Fermer (Raccourci: ²)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isHost && (
        <div className="px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Mode Invité : Seul l'hôte applique les modifications réseau.</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 px-2 py-2 border-b border-zinc-800/60 bg-zinc-950 overflow-x-auto no-scrollbar">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onTabChange(t.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-3.5 max-h-[60vh] overflow-y-auto">
        {activeTab === 'time' && (
          <DevTimeTab
            gameState={gameState}
            onFreezeTimer={() => triggerMutation(() => engineRef.current.devToggleFreezeTimer())}
            onSkipTurn={() => triggerMutation(() => engineRef.current.endTurn())}
            onForceWin={() => triggerMutation(() => engineRef.current.devForceWin())}
            onResetTimer={() => triggerMutation(() => { engineRef.current.state.turnTimer = 45; })}
          />
        )}

        {activeTab === 'weapons' && (
          <DevWeaponsTab
            onSetInfiniteAmmo={() => triggerMutation(() => engineRef.current.devSetInfiniteAmmo())}
            onUnlockAllWeapons={() => triggerMutation(() => engineRef.current.devUnlockAllWeapons())}
            onGrantWeapon={(weaponId, count) => triggerMutation(() => {
              const team = gameState.teams.find((t) => t.id === gameState.activeTeamId);
              if (team) {
                if (!team.inventory) team.inventory = {};
                team.inventory[weaponId] = (team.inventory[weaponId] ?? 0) + count;
              }
            })}
          />
        )}

        {activeTab === 'slugs' && (
          <DevSlugsTab
            gameState={gameState}
            onToggleGodMode={() => triggerMutation(() => engineRef.current.devToggleGodMode())}
            onHealAll={() => triggerMutation(() => engineRef.current.devHealAll())}
            onSetOneHp={() => triggerMutation(() => engineRef.current.devSetOneHp())}
            onKillActiveSlug={() => triggerMutation(() => {
              if (gameState.activeSlugId) engineRef.current.devKillSlug(gameState.activeSlugId);
            })}
            onAutoPlaceAll={() => triggerMutation(() => engineRef.current.devAutoPlaceAllSlugs())}
            activeCursorTool={activeCursorTool}
            onSelectCursorTool={onSelectCursorTool}
          />
        )}

        {activeTab === 'spawns' && (
          <DevSpawnsTab
            activeCursorTool={activeCursorTool}
            onSelectCursorTool={onSelectCursorTool}
          />
        )}

        {activeTab === 'env' && (
          <DevEnvTab
            gameState={gameState}
            onSetWind={(w) => triggerMutation(() => engineRef.current.devSetWind(w))}
            onRiseWater={(amount) => triggerMutation(() => engineRef.current.devRiseWater(amount))}
            onLowerWater={(amount) => triggerMutation(() => engineRef.current.devLowerWater(amount))}
            onTriggerArmageddon={() => triggerMutation(() => engineRef.current.devTriggerArmageddon())}
            activeCursorTool={activeCursorTool}
            onSelectCursorTool={onSelectCursorTool}
            brushRadius={brushRadius}
            onSetBrushRadius={onSetBrushRadius}
          />
        )}

        {activeTab === 'overlays' && (
          <DevOverlaysTab
            showHitboxes={showHitboxes}
            onToggleHitboxes={onToggleHitboxes}
            showPerfMetrics={showPerfMetrics}
            onTogglePerfMetrics={onTogglePerfMetrics}
          />
        )}
      </div>
    </div>
  );
};
