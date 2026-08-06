import { GameState, GameConfig, Team, Slug, Vector2D, JournalEntry } from './types';
import { getWeaponSet } from './weapons/weaponSets';
import { getWeapon } from './weapons/registry';
import { generateProceduralTerrain } from './terrainGenerator';
import { DestructibleTerrain } from './terrain';
import { updateProjectilePhysics, applyExplosionToSlugs, updateSlugPhysics } from './physics';

export class SlugWarsEngine {
  public state: GameState;
  public terrain!: DestructibleTerrain;

  constructor(initialConfig?: Partial<GameConfig>) {
    const config: GameConfig = {
      weaponSetId: 'WMD_CRAZY',
      slugHp: 100,
      slugsPerTeam: 3,
      turnDuration: 45,
      windEnabled: true,
      mapTheme: 'ISLAND',
      mapSeed: Math.floor(Math.random() * 1000000),
      ...initialConfig,
    };

    this.state = {
      phase: 'LOBBY',
      config,
      teams: [],
      slugs: [],
      activeTeamId: '',
      activeSlugId: '',
      turnTimer: config.turnDuration,
      wind: 0,
      projectiles: [],
      explosions: [],
      particles: [],
      journal: [],
      turnCount: 0,
    };

    this.initTerrain();
  }

  public initTerrain(): void {
    const data = generateProceduralTerrain(
      this.state.config.mapSeed,
      this.state.config.mapTheme
    );
    this.terrain = new DestructibleTerrain(data);
  }

  public setConfig(partial: Partial<GameConfig>): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    this.state.config = { ...this.state.config, ...partial };
    if (partial.mapSeed !== undefined || partial.mapTheme !== undefined) {
      this.initTerrain();
    }
    return true;
  }

  public addTeam(id: string, name: string, color: string, avatar: string, isHost: boolean): void {
    if (this.state.teams.some((t) => t.id === id)) return;
    const wSet = getWeaponSet(this.state.config.weaponSetId);
    const newTeam: Team = {
      id,
      name,
      color,
      avatar,
      isHost,
      inventory: { ...wSet.inventory },
    };
    this.state.teams.push(newTeam);
  }

  public removeTeam(id: string): void {
    this.state.teams = this.state.teams.filter((t) => t.id !== id);
  }

  public startGame(): boolean {
    if (this.state.teams.length === 0) return false;
    this.initTerrain();
    this.state.slugs = [];

    let spawnIdx = 0;
    const spawnPoints = this.terrain.data.spawnPoints;

    for (let sIdx = 0; sIdx < this.state.config.slugsPerTeam; sIdx++) {
      for (const team of this.state.teams) {
        const pt = spawnPoints[spawnIdx % spawnPoints.length] || { x: 500, y: 200 };
        spawnIdx++;
        const slug: Slug = {
          id: `slug_${team.id}_${sIdx}`,
          teamId: team.id,
          name: `${team.name} #${sIdx + 1}`,
          x: pt.x,
          y: pt.y,
          vx: 0,
          vy: 0,
          hp: this.state.config.slugHp,
          maxHp: this.state.config.slugHp,
          isAlive: true,
          facing: 'right',
          aimAngle: 45,
          aimPower: 50,
          selectedWeaponId: 'bazooka',
        };
        this.state.slugs.push(slug);
      }
    }

    this.state.phase = 'AIMING';
    this.state.activeTeamId = this.state.teams[0].id;
    const firstSlug = this.state.slugs.find((s) => s.teamId === this.state.activeTeamId && s.isAlive);
    this.state.activeSlugId = firstSlug ? firstSlug.id : '';
    this.state.turnTimer = this.state.config.turnDuration;
    this.randomizeWind();
    this.addLog(`Partie lancée ! Tour de l'équipe ${this.state.teams[0].name}`, 'info');
    return true;
  }

  public randomizeWind(): void {
    if (this.state.config.windEnabled) {
      this.state.wind = Math.floor(Math.random() * 11) - 5;
    } else {
      this.state.wind = 0;
    }
  }

  public fireWeapon(targetPoint?: Vector2D): boolean {
    if (this.state.phase !== 'AIMING') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    const weapon = getWeapon(activeSlug.selectedWeaponId);
    const activeTeam = this.state.teams.find((t) => t.id === activeSlug.teamId);
    if (activeTeam) {
      const currentAmmo = activeTeam.inventory[weapon.id] ?? -1;
      if (currentAmmo === 0) return false;
      if (currentAmmo > 0) activeTeam.inventory[weapon.id]--;
    }

    if (weapon.behavior === 'TELEPORT' && targetPoint) {
      activeSlug.x = targetPoint.x;
      activeSlug.y = targetPoint.y;
      this.addLog(`${activeSlug.name} s'est téléporté !`, 'weapon');
      this.endTurn();
      return true;
    }

    if (weapon.behavior === 'MELEE_PUSH') {
      const targetSlug = this.state.slugs.find(
        (s) => s.id !== activeSlug.id && s.isAlive && Math.hypot(s.x - activeSlug.x, s.y - activeSlug.y) < 40
      );
      if (targetSlug) {
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        targetSlug.hp = Math.max(0, targetSlug.hp - weapon.damage);
        targetSlug.vx = dir * 18;
        targetSlug.vy = -10;
        this.addLog(`${activeSlug.name} a frappé ${targetSlug.name} à la batte !`, 'combat');
      }
      this.endTurn();
      return true;
    }

    const projs = weapon.createProjectiles({
      originX: activeSlug.x + (activeSlug.facing === 'right' ? 10 : -10),
      originY: activeSlug.y - 10,
      angleDeg: activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle,
      power: activeSlug.aimPower,
      ownerSlugId: activeSlug.id,
      targetPoint,
    });

    this.state.projectiles.push(...projs);
    this.state.phase = 'PROJECTILE_ACTIVE';
    this.addLog(`${activeSlug.name} a tiré avec ${weapon.name} !`, 'weapon');
    return true;
  }

  public tick(): void {
    for (const slug of this.state.slugs) {
      updateSlugPhysics(slug, this.terrain);
    }

    if (this.state.projectiles.length > 0) {
      const remaining: typeof this.state.projectiles = [];
      for (const proj of this.state.projectiles) {
        const res = updateProjectilePhysics(proj, this.terrain, this.state.wind);
        if (res.exploded) {
          const pt = res.collisionPoint || { x: proj.x, y: proj.y };
          const weapon = getWeapon(proj.weaponId);

          this.terrain.carveExplosion(pt.x, pt.y, weapon.radius);
          this.state.explosions.push({
            id: `ex_${Date.now()}_${Math.random()}`,
            x: pt.x,
            y: pt.y,
            radius: weapon.radius,
            damage: weapon.damage,
            customSound: weapon.customSoundKey,
          });

          applyExplosionToSlugs(pt.x, pt.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain);
        } else {
          remaining.push(proj);
        }
      }
      this.state.projectiles = remaining;

      if (this.state.projectiles.length === 0 && this.state.phase === 'PROJECTILE_ACTIVE') {
        this.endTurn();
      }
    }

    if (this.state.phase === 'AIMING') {
      this.state.turnTimer -= 0.05;
      if (this.state.turnTimer <= 0) {
        this.endTurn();
      }
    }
  }

  public endTurn(): void {
    this.checkWinner();
    if (this.state.phase === 'GAME_OVER') return;

    const aliveTeams = this.state.teams.filter((t) =>
      this.state.slugs.some((s) => s.teamId === t.id && s.isAlive)
    );
    if (aliveTeams.length <= 1) {
      this.checkWinner();
      return;
    }

    const currentIdx = aliveTeams.findIndex((t) => t.id === this.state.activeTeamId);
    const nextTeam = aliveTeams[(currentIdx + 1) % aliveTeams.length];
    this.state.activeTeamId = nextTeam.id;

    const nextSlug = this.state.slugs.find((s) => s.teamId === nextTeam.id && s.isAlive);
    this.state.activeSlugId = nextSlug ? nextSlug.id : '';
    this.state.turnTimer = this.state.config.turnDuration;
    this.state.phase = 'AIMING';
    this.randomizeWind();
  }

  public checkWinner(): void {
    const aliveTeams = this.state.teams.filter((t) =>
      this.state.slugs.some((s) => s.teamId === t.id && s.isAlive)
    );
    if (aliveTeams.length === 1) {
      this.state.phase = 'GAME_OVER';
      this.state.winnerTeamId = aliveTeams[0].id;
      this.addLog(`Victoire de l'équipe ${aliveTeams[0].name} ! 🎉`, 'info');
    } else if (aliveTeams.length === 0) {
      this.state.phase = 'GAME_OVER';
      this.addLog(`Égalité parfaite ! Toutes les limaces sont éliminées.`, 'info');
    }
  }

  public addLog(msgText: string, type: JournalEntry['type'] = 'info'): void {
    this.state.journal.unshift({
      id: `j_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      message: msgText,
      type,
    });
    if (this.state.journal.length > 50) this.state.journal.pop();
  }
}
