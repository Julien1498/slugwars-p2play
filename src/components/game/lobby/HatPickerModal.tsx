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
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col bg-zinc-900 border border-violet-500/40 rounded-2xl shadow-2xl shadow-violet-950/80 overflow-hidden">
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

        {/* Pure Visual Cosmetic Grid */}
        <div className="p-4 overflow-y-auto max-h-[60vh] grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {HATS.map((hat) => {
            const isSelected = (currentHatId || 'military') === hat.id;
            const cardBg = isSelected
              ? 'bg-violet-950/70 border-violet-500 shadow-md shadow-violet-950/60 ring-2 ring-violet-500/80'
              : 'bg-zinc-950/60 border-zinc-800 hover:border-violet-500/50 hover:bg-zinc-800/50';

            return (
              <button
                key={hat.id}
                type="button"
                onClick={() => handleChoose(hat)}
                title={hat.name}
                aria-label={hat.name}
                className={`relative p-2 rounded-2xl border flex items-center justify-center transition cursor-pointer select-none group aspect-square ${cardBg}`}
              >
                {/* Visual Cosmetic Preview */}
                <div
                  className="w-full h-full rounded-xl flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform"
                  style={{
                    backgroundColor: isSelected ? `${teamColor}22` : 'transparent',
                  }}
                >
                  <HatPreviewCanvas hatId={hat.id} teamColor={teamColor} size={52} />
                </div>

                {/* Equipped Checkmark Badge */}
                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 p-1 rounded-full bg-violet-500 text-white shadow-md">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
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
