import { Team, GameState, JournalEntry } from '../../../../core/types';
import type { ChatMessage } from 'p2play-core';

export interface DesktopCombatLogProps {
  gameState: GameState;
  chatMessages: ChatMessage[];
  sendChat?: (text: string) => void;
  showDrawer: boolean;
  onToggleDrawer: () => void;
}

export interface RecentChatEvent {
  id: string;
  senderDisplayName: string;
  senderColor: string;
  text: string;
  timestamp: number;
}

export interface LogMeta {
  badge: string;
  badgeStyle: string;
  cardStyle: string;
  iconType: 'death' | 'combat' | 'weapon' | 'info';
}

export function getLogMeta(type?: string): LogMeta {
  switch (type) {
    case 'death':
      return {
        badge: 'ÉLIMINATION',
        badgeStyle: 'bg-red-950/80 text-red-400 border-red-500/40',
        cardStyle: 'bg-gradient-to-r from-red-950/30 to-zinc-950/80 border-l-2 border-l-red-500 border-zinc-800/80 text-red-200',
        iconType: 'death',
      };
    case 'combat':
      return {
        badge: 'IMPACT',
        badgeStyle: 'bg-amber-950/80 text-amber-400 border-amber-500/40',
        cardStyle: 'bg-gradient-to-r from-amber-950/30 to-zinc-950/80 border-l-2 border-l-amber-500 border-zinc-800/80 text-amber-100',
        iconType: 'combat',
      };
    case 'weapon':
      return {
        badge: 'TACTIQUE',
        badgeStyle: 'bg-sky-950/80 text-sky-400 border-sky-500/40',
        cardStyle: 'bg-gradient-to-r from-sky-950/30 to-zinc-950/80 border-l-2 border-l-sky-500 border-zinc-800/80 text-sky-100',
        iconType: 'weapon',
      };
    default:
      return {
        badge: 'SYSTÈME',
        badgeStyle: 'bg-zinc-900 text-zinc-400 border-zinc-700/50',
        cardStyle: 'bg-zinc-900/50 border-l-2 border-l-violet-500 border-zinc-800 text-zinc-300',
        iconType: 'info',
      };
  }
}

export function formatChatSender(
  sender: string,
  senderPeerId: string | undefined,
  teams: Team[]
): { displayName: string; color: string; avatar: string } {
  const senderTeam = teams.find(
    (t) => t.id === senderPeerId || t.name === sender || t.id === sender
  );

  const displayName =
    senderTeam?.name ||
    (sender.startsWith('Joueur-') ? `Limace (${sender.slice(7)})` : sender);

  const color = senderTeam?.color || '#a78bfa';
  const avatar = senderTeam?.avatar || '💬';

  return { displayName, color, avatar };
}

export function extractRecentChatEvents(
  chatMessages: ChatMessage[],
  teams: Team[],
  currentTime: number,
  timestampsMap: Map<string, number>,
  fadeDurationMs = 6000
): RecentChatEvent[] {
  const recentChat = chatMessages.slice(-4).map((c, idx) => {
    const { displayName, color } = formatChatSender(c.sender, c.senderPeerId, teams);
    const msgKey = `${c.sender}_${c.text}_${c.time || ''}_${idx}`;
    if (!timestampsMap.has(msgKey)) {
      timestampsMap.set(msgKey, currentTime);
    }
    const timestamp = timestampsMap.get(msgKey)!;
    return {
      id: `c_${msgKey}`,
      senderDisplayName: displayName,
      senderColor: color,
      text: c.text,
      timestamp,
    };
  });

  return recentChat
    .filter((e) => currentTime - e.timestamp < fadeDurationMs)
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-3);
}

export function computeChatOpacity(ageMs: number, fadeDurationMs = 6000): number {
  const fadeStart = fadeDurationMs - 1500;
  if (ageMs <= fadeStart) return 1;
  if (ageMs >= fadeDurationMs) return 0;
  return Math.max(0.1, 1 - (ageMs - fadeStart) / 1500);
}
