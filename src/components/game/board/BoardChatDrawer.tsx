import React, { useState } from 'react';
import { GameState } from '../../../core/types';
import { TextChatPanel, JournalPanel } from 'p2play-core/chat';
import type { ChatMessage } from 'p2play-core';
import { X } from 'lucide-react';

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

  if (!showDrawer) return null;

  return (
    <div className="absolute right-4 top-16 z-40 w-80 max-h-[75vh] bg-zinc-900/95 border border-violet-500/40 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex flex-col space-y-2 animate-in fade-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('journal')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'journal' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
              activeTab === 'chat' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Chat ({chatMessages.length})
          </button>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-hidden h-72">
        {activeTab === 'chat' ? (
          <TextChatPanel messages={chatMessages} onSend={sendChat} scrollbarAccent="violet" />
        ) : (
          <JournalPanel
            entries={gameState.journal.map((j) => ({
              id: j.id,
              timestamp: new Date(j.timestamp).toLocaleTimeString(),
              message: j.message,
              type: j.type === 'combat' ? 'action' : j.type === 'death' ? 'system' : 'info',
            }))}
            scrollbarAccent="violet"
          />
        )}
      </div>
    </div>
  );
};
