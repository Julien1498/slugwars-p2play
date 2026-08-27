import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmReturnModal: React.FC<ConfirmReturnModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto select-none">
      <div className="bg-zinc-900 border border-amber-500/60 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in fade-in zoom-in duration-150 pointer-events-auto">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-100">Retourner au Salon ?</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              La partie en cours sera interrompue pour tous les joueurs connectés.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg text-xs font-semibold text-zinc-300 transition active:scale-95 cursor-pointer pointer-events-auto"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold text-xs rounded-lg transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer pointer-events-auto"
          >
            <span>Confirmer le retour</span>
          </button>
        </div>
      </div>
    </div>
  );
};
