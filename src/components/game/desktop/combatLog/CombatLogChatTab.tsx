import React from 'react';
import { Team } from '../../../../core/types';
import type { ChatMessage } from 'p2play-core';
import { MessageSquare, Send } from 'lucide-react';
import { formatChatSender } from './combatLogUtils';

interface CombatLogChatTabProps {
  chatMessages: ChatMessage[];
  teams: Team[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  inputText: string;
  setInputText: (text: string) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onSend: (e: React.FormEvent) => void;
}

export const CombatLogChatTab: React.FC<CombatLogChatTabProps> = ({
  chatMessages,
  teams,
  scrollContainerRef,
  inputText,
  setInputText,
  inputRef,
  onSend,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto pr-1.5 space-y-2 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700/80 scrollbar-track-zinc-900/40"
      >
        {chatMessages.length > 0 ? (
          chatMessages.map((c, i) => {
            const { displayName, color, avatar } = formatChatSender(c.sender, c.senderPeerId, teams);
            return (
              <div
                key={i}
                className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 text-zinc-200 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px]" style={{ backgroundColor: color }} />
                    <span>{avatar}</span>
                    <span className="font-black" style={{ color }}>{displayName}</span>
                  </div>
                  <span className="text-zinc-500">{c.time}</span>
                </div>
                <div className="text-xs font-medium text-zinc-100 break-words pl-3">
                  {c.text}
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs italic gap-2">
            <MessageSquare className="w-8 h-8 text-zinc-700" />
            <span>Canal radio ouvert. Envoyez un message à votre escouade.</span>
          </div>
        )}
      </div>

      {/* High-Tech Chat Form */}
      <form onSubmit={onSend} className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Écrire un message d'escouade... (Entrée)"
          maxLength={140}
          className="flex-1 bg-zinc-900/90 border border-zinc-700/70 focus:border-violet-500 rounded-2xl px-3.5 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none shadow-inner transition-all"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-1.5 cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
