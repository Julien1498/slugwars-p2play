import React, { useEffect } from 'react';
import { HATS, HatDefinition } from '../../../core/cosmetics/hatsRegistry';
import { saveProfile, loadProfile } from '../../../core/profile';
import { X, Check, Sparkles } from 'lucide-react';
import { HatPreviewCanvas } from './HatPreviewCanvas';

export interface HatPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentHatId?: string;
  teamName: string;
  teamColor: string;
  onSelectHat: (hatId: string) => void;
}

export const HatPickerModal: React.FC<HatPickerModalProps> = ({
  isOpen,
  onClose,
  currentHatId,
  teamName,
  teamColor,
  onSelectHat,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleChoose = (hat: HatDefinition) => {
    onSelectHat(hat.id);
    const existing = loadProfile();
    if (existing?.username) {
      saveProfile({ username: existing.username, hat: hat.id });
    }
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sélection de couvre-chef"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-zinc-900 border border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-950/80 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-2 rounded-xl bg-violet-600/20 border border-violet-500/30 text-xl shadow-inner">
              <Sparkles className="w-5 h-5 text-violet-400" />
            </span>
            <div className="min-w-0">
              <h3 className="text-base font-black text-zinc-100 uppercase tracking-wide truncate">
                Couvre-Chef d'Escouade
              </h3>
              <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                <span>Personnalisation pour</span>
                <span className="font-bold flex items-center gap-1" style={{ color: teamColor }}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: teamColor }} />
                  {teamName}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition cursor-pointer"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hats Grid Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {HATS.map((hat) => {
            const isSelected = (currentHatId || 'military') === hat.id;
            const cardBg = isSelected
              ? 'bg-violet-950/50 border-violet-500 shadow-md shadow-violet-950/40 ring-1 ring-violet-500'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-violet-500/40 hover:bg-zinc-800/40';

            return (
              <button
                key={hat.id}
                type="button"
                onClick={() => handleChoose(hat)}
                className={`relative p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer select-none group ${cardBg}`}
              >
                {/* Visual Cosmetic Preview */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10 group-hover:scale-105 transition-transform overflow-hidden"
                  style={{
                    backgroundColor: isSelected ? `${teamColor}22` : '#18181b',
                    borderColor: isSelected ? teamColor : 'rgba(255,255,255,0.1)',
                  }}
                >
                  <HatPreviewCanvas hatId={hat.id} teamColor={teamColor} size={48} />
                </div>

                {/* Name & Equipped Status */}
                <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-zinc-100 truncate">{hat.name}</span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 text-[9px] font-black uppercase flex items-center gap-0.5 flex-shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> Équipé
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Modal Footer Note */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/40 text-center text-xs text-zinc-500">
          Ce couvre-chef sera porté par toutes les limaces de votre escouade durant la bataille.
        </div>
      </div>
    </div>
  );
};
