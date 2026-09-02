import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HATS, getHat, getDefaultHatForTeam, DEFAULT_HATS_BY_INDEX } from '../core/cosmetics/hatsRegistry';
import { saveProfile, loadProfile } from '../core/profile';
import { SlugWarsEngine } from '../core/gameEngine';
import { LIFECYCLE_ACTION_REGISTRY } from '../network/actions/actionRegistryLifecycle';
import { renderSlugHat, HAT_RENDER_STRATEGIES } from '../rendering/slugs/renderSlugHats';
import { buildTeamDeltas } from '../network/serializer/stateDeltaTeams';

describe('Hats Cosmetics & Headwear System', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: vi.fn((k: string) => store.get(k) ?? null),
      setItem: vi.fn((k: string, v: string) => store.set(k, v)),
      clear: vi.fn(() => store.clear()),
      removeItem: vi.fn((k: string) => store.delete(k)),
    };
    (globalThis as any).window = { localStorage: mockStorage };
    (globalThis as any).localStorage = mockStorage;
  });

  describe('Hats Registry Integrity', () => {
    it('contains all 47 defined hats including classic, fun, combat, fantasy and pop culture ones', () => {
      expect(HATS.length).toBe(47);
      const ids = HATS.map((h) => h.id);
      expect(ids).toContain('military');
      expect(ids).toContain('cowboy');
      expect(ids).toContain('bandana');
      expect(ids).toContain('cyber');
      expect(ids).toContain('crown');
      expect(ids).toContain('pirate');
      expect(ids).toContain('tophat');
      expect(ids).toContain('ninja');
      expect(ids).toContain('viking');
      expect(ids).toContain('sombrero');
      expect(ids).toContain('chef');
      expect(ids).toContain('wizard');
      expect(ids).toContain('hard_hat');
      expect(ids).toContain('detective');
      expect(ids).toContain('snorkel');
      expect(ids).toContain('duck');
      expect(ids).toContain('propeller');
      expect(ids).toContain('arrow');
      expect(ids).toContain('colander');
      expect(ids).toContain('astronaut');
      expect(ids).toContain('gas_mask');
      expect(ids).toContain('boxer');
      expect(ids).toContain('camo_helmet');
      expect(ids).toContain('mushroom');
      expect(ids).toContain('frog');
      expect(ids).toContain('unicorn');
      expect(ids).toContain('swamp_ears');
      expect(ids).toContain('feline_plume');
      expect(ids).toContain('mini_coronet');
      expect(ids).toContain('patriot_helmet');
      expect(ids).toContain('titanium_mask');
      expect(ids).toContain('mischief_horns');
      expect(ids).toContain('thunder_wings');
      expect(ids).toContain('supersonic_quills');
      expect(ids).toContain('twinfox_ears');
      expect(ids).toContain('mad_scientist');
      expect(ids).toContain('village_headband');
      expect(ids).toContain('super_shinobi_hair');
      expect(ids).toContain('renegade_straw');
      expect(ids).toContain('shadow_mask');
      expect(ids).toContain('bandit_balaclava');
      expect(ids).toContain('swat_helmet');
      expect(ids).toContain('tactical_chicken');
      expect(ids).toContain('arachnid_mask');
      expect(ids).toContain('alien_symbiote');
      expect(ids).toContain('bio_electric_mask');
      expect(ids).toContain('none');
    });

    it('returns default hat when getHat is passed null or undefined', () => {
      expect(getHat(null).id).toBe('military');
      expect(getHat(undefined).id).toBe('military');
      expect(getHat('unknown_hat').id).toBe('military');
      expect(getHat('crown').id).toBe('crown');
      expect(getHat('pirate').name).toBe('Tricorne Pirate');
    });

    it('cycles default hats deterministically by team index', () => {
      expect(getDefaultHatForTeam(0)).toBe('military');
      expect(getDefaultHatForTeam(1)).toBe('bandana');
      expect(getDefaultHatForTeam(2)).toBe('cyber');
      expect(getDefaultHatForTeam(3)).toBe('cowboy');
      expect(getDefaultHatForTeam(DEFAULT_HATS_BY_INDEX.length)).toBe(DEFAULT_HATS_BY_INDEX[0]);
    });
  });

  describe('Player Profile Hat Persistence', () => {
    it('saves and loads selected hat in localStorage', () => {
      saveProfile({ username: 'Capitaine Slime', avatar: '??', hat: 'pirate' });
      const loaded = loadProfile();
      expect(loaded?.username).toBe('Capitaine Slime');
      expect(loaded?.hat).toBe('pirate');
    });

    it('preserves existing hat when only updating username', () => {
      saveProfile({ username: 'Initial', hat: 'crown' });
      saveProfile({ username: 'Updated' });
      const loaded = loadProfile();
      expect(loaded?.username).toBe('Updated');
      expect(loaded?.hat).toBe('crown');
    });
  });

  describe('Engine Team Hat Management', () => {
    it('assigns default hat to teams registered without hat', () => {
      const engine = new SlugWarsEngine();
      engine.addTeam('team_alpha', 'Alpha', '#ef4444', '??', true);
      engine.addTeam('team_bravo', 'Bravo', '#3b82f6', '??', false);

      expect(engine.state.teams[0].hat).toBe('military');
      expect(engine.state.teams[1].hat).toBe('bandana');
    });

    it('preserves custom hat passed on team registration', () => {
      const engine = new SlugWarsEngine();
      engine.addTeam('team_custom', 'Custom', '#10b981', '??', true, 'cowboy');
      expect(engine.state.teams[0].hat).toBe('cowboy');
    });

    it('updates team hat via setTeamHat method', () => {
      const engine = new SlugWarsEngine();
      engine.addTeam('team_1', 'Team 1', '#ef4444', '??', true);
      expect(engine.state.teams[0].hat).toBe('military');

      engine.setTeamHat('team_1', 'tophat');
      expect(engine.state.teams[0].hat).toBe('tophat');
    });
  });

  describe('Network Action SET_TEAM_HAT', () => {
    it('allows a player to update their own team hat in LOBBY phase', () => {
      const engine = new SlugWarsEngine();
      engine.state.phase = 'LOBBY';
      engine.addTeam('player_1', 'P1', '#ef4444', '??', false);

      const syncState = vi.fn();
      const broadcastState = vi.fn();

      LIFECYCLE_ACTION_REGISTRY.SET_TEAM_HAT?.executeHost(
        {
          engine,
          playerId: 'player_1',
          hostId: 'host_peer',
          peerManager: {} as any,
          syncState,
          broadcastState,
        },
        { teamId: 'player_1', hat: 'ninja' }
      );

      expect(engine.state.teams[0].hat).toBe('ninja');
      expect(syncState).toHaveBeenCalled();
      expect(broadcastState).toHaveBeenCalled();
    });

    it('allows the host to update any team hat in LOBBY phase', () => {
      const engine = new SlugWarsEngine();
      engine.state.phase = 'LOBBY';
      engine.addTeam('player_guest', 'Guest', '#3b82f6', '??', false);

      const syncState = vi.fn();
      const broadcastState = vi.fn();

      LIFECYCLE_ACTION_REGISTRY.SET_TEAM_HAT?.executeHost(
        {
          engine,
          playerId: 'host_peer',
          hostId: 'host_peer',
          peerManager: {} as any,
          syncState,
          broadcastState,
        },
        { teamId: 'player_guest', hat: 'viking' }
      );

      expect(engine.state.teams[0].hat).toBe('viking');
    });

    it('rejects hat updates from non-owner and non-host players', () => {
      const engine = new SlugWarsEngine();
      engine.state.phase = 'LOBBY';
      engine.addTeam('player_target', 'Target', '#3b82f6', '??', false);

      const syncState = vi.fn();
      const broadcastState = vi.fn();

      LIFECYCLE_ACTION_REGISTRY.SET_TEAM_HAT?.executeHost(
        {
          engine,
          playerId: 'player_imposter',
          hostId: 'host_peer',
          peerManager: {} as any,
          syncState,
          broadcastState,
        },
        { teamId: 'player_target', hat: 'sombrero' }
      );

      expect(engine.state.teams[0].hat).not.toBe('sombrero');
      expect(syncState).not.toHaveBeenCalled();
    });
  });

  describe('Canvas Hat Renderer Zero-Crash Integrity', () => {
    it('safely renders all hat styles without crashing in mock canvas context', () => {
      const mockCtx: any = {
        save: vi.fn(),
        restore: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        arc: vi.fn(),
        quadraticCurveTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        ellipse: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        fillRect: vi.fn(),
        translate: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      };

      for (const hat of HATS) {
        expect(() => {
          renderSlugHat(mockCtx, hat.id, 0, '#ef4444', 1.0);
        }).not.toThrow();
      }

      // Also test fallback number index call
      expect(() => {
        renderSlugHat(mockCtx, 2, '#3b82f6', 1.0);
      }).not.toThrow();
    });

    it('has data-driven renderer strategies for all non-none hat IDs', () => {
      for (const hat of HATS) {
        if (hat.id === 'none') continue;
        expect(typeof HAT_RENDER_STRATEGIES[hat.id]).toBe('function');
      }
    });
  });

  describe('Team Delta Serialization & Meta-Change Detection', () => {
    it('triggers fullTeams delta when a team hat changes without team count changing', () => {
      const prevEngine = new SlugWarsEngine();
      prevEngine.addTeam('t1', 'Team 1', '#ef4444', '🐌', true, 'military');

      const curEngine = new SlugWarsEngine();
      curEngine.addTeam('t1', 'Team 1', '#ef4444', '🐌', true, 'crown');

      const delta: any = {};
      buildTeamDeltas(prevEngine.state, curEngine.state, delta);

      expect(delta.fullTeams).toBeDefined();
      expect(delta.fullTeams[0].hat).toBe('crown');
    });

    it('does not trigger fullTeams if hat and metadata have not changed', () => {
      const prevEngine = new SlugWarsEngine();
      prevEngine.addTeam('t1', 'Team 1', '#ef4444', '🐌', true, 'cowboy');

      const curEngine = new SlugWarsEngine();
      curEngine.addTeam('t1', 'Team 1', '#ef4444', '🐌', true, 'cowboy');

      const delta: any = {};
      buildTeamDeltas(prevEngine.state, curEngine.state, delta);

      expect(delta.fullTeams).toBeUndefined();
    });
  });
});
