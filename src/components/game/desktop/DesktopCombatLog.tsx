import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageSquare, X, ScrollText } from 'lucide-react';
import { isActionKey } from '../../../core/input';
import {
  DesktopCombatLogProps,
  extractRecentChatEvents,
} from './combatLog/combatLogUtils';
import { CombatLogJournalTab } from './combatLog/CombatLogJournalTab';
import { CombatLogChatTab } from './combatLog/CombatLogChatTab';
import { CombatLogFloatingPreview } from './combatLog/CombatLogFloatingPreview';

export type { DesktopCombatLogProps };

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

  // Global hotkey 'T' to open chat (never 'Enter' while playing!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (isActionKey(e.key, 'TOGGLE_CHAT')) {
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

  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const chatTimestampsRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    sendChat?.(text);
    setInputText('');
  };

  const recentChatEvents = extractRecentChatEvents(
    chatMessages,
    gameState.teams,
    currentTime,
    chatTimestampsRef.current
  );

  const chronologicalJournal = useMemo(() => {
    return [...(gameState.journal || [])].reverse();
  }, [gameState.journal]);

  return (
    <div className="relative pointer-events-auto flex flex-col items-start gap-1.5 max-w-sm select-none">
      {/* 1. EXPANDED TACTICAL POPOVER */}
      {showDrawer && (
        <div className="absolute bottom-12 left-0 z-50 w-[420px] h-[460px] max-h-[72vh] bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_24px_70px_rgba(0,0,0,0.95)] flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-150">
          {/* Header & High-Tech Segmented Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800/90 pb-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'journal'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-102'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>Journal de Combat</span>
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'chat'
                    ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-102'
                    : 'text-zinc-400 hover:text-zinc-200'
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
              onClick={onToggleDrawer}
              className="p-2 hover:bg-zinc-900 active:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition border border-transparent hover:border-zinc-800 active:scale-95 cursor-pointer"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Content: Journal Log vs Squad Chat */}
          {activeTab === 'journal' ? (
            <CombatLogJournalTab
              journal={chronologicalJournal}
              scrollContainerRef={scrollContainerRef}
            />
          ) : (
            <CombatLogChatTab
              chatMessages={chatMessages}
              teams={gameState.teams}
              scrollContainerRef={scrollContainerRef}
              inputText={inputText}
              setInputText={setInputText}
              inputRef={inputRef}
              onSend={handleSend}
            />
          )}
        </div>
      )}

      {/* 2. RECENT COMPACT FLOATING CHAT PREVIEW */}
      {!showDrawer && (
        <CombatLogFloatingPreview
          recentChatEvents={recentChatEvents}
          currentTime={currentTime}
        />
      )}

      {/* 3. TRIGGER BUTTON */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDrawer}
          className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 shadow-2xl backdrop-blur-2xl active:scale-95 cursor-pointer ${
            showDrawer
              ? 'bg-violet-600 border-violet-400 text-white shadow-[0_0_20px_#8b5cf6]'
              : 'bg-zinc-950/90 hover:bg-zinc-900 border-zinc-800/90 text-zinc-300 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4 text-violet-400" />
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
