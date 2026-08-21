import React, { useState, useRef, useEffect } from 'react';
import { GameState, JournalEntry } from '../../../core/types';
import type { ChatMessage } from 'p2play-core';
import { MessageSquare, Send, X, Sparkles } from 'lucide-react';

interface DesktopCombatLogProps {
  gameState: GameState;
  chatMessages: ChatMessage[];
  sendChat?: (text: string) => void;
  showDrawer: boolean;
  onToggleDrawer: () => void;
}

export const DesktopCombatLog: React.FC<DesktopCombatLogProps> = React.memo(({
  gameState,
  chatMessages,
  sendChat,
  showDrawer,
  onToggleDrawer,
}) => {
  const [isQuickChatOpen, setIsQuickChatOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey 'T' or 'Enter' to open quick chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 't' || e.key === 'T' || e.key === 'Enter') {
        e.preventDefault();
        setIsQuickChatOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) {
      setIsQuickChatOpen(false);
      return;
    }
    sendChat?.(text);
    setInputText('');
    setIsQuickChatOpen(false);
  };

  // Extract recent logs & messages for the floating feed (last 3 items)
  const recentItems = [
    ...(gameState.journal || []).slice(-3).map((j: JournalEntry) => ({
      id: `j_${j.timestamp}_${j.message}`,
      text: j.message,
      type: j.type || 'info',
      isSystem: true,
      timestamp: j.timestamp,
    })),
    ...chatMessages.slice(-3).map((c, idx) => ({
      id: `c_${idx}_${c.time}`,
      text: `${c.sender}: ${c.text}`,
      type: 'chat',
      isSystem: false,
      timestamp: Date.now(),
    })),
  ].sort((a, b) => a.timestamp - b.timestamp).slice(-3);

  return (
    <div className="pointer-events-auto flex flex-col items-start gap-1.5 max-w-sm select-none">
      {/* Floating Recent Events Feed */}
      {!isQuickChatOpen && recentItems.length > 0 && (
        <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
          {recentItems.map((item) => (
            <div
              key={item.id}
              className={`px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-xl border shadow-lg truncate max-w-full ${
                item.isSystem
                  ? item.type === 'danger'
                    ? 'bg-red-950/80 border-red-500/50 text-red-200'
                    : item.type === 'turn'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                    : 'bg-zinc-950/75 border-zinc-800/80 text-zinc-300'
                  : 'bg-violet-950/80 border-violet-500/60 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              }`}
            >
              {item.text}
            </div>
          ))}
        </div>
      )}

      {/* Quick Chat Bar or Drawer Trigger */}
      {isQuickChatOpen ? (
        <form
          onSubmit={handleSend}
          className="flex items-center gap-1.5 bg-zinc-950/95 border border-violet-500/80 backdrop-blur-2xl p-1.5 rounded-2xl shadow-2xl w-80 animate-in zoom-in-95 duration-100"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setIsQuickChatOpen(false);
            }}
            placeholder="Message d'escouade... (Échap pour fermer)"
            maxLength={120}
            className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-3 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-400"
          />
          <button
            type="submit"
            className="p-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl shadow transition"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsQuickChatOpen(false)}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-xl transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </form>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDrawer}
            className={`px-3 py-1.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shadow-2xl backdrop-blur-2xl active:scale-95 ${
              showDrawer
                ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_15px_#8b5cf6]'
                : 'bg-zinc-950/85 hover:bg-zinc-900 border-zinc-800/90 text-zinc-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Journal & Chat</span>
            <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded-md">
              [T]
            </span>
            {chatMessages.length > 0 && (
              <span className="px-1.5 py-0.2 bg-violet-950 border border-violet-500/50 rounded-full text-[10px] text-violet-300 font-mono font-black">
                {chatMessages.length}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
});

DesktopCombatLog.displayName = 'DesktopCombatLog';
