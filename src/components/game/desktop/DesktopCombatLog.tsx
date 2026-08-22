import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GameState, JournalEntry } from '../../../core/types';
import type { ChatMessage } from 'p2play-core';
import { MessageSquare, Send, X, ScrollText, Skull, Zap, Rocket, Info, Sparkles, ShieldAlert } from 'lucide-react';

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

  // Global hotkey 'T' to open chat (never 'Enter' while playing!)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement?.tagName || '').toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea') return;

      if (e.key === 't' || e.key === 'T') {
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

  const FADE_DURATION_MS = 6000;

  // Extract recent chat messages for the compact floating preview (only chat, no combat logs!)
  const recentChat = chatMessages.slice(-4).map((c, idx) => {
    const senderTeam = gameState.teams.find(
      (t) => t.id === c.senderPeerId || t.name === c.sender || t.id === c.sender
    );
    const senderDisplayName = senderTeam?.name || (c.sender.startsWith('Joueur-') ? `Limace (${c.sender.slice(7)})` : c.sender);
    const senderColor = senderTeam?.color || '#c084fc';
    const msgKey = `${c.sender}_${c.text}_${c.time || ''}_${idx}`;
    if (!chatTimestampsRef.current.has(msgKey)) {
      chatTimestampsRef.current.set(msgKey, Date.now());
    }
    const timestamp = chatTimestampsRef.current.get(msgKey)!;
    return {
      id: `c_${msgKey}`,
      senderDisplayName,
      senderColor,
      text: c.text,
      timestamp,
    };
  });

  const recentChatEvents = recentChat
    .filter((e) => currentTime - e.timestamp < FADE_DURATION_MS)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-3);

  // Chronological journal order (oldest at top -> newest at bottom, for natural bottom scroll)
  const chronologicalJournal = useMemo(() => {
    return [...(gameState.journal || [])].reverse();
  }, [gameState.journal]);

  const getLogMeta = (type?: string) => {
    switch (type) {
      case 'death':
        return {
          icon: <Skull className="w-3.5 h-3.5 text-red-400 shrink-0" />,
          badge: 'ÉLIMINATION',
          badgeStyle: 'bg-red-950/80 text-red-400 border-red-500/40',
          cardStyle: 'bg-gradient-to-r from-red-950/30 to-zinc-950/80 border-l-2 border-l-red-500 border-zinc-800/80 text-red-200',
        };
      case 'combat':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
          badge: 'IMPACT',
          badgeStyle: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
          cardStyle: 'bg-gradient-to-r from-amber-950/30 to-zinc-950/80 border-l-2 border-l-amber-500 border-zinc-800/80 text-amber-100',
        };
      case 'weapon':
        return {
          icon: <Rocket className="w-3.5 h-3.5 text-sky-400 shrink-0" />,
          badge: 'TACTIQUE',
          badgeStyle: 'bg-sky-950/80 text-sky-400 border-sky-500/40',
          cardStyle: 'bg-gradient-to-r from-sky-950/30 to-zinc-950/80 border-l-2 border-l-sky-500 border-zinc-800/80 text-sky-100',
        };
      default:
        return {
          icon: <Info className="w-3.5 h-3.5 text-violet-400 shrink-0" />,
          badge: 'SYSTÈME',
          badgeStyle: 'bg-zinc-900 text-zinc-400 border-zinc-700/50',
          cardStyle: 'bg-zinc-900/50 border-l-2 border-l-violet-500 border-zinc-800 text-zinc-300',
        };
    }
  };

  return (
    <div className="relative pointer-events-auto flex flex-col items-start gap-1.5 max-w-sm select-none">
      {/* ========================================================================= */}
      {/* 1. EXPANDED TACTICAL POPOVER (ANCHORED DIRECTLY ABOVE BUTTON)              */}
      {/* ========================================================================= */}
      {showDrawer && (
        <div className="absolute bottom-12 left-0 z-50 w-[420px] h-[460px] max-h-[72vh] bg-zinc-950/95 border border-zinc-700/80 backdrop-blur-2xl rounded-3xl p-4 shadow-[0_24px_70px_rgba(0,0,0,0.95)] flex flex-col space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-150">
          {/* Header & High-Tech Segmented Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800/90 pb-2.5 shrink-0">
            <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                type="button"
                onClick={() => setActiveTab('journal')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${
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
              className="p-2 hover:bg-zinc-900 active:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition border border-transparent hover:border-zinc-800 active:scale-95"
              title="Fermer (Échap)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Content: Journal Log */}
          {activeTab === 'journal' ? (
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto pr-1.5 space-y-2 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700/80 scrollbar-track-zinc-900/40"
            >
              {chronologicalJournal.length > 0 ? (
                chronologicalJournal.map((j) => {
                  const meta = getLogMeta(j.type);
                  return (
                    <div
                      key={j.id}
                      className={`p-2.5 rounded-2xl border backdrop-blur-md transition shadow-sm ${meta.cardStyle}`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {meta.icon}
                          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded border font-mono ${meta.badgeStyle}`}>
                            {meta.badge}
                          </span>
                        </div>
                        <span className="text-[10px] text-zinc-500 font-mono">
                          {new Date(j.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="font-semibold text-xs leading-snug pl-5">
                        {j.message}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs italic gap-2">
                  <ShieldAlert className="w-8 h-8 text-zinc-700" />
                  <span>Aucun événement de combat enregistré pour l'instant.</span>
                </div>
              )}
            </div>
          ) : (
            /* Tab Content: Squad Chat */
            <div className="flex-1 flex flex-col min-h-0 space-y-2.5">
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-1.5 space-y-2 text-xs select-text scrollbar-thin scrollbar-thumb-zinc-700/80 scrollbar-track-zinc-900/40"
              >
                {chatMessages.length > 0 ? (
                  chatMessages.map((c, i) => {
                    const senderTeam = gameState.teams.find(
                      (t) => t.id === c.senderPeerId || t.name === c.sender || t.id === c.sender
                    );
                    const displayName = senderTeam?.name || (c.sender.startsWith('Joueur-') ? `Limace (${c.sender.slice(7)})` : c.sender);
                    const teamColor = senderTeam?.color || '#a78bfa';
                    const teamAvatar = senderTeam?.avatar || '💬';
                    return (
                      <div
                        key={i}
                        className="p-2.5 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 text-zinc-200 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2 text-[10px] font-mono mb-1">
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full shadow-[0_0_6px]" style={{ backgroundColor: teamColor }} />
                            <span>{teamAvatar}</span>
                            <span className="font-black" style={{ color: teamColor }}>{displayName}</span>
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
              <form onSubmit={handleSend} className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 shrink-0">
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
                  className="px-4 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 text-white rounded-2xl font-black text-xs shadow-lg transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RECENT COMPACT FLOATING CHAT PREVIEW (WHEN PANEL IS CLOSED)             */}
      {/* ========================================================================= */}
      {!showDrawer && recentChatEvents.length > 0 && (
        <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
          {recentChatEvents.map((item) => {
            const ageMs = currentTime - item.timestamp;
            const isFading = ageMs > FADE_DURATION_MS - 1500;
            const opacity = isFading ? Math.max(0.1, 1 - (ageMs - (FADE_DURATION_MS - 1500)) / 1500) : 1;
            return (
              <div
                key={item.id}
                style={{ opacity }}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-xl border border-violet-500/50 bg-zinc-950/90 text-violet-100 shadow-[0_4px_20px_rgba(0,0,0,0.85)] truncate max-w-full flex items-center gap-2 transition-opacity duration-300"
              >
                <MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="font-bold shrink-0" style={{ color: item.senderColor }}>
                  {item.senderDisplayName}:
                </span>
                <span className="truncate text-zinc-100">{item.text}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. TRIGGER BUTTON                                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleDrawer}
          className={`px-3.5 py-2 rounded-2xl border text-xs font-black transition-all flex items-center gap-2 shadow-2xl backdrop-blur-2xl active:scale-95 ${
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
