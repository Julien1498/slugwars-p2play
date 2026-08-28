import { describe, it, expect } from 'vitest';
import { Team } from '../core/types';
import type { ChatMessage } from 'p2play-core';
import {
  getLogMeta,
  formatChatSender,
  extractRecentChatEvents,
  computeChatOpacity,
} from '../components/game/desktop/combatLog/combatLogUtils';

describe('DesktopCombatLog Utilities & Formatters', () => {
  const mockTeams: Team[] = [
    {
      id: 'team_red',
      name: 'Rouges',
      color: '#ef4444',
      avatar: '🐌',
      isHost: true,
      inventory: {},
      stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
    },
    {
      id: 'team_blue',
      name: 'Bleus',
      color: '#3b82f6',
      avatar: '🚀',
      isHost: false,
      inventory: {},
      stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
    },
  ];

  describe('getLogMeta()', () => {
    it('returns death metadata with red badges and styling', () => {
      const meta = getLogMeta('death');
      expect(meta.badge).toBe('ÉLIMINATION');
      expect(meta.iconType).toBe('death');
      expect(meta.badgeStyle).toContain('text-red-400');
      expect(meta.cardStyle).toContain('border-l-red-500');
    });

    it('returns combat metadata with amber badges and styling', () => {
      const meta = getLogMeta('combat');
      expect(meta.badge).toBe('IMPACT');
      expect(meta.iconType).toBe('combat');
      expect(meta.badgeStyle).toContain('text-amber-400');
      expect(meta.cardStyle).toContain('border-l-amber-500');
    });

    it('returns weapon metadata with sky-blue badges and styling', () => {
      const meta = getLogMeta('weapon');
      expect(meta.badge).toBe('TACTIQUE');
      expect(meta.iconType).toBe('weapon');
      expect(meta.badgeStyle).toContain('text-sky-400');
      expect(meta.cardStyle).toContain('border-l-sky-500');
    });

    it('returns system fallback metadata for unknown or info logs', () => {
      const meta = getLogMeta('info');
      expect(meta.badge).toBe('SYSTÈME');
      expect(meta.iconType).toBe('info');
      expect(meta.badgeStyle).toContain('text-zinc-400');
      expect(meta.cardStyle).toContain('border-l-violet-500');
    });
  });

  describe('formatChatSender()', () => {
    it('matches sender by team ID or team name with color and avatar', () => {
      const info = formatChatSender('Rouges', 'team_red', mockTeams);
      expect(info.displayName).toBe('Rouges');
      expect(info.color).toBe('#ef4444');
      expect(info.avatar).toBe('🐌');
    });

    it('formats generic Joueur-XXXX into Limace (XXXX)', () => {
      const info = formatChatSender('Joueur-8821', undefined, mockTeams);
      expect(info.displayName).toBe('Limace (8821)');
      expect(info.color).toBe('#a78bfa');
    });

    it('retains custom username when team is not found', () => {
      const info = formatChatSender('SniperSlug', undefined, mockTeams);
      expect(info.displayName).toBe('SniperSlug');
      expect(info.color).toBe('#a78bfa');
    });
  });

  describe('extractRecentChatEvents() and computeChatOpacity()', () => {
    it('extracts recent chats and filters expired messages older than 6s', () => {
      const messages: ChatMessage[] = [
        { type: 'CHAT', sender: 'Rouges', text: 'En avant !', time: '14:00' },
        { type: 'CHAT', sender: 'Bleus', text: 'Attention à la grenade', time: '14:01' },
      ];

      const timestampsMap = new Map<string, number>();
      const now = 10000;

      // Message 1 arrived at t=2000 (8s ago -> expired)
      timestampsMap.set('Rouges_En avant !_14:00_0', 2000);
      // Message 2 arrived at t=8000 (2s ago -> active)
      timestampsMap.set('Bleus_Attention à la grenade_14:01_1', 8000);

      const events = extractRecentChatEvents(messages, mockTeams, now, timestampsMap, 6000);
      expect(events).toHaveLength(1);
      expect(events[0].text).toBe('Attention à la grenade');
      expect(events[0].senderDisplayName).toBe('Bleus');
    });

    it('computes smooth opacity fading over the final 1.5 seconds', () => {
      // 0-4.5s -> opacity = 1
      expect(computeChatOpacity(1000, 6000)).toBe(1);
      expect(computeChatOpacity(4500, 6000)).toBe(1);

      // 5.25s (halfway through fade) -> opacity = ~0.5
      expect(computeChatOpacity(5250, 6000)).toBeCloseTo(0.5, 1);

      // >= 6.0s -> opacity = 0
      expect(computeChatOpacity(6000, 6000)).toBe(0);
      expect(computeChatOpacity(7000, 6000)).toBe(0);
    });
  });
});
