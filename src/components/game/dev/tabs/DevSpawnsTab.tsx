import React from 'react';
import { Package, Heart, Wrench, Bomb, Flame, Plane } from 'lucide-react';
import { DevCursorTool } from '../../../../hooks/useDevMode';

interface DevSpawnsTabProps {
  activeCursorTool: DevCursorTool | null;
  onSelectCursorTool: (tool: DevCursorTool | null) => void;
}

export const DevSpawnsTab: React.FC<DevSpawnsTabProps> = ({
  activeCursorTool,
  onSelectCursorTool,
}) => {
  const tools: { id: DevCursorTool; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'spawn_crate_weapon', label: 'Caisse Armes', icon: <Package className="w-4 h-4 text-fuchsia-400" />, color: 'hover:border-fuchsia-500' },
    { id: 'spawn_crate_health', label: 'Caisse Soin (+50)', icon: <Heart className="w-4 h-4 text-emerald-400" />, color: 'hover:border-emerald-500' },
    { id: 'spawn_crate_utility', label: 'Caisse Utilitaire', icon: <Wrench className="w-4 h-4 text-sky-400" />, color: 'hover:border-sky-500' },
    { id: 'spawn_mine', label: 'Mine Armée', icon: <Bomb className="w-4 h-4 text-amber-400" />, color: 'hover:border-amber-500' },
    { id: 'spawn_drum', label: 'Baril de Pétrole', icon: <Flame className="w-4 h-4 text-red-400" />, color: 'hover:border-red-500' },
    { id: 'spawn_heli', label: 'Hélicoptère', icon: <Plane className="w-4 h-4 text-blue-400" />, color: 'hover:border-blue-500' },
  ];

  return (
    <div className="flex flex-col gap-3 text-xs">
      <div className="text-[11px] text-zinc-400 font-medium">
        Sélectionnez un élément, puis cliquez n'importe où sur le terrain pour le faire apparaître :
      </div>

      <div className="grid grid-cols-2 gap-2">
        {tools.map((t) => {
          const isSelected = activeCursorTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onSelectCursorTool(t.id)}
              className={`p-2.5 rounded-lg border text-left flex items-center gap-2 font-bold transition-all ${
                isSelected
                  ? 'bg-amber-500 text-zinc-950 border-amber-400 scale-[1.02] shadow-md shadow-amber-500/20'
                  : `bg-zinc-900/90 text-zinc-200 border-zinc-800 hover:bg-zinc-800 ${t.color}`
              }`}
            >
              {t.icon}
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
