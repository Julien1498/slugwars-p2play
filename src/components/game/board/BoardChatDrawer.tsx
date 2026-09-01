import React, { useState, useRef, useEffect } from 'react';
import { GameState } from '../../../core/types';
import type { ChatMessage } from 'p2play-core';
import { X, MessageSquare, BookOpen } from 'lucide-react';
import { CombatLogChatTab } from '../desktop/combatLog/CombatLogChatTab';
import { CombatLogJournalTab } from '../desktop/combatLog/CombatLogJournalTab';

interface BoardChatDrawerProps {
  showDrawer: boolean;
  onClose: () => void;
  gameState: GameState;
  chatMessages: ChatMessage[];
  sendChat: (text: string) => void;
}

export const BoardChatDrawer: React.FC<BoardChatDrawerProps> = ({
  showDrawer,
  onClose,
  gameState,
  chatMessages,
  sendChat,
}) => {
  const [activeTab, setActiveTab] = useState<'journal' | 'chat'>('journal');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages, gameState.journal, activeTab]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendChat(inputText.trim());
    setInputText('');
  };

  if (!showDrawer) return null;

  return (
    <div className="absolute right-2 sm:right-4 top-12 sm:top-16 z-40 w-80 sm:w-96 max-h-[78vh] landscape:max-h-[82vh] bg-zinc-950/95 border border-violet-500/40 backdrop-blur-xl rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col space-y-3 animate-in fade-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('journal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono font-bold">
              {gameState.journal?.length || 0}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('chat');
              setTimeout(() => inputRef.current?.focus(), 60);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeTab === 'chat'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Escouade</span>
            {chatMessages.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono font-bold">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden h-72 flex flex-col">
        {activeTab === 'chat' ? (
          <CombatLogChatTab
            chatMessages={chatMessages}
            teams={gameState.teams}
            scrollContainerRef={scrollContainerRef}
            inputText={inputText}
            setInputText={setInputText}
            inputRef={inputRef}
            onSend={handleSend}
          />
        ) : (
          <CombatLogJournalTab
            journal={gameState.journal || []}
            scrollContainerRef={scrollContainerRef}
          />
        )}
      </div>
    </div>
  );
};
