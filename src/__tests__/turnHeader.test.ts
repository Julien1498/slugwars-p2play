import { describe, it, expect } from 'vitest';
import { GameState, Team, Slug } from '../core/types';
import {
  computeTeamStats,
  isTurnTimeUrgent,
  getWaterRiseBadgeText,
  turnHeaderPropsAreEqual,
  TurnHeaderProps,
} from '../components/game/header/turnHeaderUtils';

describe('TurnHeader: UI Data Processing & React.memo Selector Equality', () => {
  const createMockGameState = (): GameState => {
    const teams: Team[] = [
      {
        id: 'team_red',
        name: 'Red Dragons',
        color: '#ef4444',
        avatar: 'slug',
        isHost: true,
        inventory: { bazooka: -1, grenade: 3 },
        stats: { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 },
      },
      {
        id: 'team_blue',
        name: 'Blue Sharks',
        color: '#3b82f6',
        avatar: 'snail',
        isHost: false,
        inventory: { bazooka: -1, grenade: 3 },
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
        hp: 80,
        maxHp: 100,
        isAlive: true,
        aimAngle: 0,
        aimPower: 50,
        selectedWeaponId: 'grenade',
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
        selectedWeaponId: 'grenade',
        facing: 'left',
      },
    ];

    return {
      phase: 'AIMING',
      turnTimer: 25.4,
      turnCount: 1,
      activeTeamId: 'team_red',
      activeSlugId: 'slug_1',
      wind: 0.45,
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
      supplyCrates: [],
      girders: [],
      config: {
        weaponSetId: 'classic',
        turnDuration: 30,
        slugsPerTeam: 2,
        slugHp: 100,
        windEnabled: true,
        vehiclesEnabled: true,
        waterRiseSpeed: 'OFF',
        mapTheme: 'ISLAND',
        mapSeed: 12345,
      },
    };
  };

  describe('computeTeamStats() aggregation logic', () => {
    it('accurately computes alive slugs count, total HP and health percentage per team', () => {
      const state = createMockGameState();
      const stats = computeTeamStats(state);

      expect(stats).toHaveLength(2);

      // Red Team: 2 alive slugs, 100 HP + 100 HP = 200 HP (100%)
      const red = stats.find((s) => s.team.id === 'team_red')!;
      expect(red.aliveSlugs).toBe(2);
      expect(red.totalSlugs).toBe(2);
      expect(red.totalHp).toBe(200);
      expect(red.hpPercent).toBe(1.0);
      expect(red.isActive).toBe(true);

      // Blue Team: 1 alive (80 HP), 1 dead (0 HP) = 80 HP (40% of 200)
      const blue = stats.find((s) => s.team.id === 'team_blue')!;
      expect(blue.aliveSlugs).toBe(1);
      expect(blue.totalSlugs).toBe(2);
      expect(blue.totalHp).toBe(80);
      expect(blue.hpPercent).toBeCloseTo(0.4, 2);
      expect(blue.isActive).toBe(false);
    });
  });

  describe('isTurnTimeUrgent() and water rise text helpers', () => {
    it('triggers urgency when turn timer is 5s or less during AIMING phase only', () => {
      expect(isTurnTimeUrgent(5.0, 'AIMING')).toBe(true);
      expect(isTurnTimeUrgent(4.2, 'AIMING')).toBe(true);
      expect(isTurnTimeUrgent(0.8, 'AIMING')).toBe(true);

      expect(isTurnTimeUrgent(5.8, 'AIMING')).toBe(false);
      expect(isTurnTimeUrgent(3.0, 'RETREAT')).toBe(false);
      expect(isTurnTimeUrgent(2.0, 'FIRING')).toBe(false);
    });

    it('formats water rise badges for round cycles vs turn cycles', () => {
      expect(getWaterRiseBadgeText('OFF', undefined)).toBeNull();
      expect(getWaterRiseBadgeText('SLOW', 'ROUND_CYCLE')).toBe('+16px');
      expect(getWaterRiseBadgeText('NORMAL', 'ROUND_CYCLE')).toBe('+36px');
      expect(getWaterRiseBadgeText('FAST', 'ROUND_CYCLE')).toBe('+68px');

      expect(getWaterRiseBadgeText('SLOW', 'EVERY_TURN')).toBe('+5px');
      expect(getWaterRiseBadgeText('NORMAL', 'EVERY_TURN')).toBe('+12px');
      expect(getWaterRiseBadgeText('FAST', 'EVERY_TURN')).toBe('+24px');
    });
  });

  describe('turnHeaderPropsAreEqual() React.memo comparator', () => {
    it('returns TRUE when physics coordinates change without modifying UI stats (avoids redundant 60fps re-renders)', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        isHost: true,
        showHitboxes: false,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      // Clone state but only move slug coordinates (x, y, vx, vy)
      const next: TurnHeaderProps = {
        ...prev,
        gameState: {
          ...prev.gameState,
          turnTimer: 25.2, // Same Math.ceil(25.4) === Math.ceil(25.2) === 26
          slugs: prev.gameState.slugs.map((s) => ({
            ...s,
            x: s.x + 1.5,
            y: s.y - 0.8,
            vx: 1.2,
            vy: -0.4,
          })),
        },
      };

      expect(turnHeaderPropsAreEqual(prev, next)).toBe(true);
    });

    it('returns FALSE when turn timer crosses a second boundary', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      const next: TurnHeaderProps = {
        ...prev,
        gameState: {
          ...prev.gameState,
          turnTimer: 24.8, // Math.ceil(24.8) === 25 vs Math.ceil(25.4) === 26
        },
      };

      expect(turnHeaderPropsAreEqual(prev, next)).toBe(false);
    });

    it('returns FALSE when active weapon, name, or fuse timer changes', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      // Weapon change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, selectedWeaponId: 'super_sheep' } : s
            ),
          },
        })
      ).toBe(false);

      // Name change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, name: 'Renamed Slug' } : s
            ),
          },
        })
      ).toBe(false);

      // Fuse timer change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, fuseTimerSec: 5 } : s
            ),
          },
        })
      ).toBe(false);
    });

    it('returns FALSE when any slug takes damage, dies, or slug count changes', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      // Damage
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.map((s) =>
              s.id === 'slug_1' ? { ...s, hp: 65 } : s
            ),
          },
        })
      ).toBe(false);

      // Slugs count change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: {
            ...prev.gameState,
            slugs: prev.gameState.slugs.slice(0, 3),
          },
        })
      ).toBe(false);
    });

    it('returns FALSE when game phase, retreat timer, wind, or active team changes', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      // Phase change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: { ...prev.gameState, phase: 'RETREAT', retreatTimer: 4.0 },
        })
      ).toBe(false);

      // Retreat timer change
      expect(
        turnHeaderPropsAreEqual(
          { ...prev, gameState: { ...prev.gameState, phase: 'RETREAT', retreatTimer: 4.0 } },
          { ...prev, gameState: { ...prev.gameState, phase: 'RETREAT', retreatTimer: 2.8 } }
        )
      ).toBe(false);

      // Wind change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: { ...prev.gameState, wind: -0.8 },
        })
      ).toBe(false);

      // Active team change
      expect(
        turnHeaderPropsAreEqual(prev, {
          ...prev,
          gameState: { ...prev.gameState, activeTeamId: 'team_blue' },
        })
      ).toBe(false);
    });

    it('returns FALSE when user toggles hitboxes, host status, peer ID, or turn status changes', () => {
      const prev: TurnHeaderProps = {
        gameState: createMockGameState(),
        hostPeerId: 'host_123',
        isMyTurn: true,
        isHost: true,
        showHitboxes: false,
        onOpenWeaponPicker: () => {},
        onOpenRules: () => {},
      };

      expect(turnHeaderPropsAreEqual(prev, { ...prev, isMyTurn: false })).toBe(false);
      expect(turnHeaderPropsAreEqual(prev, { ...prev, isHost: false })).toBe(false);
      expect(turnHeaderPropsAreEqual(prev, { ...prev, hostPeerId: 'host_999' })).toBe(false);
      expect(turnHeaderPropsAreEqual(prev, { ...prev, showHitboxes: true })).toBe(false);
    });
  });
});
