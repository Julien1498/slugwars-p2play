import React from 'react';
import { WeaponCategory, WeaponDefinition } from '../../../core/weapons/types';
import { Bomb, Swords, Plane, Flame, Wrench } from 'lucide-react';

export const WEAPON_CATEGORIES: { id: WeaponCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'EXPLOSIVE', label: 'Explosifs', icon: <Bomb className="w-3.5 h-3.5" /> },
  { id: 'MELEE', label: 'Mêlée', icon: <Swords className="w-3.5 h-3.5" /> },
  { id: 'AIR_SUPPORT', label: 'Aérien', icon: <Plane className="w-3.5 h-3.5" /> },
  { id: 'SPECIAL', label: 'W.M.D', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'UTILITY', label: 'Utilitaires', icon: <Wrench className="w-3.5 h-3.5" /> },
];

interface WeaponCategoryTabsProps {
  isTouch: boolean;
  activeCategory: WeaponCategory;
  onSelectCategory: (cat: WeaponCategory) => void;
  allWeapons: WeaponDefinition[];
}

export const WeaponCategoryTabs: React.FC<WeaponCategoryTabsProps> = ({
  isTouch,
  activeCategory,
  onSelectCategory,
  allWeapons,
}) => {
  if (isTouch) {
    return (
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 border-b border-zinc-800/80 pb-2 shrink-0">
        {WEAPON_CATEGORIES.map((cat) => {
          const count = allWeapons.filter((w) => w.category === cat.id).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.icon}
              <span className="whitespace-nowrap">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                  isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  const azertyShortcuts = ['&', 'é', '"', "'", '('];
  return (
    <div className="grid grid-cols-5 gap-2 border-b border-zinc-800/80 pb-3 shrink-0">
      {WEAPON_CATEGORIES.map((cat, idx) => {
        const count = allWeapons.filter((w) => w.category === cat.id).length;
        const isActive = activeCategory === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            title={`Onglet ${cat.label} (Touche ${idx + 1} ou ${azertyShortcuts[idx]})`}
            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
          >
            <span className="font-mono text-[9px] px-1 py-0.2 bg-black/40 rounded border border-white/10 text-zinc-300">
              {idx + 1}
            </span>
            {cat.icon}
            <span className="truncate">{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
