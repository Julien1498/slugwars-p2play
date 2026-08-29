import { describe, it, expect } from 'vitest';
import { GameState, Team, Slug } from '../core/types';
import {
  DesktopTopHeaderProps,
  computeDesktopTeamStats,
  isDesktopTurnTimeUrgent,
  getSlugHpColor,
  desktopTopHeaderPropsAreEqual,
} from '../components/game/desktop/topHeader/desktopHeaderUtils';

describe('DesktopTopHeader: Calculations & React.memo Selector', () => {
  const createMockGameState = (): GameState => {
    const teams: Team[] = [
      {
        id: 'team_red',
        name: 'Red Dragons',
        color: '#ef4444',
        avatar: 'slug',
        isHost: true,
        inventory: { bazooka: -1 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'team_blue',
        name: 'Blue Sharks',
        color: '#3b82f6',
        avatar: 'snail',
        isHost: false,
        inventory: { bazooka: -1 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
    ];

    const slugs: Slug[] = [
      {
        id: 'slug_1',
        teamId: 'team_red',
        name: 'Red Leader',
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        aimAngle: 0,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
        facing: 'right',
      },
      {
        id: 'slug_2',
        teamId: 'team_red',
        name: 'Red Scout',
        x: 150,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 100,
        maxHp: 100,
        isAlive: true,
        aimAngle: 0,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
        facing: 'right',
      },
      {
        id: 'slug_3',
        teamId: 'team_blue',
        name: 'Blue Leader',
        x: 600,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 75,
        maxHp: 100,
        isAlive: true,
        aimAngle: 0,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
        facing: 'left',
      },
      {
        id: 'slug_4',
        teamId: 'team_blue',
        name: 'Blue Scout',
        x: 650,
        y: 200,
        vx: 0,
        vy: 0,
        hp: 0,
        maxHp: 100,
        isAlive: false,
        aimAngle: 0,
        aimPower: 50,
        selectedWeaponId: 'bazooka',
        facing: 'left',
      },
    ];

    return {
      phase: 'AIMING',
      turnTimer: 28.5,
      retreatTimer: 4.0,
      turnCount: 1,
      activeTeamId: 'team_red',
      activeSlugId: 'slug_1',
      wind: 0.35,
      waterLevel: 450,
      teams,
      slugs,
      mines: [],
      helicopters: [],
      projectiles: [],
      explosions: [],
      particles: [],
      floatingDamages: [],
      journal: [],
      config: {
        weaponSetId: 'classic',
        turnDuration: 30,
        slugsPerTeam: 2,
        slugHp: 100,
        windEnabled: true,
        vehiclesEnabled: true,
        mapTheme: 'ISLAND',
        mapSeed: 12345,
      },
    };
  };

  describe('computeDesktopTeamStats()', () => {
    it('aggregates alive slugs, total HP, and calculates percentages against team capacity', () => {
      const state = createMockGameState();
      const stats = computeDesktopTeamStats(state);

      expect(stats).toHaveLength(2);

      const red = stats.find((s) => s.team.id === 'team_red')!;
      expect(red.aliveSlugs).toBe(2);
      expect(red.totalSlugs).toBe(2);
      expect(red.totalHp).toBe(200);
      expect(red.maxHp).toBe(200);
      expect(red.hpPercent).toBe(1.0);
      expect(red.isActive).toBe(true);

      const blue = stats.find((s) => s.team.id === 'team_blue')!;
      expect(blue.aliveSlugs).toBe(1);
      expect(blue.totalSlugs).toBe(2);
      expect(blue.totalHp).toBe(75);
      expect(blue.hpPercent).toBeCloseTo(0.375, 3);
      expect(blue.isActive).toBe(false);
    });

    it('falls back safely to default slugsPerTeam and slugHp if undefined', () => {
      const state = createMockGameState();
      (state.config as any).slugsPerTeam = undefined;
      (state.config as any).slugHp = undefined;

      const stats = computeDesktopTeamStats(state);
      expect(stats[0].maxHp).toBe(200); // 2 * 100
    });
  });

  describe('isDesktopTurnTimeUrgent() and HP gauge color resolver', () => {
    it('marks timer as urgent when 10s or less during AIMING phase', () => {
      expect(isDesktopTurnTimeUrgent(10.0, 'AIMING')).toBe(true);
      expect(isDesktopTurnTimeUrgent(4.5, 'AIMING')).toBe(true);
      expect(isDesktopTurnTimeUrgent(1.0, 'AIMING')).toBe(true);

      expect(isDesktopTurnTimeUrgent(10.5, 'AIMING')).toBe(false);
      expect(isDesktopTurnTimeUrgent(0, 'AIMING')).toBe(false);
      expect(isDesktopTurnTimeUrgent(undefined, 'AIMING')).toBe(false);
      expect(isDesktopTurnTimeUrgent(5.0, 'RETREAT')).toBe(false);
      expect(isDesktopTurnTimeUrgent(5.0, 'FIRING')).toBe(false);
    });

    it('resolves green, amber, or red HP bar colors based on health percentage', () => {
      expect(getSlugHpColor(0.85)).toBe('#10b981');
      expect(getSlugHpColor(0.51)).toBe('#10b981');
      expect(getSlugHpColor(0.50)).toBe('#f59e0b');
      expect(getSlugHpColor(0.26)).toBe('#f59e0b');
      expect(getSlugHpColor(0.25)).toBe('#ef4444');
      expect(getSlugHpColor(0.05)).toBe('#ef4444');
    });
  });

  describe('desktopTopHeaderPropsAreEqual() selector', () => {
    it('returns TRUE when coordinates/velocities change during slug movement (prevents 60fps re-render overhead)', () => {
      const prev: DesktopTopHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'peer_1',
        isMyTurn: true,
        isHost: true,
        showHitboxes: false,
        onOpenRules: () => {},
      };

      const next: DesktopTopHeaderProps = {
        ...prev,
        gameState: {
          ...prev.gameState,
          turnTimer: 28.2, // Same Math.ceil(28.5) === Math.ceil(28.2) === 29
          slugs: prev.gameState.slugs.map((s) => ({
            ...s,
            x: s.x + 10,
            y: s.y - 5,
            vx: 3,
            vy: -1,
          })),
        },
      };

      expect(desktopTopHeaderPropsAreEqual(prev, next)).toBe(true);
    });

    it('returns FALSE when turn timer changes integer second value', () => {
      const prev: DesktopTopHeaderProps = {
        gameState: createMockGameState(),
        isMyTurn: true,
        isHost: true,
        onOpenRules: () => {},
      };

      const next: DesktopTopHeaderProps = {
        ...prev,
        gameState: {
          ...prev.gameState,
          turnTimer: 27.8, // Math.ceil(27.8) = 28 vs 29
        },
      };

      expect(desktopTopHeaderPropsAreEqual(prev, next)).toBe(false);
    });

    it('returns FALSE when retreat timer changes second value or wind changes', () => {
      const prev: DesktopTopHeaderProps = {
        gameState: createMockGameState(),
        isMyTurn: true,
        isHost: true,
        onOpenRules: () => {},
      };

      // Retreat timer change
      expect(
        desktopTopHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            phase: 'RETREAT',
            retreatTimer: 2.9, // Math.ceil(2.9) = 3 vs 4
          },
        })
      ).toBe(false);

      // Wind change
      expect(
        desktopTopHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            wind: -0.75,
          },
        })
      ).toBe(false);
    });

    it('returns FALSE when slug takes damage, active weapon, or name changes', () => {
      const prev: DesktopTopHeaderProps = {
        gameState: createMockGameState(),
        isMyTurn: true,
        isHost: true,
        onOpenRules: () => {},
      };

      // Damage
      expect(
        desktopTopHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, hp: 60 } : s
            ),
          },
        })
      ).toBe(false);

      // Weapon change
      expect(
        desktopTopHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, selectedWeaponId: 'holy_grenade' } : s
            ),
          },
        })
      ).toBe(false);

      // Name change
      expect(
        desktopTopHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, name: 'General Slug' } : s
            ),
          },
        })
      ).toBe(false);
    });

    it('returns FALSE when user toggles host status, hitboxes, peer ID, or turn ownership', () => {
      const prev: DesktopTopHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'peer_1',
        isMyTurn: true,
        isHost: true,
        showHitboxes: false,
        onOpenRules: () => {},
      };

      expect(desktopTopHeaderPropsAreEqual(prev, { ...prev, isMyTurn: false })).toBe(false);
      expect(desktopTopHeaderPropsAreEqual(prev, { ...prev, isHost: false })).toBe(false);
      expect(desktopTopHeaderPropsAreEqual(prev, { ...prev, hostPeerId: 'peer_2' })).toBe(false);
      expect(desktopTopHeaderPropsAreEqual(prev, { ...prev, showHitboxes: true })).toBe(false);
    });
  });
});
