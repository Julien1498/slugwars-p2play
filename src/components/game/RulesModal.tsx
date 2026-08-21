import React from 'react';
import { X, Shield, Sparkles, Target, Zap } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl text-zinc-200 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-violet-400" />
            <h2 className="text-lg font-black text-violet-300">Règles du Jeu - Slug Wars P2P</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-sm max-h-96 overflow-y-auto pr-2">
          <div className="space-y-1">
            <h3 className="font-bold text-violet-400 flex items-center gap-2">
              <Target className="w-4 h-4" /> But du jeu
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Chaque joueur contrôle une équipe de limaces armées. À tour de rôle, vous devez viser et utiliser vos armes pour éliminer toutes les limaces adverses ou les projeter à l'eau !
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-violet-400 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Contrôles & Viseur
            </h3>
            <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1 pl-1">
              <li><strong>Bouton Viseur / Clic Canvas :</strong> Orientez l'angle de tir et ajustez la puissance.</li>
              <li><strong>Catalogue d'Arsenal (Bouton Arme) :</strong> Sélectionnez votre arme avant de tirer.</li>
              <li><strong>Armes à cible (Attaque Aérienne, Téléporteur, Âne en Béton) :</strong> Cliquez sur la carte pour désigner le point d'impact.</li>
            </ul>
          </div>

          <div className="space-y-1">
            <h3 className="font-bold text-violet-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> Cartes Procédurales & Physique
            </h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              Le relief est généré de manière procédurale selon la graine (*seed*) du salon. Chaque explosion détruit physiquement le terrain et le vent dévie les tirs balistiques comme le Bazooka. Attention aux chutes et à la noyade !
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
