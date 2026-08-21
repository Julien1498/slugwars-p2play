import React, { useState, useRef, useEffect } from 'react';
import { GameState, JournalEntry } from '../../../core/types';
import type { ChatMessage } from 'p2play-core';
import { MessageSquare, Send, X, ScrollText, Sparkles, Skull, Zap, Rocket, Info } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'journal' | 'chat'>('journal');
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Global hotkey 'T' or 'Enter' to open chat
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 't' || e.key === 'T' || e.key === 'Enter') {
        e.preventDefault();
        setActiveTab('chat');
        if (!showDrawer) {
          onToggleDrawer();
        }
        setTimeout(() => inputRef.current?.focus(), 80);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDrawer, onToggleDrawer]);

  // Auto-scroll to bottom when new logs or messages arrive
  useEffect(() => {
    if (showDrawer && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [showDrawer, activeTab, gameState.journal, chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendChat?.(text);
    setInputText('');
  };

  // Recent floating feed events (last 3 items)
  const recentEvents = [
    ...(gameState.journal || []).slice(-4).map((j: JournalEntry) => ({
      id: `j_${j.id || j.timestamp}_${j.message}`,
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
  ].slice(-3);

  const getLogIcon = (type?: string) => {
    switch (type) {
      case 'death':
        return <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />;
      case 'combat':
        return <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
      case 'weapon':
        return <Rocket className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      default:
        return <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />;
    }
  };

  return (
    <div className="relative pointer-events-auto flex flex-col items-start gap-1.5 max-w-sm select-none">
      {/* ========================================================================= */}
      {/* 1. EXPANDED TACTICAL POPOVER (ANCHORED DIRECTLY ABOVE BUTTON)              */}
      {/* ========================================================================= */}
      {showDrawer && (
        <div className="absolute bottom-12 left-0 z-50 w-96 h-[420px] max-h-[70vh] bg-zinc-950/95 border border-zinc-700/90 backdrop-blur-2xl rounded-3xl p-3.5 shadow-[0_20px_60px_rgba(0,0,0,0.95)] flex flex-col space-y-2.5 animate-in fade-in slide-in-from-bottom-4 duration-150">
          {/* Header & Tab Switcher */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2 shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'journal'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Journal</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono">
                  {gameState.journal?.length || 0}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('chat');
                  setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'chat'
                    ? 'bg-violet-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
                {chatMessages.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 bg-black/40 rounded-full font-mono">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onToggleDrawer}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition active:scale-95"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Content: Journal Log */}
          {activeTab === 'journal' ? (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700"
            >
              {gameState.journal && gameState.journal.length > 0 ? (
                gameState.journal.map((j) => (
                  <div
                    key={j.id}
                    className={`p-2 rounded-xl border flex items-start gap-2 leading-relaxed ${
                      j.type === 'death'
                        ? 'bg-red-950/40 border-red-500/40 text-red-200'
                        : j.type === 'combat'
                        ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                        : j.type === 'weapon'
                        ? 'bg-sky-950/40 border-sky-500/40 text-sky-200'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-300'
                    }`}
                  >
                    {getLogIcon(j.type)}
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 font-mono">
                        {new Date(j.timestamp).toLocaleTimeString()}
                      </div>
                      <div className="font-medium mt-0.5">{j.message}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                  Aucun événement de combat pour le moment.
                </div>
              )}
            </div>
          ) : (
            /* Tab Content: Squad Chat */
            <div className="flex-1 flex flex-col min-h-0 space-y-2">
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-1 space-y-1.5 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700"
              >
                {chatMessages.length > 0 ? (
                  chatMessages.map((c, i) => (
                    <div key={i} className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200">
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-zinc-400">
                        <span className="font-bold text-violet-400">{c.sender}</span>
                        <span>{c.time}</span>
                      </div>
                      <div className="mt-1 font-medium text-zinc-100 break-words">{c.text}</div>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-zinc-500 text-xs italic">
                    Pas de message. Utilisez le champ ci-dessous pour discuter.
                  </div>
                )}
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSend} className="flex items-center gap-1.5 pt-2 border-t border-zinc-800 shrink-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Message d'escouade..."
                  maxLength={140}
                  className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500 shadow-inner"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white rounded-xl font-bold text-xs shadow transition active:scale-95 flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECENT COMPACT FLOATING FEED (WHEN PANEL IS CLOSED)                     */}
      {/* ========================================================================= */}
      {!showDrawer && recentEvents.length > 0 && (
        <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
          {recentEvents.map((item) => (
            <div
              key={item.id}
              className={`px-3 py-1 rounded-xl text-xs font-semibold backdrop-blur-xl border shadow-lg truncate max-w-full flex items-center gap-1.5 ${
                item.isSystem
                  ? item.type === 'death'
                    ? 'bg-red-950/80 border-red-500/50 text-red-200'
                    : item.type === 'combat'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-200'
                    : item.type === 'weapon'
                    ? 'bg-sky-950/80 border-sky-500/50 text-sky-200'
                    : 'bg-zinc-950/80 border-zinc-800/90 text-zinc-300'
                  : 'bg-violet-950/80 border-violet-500/60 text-violet-200 shadow-[0_0_12px_rgba(139,92,246,0.3)]'
              }`}
            >
              {item.isSystem && getLogIcon(item.type)}
              <span className="truncate">{item.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRIGGER BUTTON                                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDrawer}
          className={`px-3.5 py-2 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 shadow-2xl backdrop-blur-2xl active:scale-95 ${
            showDrawer
              ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_20px_#8b5cf6]'
              : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-800/90 text-zinc-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Journal & Chat</span>
          <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.2 rounded-md">
            [T]
          </span>
          {chatMessages.length > 0 && (
            <span className="px-1.5 py-0.2 bg-violet-950 border border-violet-500/50 rounded-full text-[10px] text-violet-300 font-mono font-black">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>
    </div>
  );
});

DesktopCombatLog.displayName = 'DesktopCombatLog';
