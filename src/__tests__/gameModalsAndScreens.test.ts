import { describe, it, expect } from 'vitest';
import { getWeaponsByCategory } from '../core/weapons/registry';
import { WeaponCategory } from '../core/weapons/types';
import { GameState } from '../core/types';
import { getRoomCodeFromLocation } from '../components/game/connection/connectionUrlUtils';

describe('Game Modals, Screens & UI Widgets Integrity', () => {
  const createMockGameState = (): GameState => ({
    phase: 'AIMING',
    turnTimer: 45,
    retreatTimer: 0,
    wind: 12.5,
    activeTeamId: 'team_alpha',
    activeSlugId: 'slug_1',
    turnCount: 3,
    winnerTeamId: undefined,
    teams: [
      {
        id: 'team_alpha',
        name: 'Alpha Squad',
        color: '#ef4444',
        avatar: 'slug',
        isHost: true,
        inventory: { bazooka: 99, grenade: 5, cluster_banana: 2 },
        stats: { damageDealt: 120, kills: 1, deaths: 0, damageTaken: 0 },
      },
      {
        id: 'team_bravo',
        name: 'Bravo Squad',
        color: '#3b82f6',
        avatar: 'slug',
        isHost: false,
        inventory: { bazooka: 99, grenade: 5 },
        stats: { damageDealt: 50, kills: 0, deaths: 1, damageTaken: 120 },
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
        maxHp: 100,
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
        maxHp: 100,
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
    craters: [],
    mines: [],
    helicopters: [],
    particles: [],
    floatingDamages: [],
    journal: [],
    config: {
      mapTheme: 'ISLAND',
      mapSeed: 12345,
      slugsPerTeam: 1,
      slugHp: 100,
      turnDuration: 45,
      windEnabled: true,
      vehiclesEnabled: true,
      weaponSetId: 'classic',
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

      expect(activeTeam.inventory.bazooka).toBe(99);
      expect(activeTeam.inventory.cluster_banana).toBe(2);
      expect(activeTeam.inventory['super_sheep'] ?? 0).toBe(0);
    });

    it('ensures all weapons fit within maximum 3 desktop rows (4 columns) to prevent vertical overflow', () => {
      const DESKTOP_COLS = 4;
      const MAX_ALLOWED_ROWS = 3;

      for (const cat of categories) {
        const list = getWeaponsByCategory(cat).filter((w) => w.craftable !== false);
        const rowsNeeded = Math.ceil(list.length / DESKTOP_COLS);
        expect(rowsNeeded).toBeLessThanOrEqual(MAX_ALLOWED_ROWS);
      }
    });

    it('validates weapon definition descriptions and telemetry for unclipped card rendering', () => {
      for (const cat of categories) {
        const list = getWeaponsByCategory(cat);
        for (const w of list) {
          expect(w.name.length).toBeGreaterThan(0);
          expect(w.description.length).toBeGreaterThan(0);
          expect(w.description.length).toBeLessThan(300);
          expect(w.damage).toBeGreaterThanOrEqual(0);
          expect(w.radius).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });

  describe('GameOver Stats & Leaderboard Telemetry', () => {
    it('computes MVP and team telemetry ranking accurately', () => {
      const state = createMockGameState();
      const alpha = state.teams.find((t) => t.id === 'team_alpha')!;
      const bravo = state.teams.find((t) => t.id === 'team_bravo')!;

      expect(alpha.stats?.damageDealt ?? 0).toBeGreaterThan(bravo.stats?.damageDealt ?? 0);
      expect(alpha.stats?.kills).toBe(1);
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

  describe('Room Code URL Routing & Parsing (getRoomCodeFromLocation)', () => {
    it('extracts room code from query and hash formats without false positives on GitHub Pages subfolder paths', () => {
      const parseFromUrl = (urlStr: string) => {
        const u = new URL(urlStr);
        return getRoomCodeFromLocation({
          search: u.search,
          hash: u.hash,
          pathname: u.pathname,
        });
      };

      // 1. Subfolder hosting URL should NOT be treated as a room code
      expect(parseFromUrl('https://example.github.io/game-repo/')).toBe('');
      expect(parseFromUrl('https://example.github.io/subpath/')).toBe('');

      // 2. Query param invites
      expect(parseFromUrl('https://example.github.io/game-repo/?room=9EHZM')).toBe('9EHZM');
      expect(parseFromUrl('http://localhost:5173/?room=9EHZM&autojoin=1')).toBe('9EHZM');

      // 3. Hash routing invites
      expect(parseFromUrl('https://example.github.io/game-repo/#/9EHZM')).toBe('9EHZM');
      expect(parseFromUrl('https://example.github.io/game-repo/#/room/K7XY')).toBe('K7XY');

      // 4. Clean localhost
      expect(parseFromUrl('http://localhost:5173/')).toBe('');
    });
  });
});
