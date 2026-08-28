import React from 'react';
import { MessageSquare } from 'lucide-react';
import { RecentChatEvent, computeChatOpacity } from './combatLogUtils';

interface CombatLogFloatingPreviewProps {
  recentChatEvents: RecentChatEvent[];
  currentTime: number;
}

export const CombatLogFloatingPreview: React.FC<CombatLogFloatingPreviewProps> = ({
  recentChatEvents,
  currentTime,
}) => {
  if (recentChatEvents.length === 0) return null;

  return (
    <div className="flex flex-col gap-1 w-full animate-in fade-in duration-200">
      {recentChatEvents.map((item) => {
        const ageMs = currentTime - item.timestamp;
        const opacity = computeChatOpacity(ageMs);
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
  );
};
