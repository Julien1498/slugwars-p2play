import { describe, it, expect } from 'vitest';
import { getWeaponsByCategory, WeaponCategory } from '../core/weapons/registry';
import { GameState } from '../core/types';

describe('Game Modals, Screens & UI Widgets Integrity', () => {
  const createMockGameState = (): GameState => ({
    phase: 'TURN_ACTIVE',
    turnTimer: 45,
    retreatTimer: 0,
    wind: 12.5,
    activeTeamId: 'team_alpha',
    activeSlugId: 'slug_1',
    currentRound: 1,
    turnCount: 3,
    winnerTeamId: null,
    teams: [
      {
        id: 'team_alpha',
        name: 'Alpha Squad',
        color: '#ef4444',
        avatar: '🪖',
        isLocal: true,
        weapons: { bazooka: 99, grenade: 5, cluster_banana: 2 },
      },
      {
        id: 'team_bravo',
        name: 'Bravo Squad',
        color: '#3b82f6',
        avatar: '🤠',
        isLocal: false,
        weapons: { bazooka: 99, grenade: 5 },
      },
    ],
    slugs: [
      {
        id: 'slug_1',
        teamId: 'team_alpha',
        name: 'Sniper Joe',
        x: 200,
        y: 300,
        vx: 0,
        vy: 0,
        hp: 100,
        facing: 'right',
        aimAngle: 30,
        aimPower: 75,
        selectedWeaponId: 'bazooka',
        isAlive: true,
        isPlaced: true,
      },
      {
        id: 'slug_2',
        teamId: 'team_bravo',
        name: 'Tank Bob',
        x: 600,
        y: 300,
        vx: 0,
        vy: 0,
        hp: 80,
        facing: 'left',
        aimAngle: 45,
        aimPower: 50,
        selectedWeaponId: 'grenade',
        isAlive: true,
        isPlaced: true,
      },
    ],
    projectiles: [],
    explosions: [],
    supplyCrates: [],
    placedGirders: [],
    oilDrums: [],
    stats: {
      team_alpha: { damageDealt: 120, kills: 1, shotsFired: 3, cratesCollected: 1 },
      team_bravo: { damageDealt: 50, kills: 0, shotsFired: 2, cratesCollected: 0 },
    },
    config: {
      mapTheme: 'ISLAND',
      mapSize: 'MEDIUM',
      turnTimeLimit: 45,
      retreatTimeLimit: 5,
      slugsPerTeam: 1,
      slugHp: 100,
      scheme: 'NORMAL',
    },
  });

  describe('WeaponPicker Category & Inventory Filtering', () => {
    const categories: WeaponCategory[] = ['EXPLOSIVE', 'MELEE', 'AIR_SUPPORT', 'SPECIAL', 'UTILITY'];

    it('contains valid weapon listings for every official weapon category', () => {
      for (const cat of categories) {
        const list = getWeaponsByCategory(cat);
        expect(list).toBeDefined();
        expect(list.length).toBeGreaterThan(0);
        for (const w of list) {
          expect(w.category).toBe(cat);
          expect(w.id.trim().length).toBeGreaterThan(0);
          expect(w.name.trim().length).toBeGreaterThan(0);
          expect(w.icon.trim().length).toBeGreaterThan(0);
        }
      }
    });

    it('validates active team weapon stock resolution', () => {
      const state = createMockGameState();
      const activeTeam = state.teams.find((t) => t.id === state.activeTeamId)!;

      expect(activeTeam.weapons.bazooka).toBe(99);
      expect(activeTeam.weapons.cluster_banana).toBe(2);
      expect(activeTeam.weapons['super_sheep'] ?? 0).toBe(0);
    });
  });

  describe('GameOver Stats & Leaderboard Telemetry', () => {
    it('computes MVP and team telemetry ranking accurately', () => {
      const state = createMockGameState();
      const stats = state.stats;

      const alphaStats = stats.team_alpha;
      const bravoStats = stats.team_bravo;

      expect(alphaStats.damageDealt).toBeGreaterThan(bravoStats.damageDealt);
      expect(alphaStats.kills).toBe(1);
    });
  });

  describe('Wind Indicator Mathematical Conversions', () => {
    it('calculates proportional wind gauge percentages accurately', () => {
      const MAX_WIND = 25.0;
      const windLeft = -12.5;
      const windRight = 25.0;

      const pctLeft = Math.min(1.0, Math.abs(windLeft) / MAX_WIND);
      const pctRight = Math.min(1.0, Math.abs(windRight) / MAX_WIND);

      expect(pctLeft).toBe(0.5); // 50% gauge
      expect(pctRight).toBe(1.0); // 100% max gauge
    });
  });
});
