import React from 'react';
import { WeaponCategory, WeaponDefinition } from '../../../../core/weapons/types';
import { getCategoryShortcutBadge } from '../../../../core/input';
import { Bomb, Swords, Plane, Flame, Wrench } from 'lucide-react';

export const WEAPON_CATEGORIES: { id: WeaponCategory; label: string; icon: React.ReactNode }[] = [
  { id: 'EXPLOSIVE', label: 'Explosifs', icon: <Bomb className="w-3.5 h-3.5" /> },
  { id: 'MELEE', label: 'Armes', icon: <Swords className="w-3.5 h-3.5" /> },
  { id: 'AIR_SUPPORT', label: 'Aérien', icon: <Plane className="w-3.5 h-3.5" /> },
  { id: 'SPECIAL', label: 'Spécial', icon: <Flame className="w-3.5 h-3.5" /> },
  { id: 'UTILITY', label: 'Outils', icon: <Wrench className="w-3.5 h-3.5" /> },
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
          const count = allWeapons.filter((w) => w.category === cat.id && w.craftable !== false).length;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                  : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {cat.icon}
              <span className="whitespace-nowrap font-bold">{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full shrink-0 ${
                  isActive ? 'bg-black/30 text-white font-black' : 'bg-zinc-800 text-zinc-500 font-bold'
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

  return (
    <div className="grid grid-cols-5 gap-1.5 sm:gap-2 border-b border-zinc-800/80 pb-2.5 shrink-0">
      {WEAPON_CATEGORIES.map((cat, idx) => {
        const count = allWeapons.filter((w) => w.category === cat.id && w.craftable !== false).length;
        const isActive = activeCategory === cat.id;
        const shortcut = getCategoryShortcutBadge(idx);
        return (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`py-1.5 sm:py-2 px-2 sm:px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between group relative overflow-hidden ${
              isActive
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] ring-1 ring-violet-400/50'
                : 'bg-zinc-900/80 border border-zinc-800/80 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-1.5 shrink-0">
              {cat.icon}
              <span className="font-bold text-xs">{cat.label}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0 ml-1">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-black/30 text-white' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {count}
              </span>
              <span
                className={`text-[9px] font-mono px-1 py-0.2 rounded border hidden md:inline-block ${
                  isActive
                    ? 'bg-violet-800/80 border-violet-400/60 text-violet-100'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-500'
                }`}
              >
                {shortcut}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
