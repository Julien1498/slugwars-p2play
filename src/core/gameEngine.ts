import { GameState, GameConfig, Team, Slug, Vector2D, JournalEntry, Landmine, Particle } from './types';
import { getWeaponSet } from './weapons/weaponSets';
import { getWeapon } from './weapons/registry';
import { generateProceduralTerrain } from './terrainGenerator';
import { DestructibleTerrain } from './terrain';
import { updateProjectilePhysics, applyExplosionToSlugs, updateSlugPhysics, isSlugGrounded } from './physics';
import { sfx } from './audio';

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
      mines: [],
      activeTeamId: '',
      activeSlugId: '',
      turnTimer: config.turnDuration,
      wind: 0,
      projectiles: [],
      explosions: [],
      particles: [],
      floatingDamages: [],
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
    if (partial.mapTheme !== undefined && partial.mapSeed === undefined) {
      this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    }
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

  public teamLastSlugIndex: Record<string, number> = {};

  public getNextSlugForTeam(teamId: string): string {
    const teamSlugs = this.state.slugs.filter((s) => s.teamId === teamId && s.isAlive);
    if (teamSlugs.length === 0) return '';

    const currentIndex = this.teamLastSlugIndex[teamId] ?? -1;
    const nextIndex = (currentIndex + 1) % teamSlugs.length;
    this.teamLastSlugIndex[teamId] = nextIndex;

    return teamSlugs[nextIndex].id;
  }

  public startGame(): boolean {
    if (this.state.teams.length === 0) return false;
    this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    this.initTerrain();
    this.state.slugs = [];
    this.teamLastSlugIndex = {};

    let slugIndex = 1;
    for (const team of this.state.teams) {
      this.teamLastSlugIndex[team.id] = -1;
      for (let i = 0; i < this.state.config.slugsPerTeam; i++) {
        this.state.slugs.push({
          id: `slug_${team.id}_${i}`,
          teamId: team.id,
          name: `${team.name} #${i + 1}`,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0,
          hp: this.state.config.slugHp,
          maxHp: this.state.config.slugHp,
          isAlive: true,
          isPlaced: false,
          facing: i % 2 === 0 ? 'right' : 'left',
          aimAngle: 45,
          aimPower: 0,
          selectedWeaponId: 'bazooka',
        });
        slugIndex++;
      }
    }

    this.state.mines = (this.terrain.data.minePoints || []).map((pt, idx) => ({
      id: `mine_${idx}_${Date.now()}`,
      x: pt.x,
      y: pt.y,
      isTriggered: false,
    }));
    this.state.floatingDamages = [];

    this.state.phase = 'PLACEMENT';
    this.state.activeTeamId = this.state.teams[0].id;
    const firstSlug = this.state.slugs.find((s) => s.teamId === this.state.activeTeamId && !s.isPlaced);
    this.state.activeSlugId = firstSlug ? firstSlug.id : this.state.slugs[0].id;
    this.state.turnTimer = 30;
    this.addLog('Phase de Placement ! Placez vos limaces à tour de rôle sur le terrain.', 'info');
    return true;
  }

  public placeSlug(point: Vector2D): boolean {
    if (this.state.phase !== 'PLACEMENT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || activeSlug.isPlaced) return false;

    const safePt = this.findSafeTeleportPoint(point.x, point.y);
    activeSlug.x = safePt.x;
    activeSlug.y = safePt.y;
    activeSlug.isPlaced = true;
    sfx.play('jump');
    this.addLog(`${activeSlug.name} positionné sur le terrain !`, 'info');

    const unplaced = this.state.slugs.filter((s) => !s.isPlaced);
    if (unplaced.length === 0) {
      this.state.phase = 'AIMING';
      this.state.activeTeamId = this.state.teams[0].id;
      this.state.activeSlugId = this.getNextSlugForTeam(this.state.activeTeamId) || this.state.slugs[0].id;
      this.state.turnTimer = this.state.config.turnDuration;
      this.addLog('Toutes les limaces sont en place ! Le combat commence !', 'info');
      sfx.play('victory');
      return true;
    }

    const currentTeamIdx = this.state.teams.findIndex((t) => t.id === this.state.activeTeamId);
    const nextTeam = this.state.teams[(currentTeamIdx + 1) % this.state.teams.length];
    this.state.activeTeamId = nextTeam.id;

    let nextSlug = this.state.slugs.find((s) => s.teamId === nextTeam.id && !s.isPlaced);
    if (!nextSlug) {
      nextSlug = unplaced[0];
      this.state.activeTeamId = nextSlug.teamId;
    }
    this.state.activeSlugId = nextSlug.id;
    this.state.turnTimer = 30;
    return true;
  }

  public randomizeWind(): void {
    if (this.state.config.windEnabled) {
      this.state.wind = Math.floor(Math.random() * 11) - 5;
    } else {
      this.state.wind = 0;
    }
  }

  public findSafeTeleportPoint(targetX: number, targetY: number): Vector2D {
    const width = this.terrain.data.width;
    const height = this.terrain.data.height;
    const safeX = Math.max(15, Math.min(width - 15, Math.round(targetX)));
    const safeY = Math.max(15, Math.min(height - 15, Math.round(targetY)));

    // 1. If clicked point is ALREADY open air, return immediately
    if (!this.terrain.isSolid(safeX, safeY)) {
      return { x: safeX, y: safeY };
    }

    // 2. Full-map nearest open air pixel search (Guarantees slug NEVER spawns in solid rock)
    let bestPoint: Vector2D | null = null;
    let minDistSq = Infinity;

    for (let testY = 15; testY < height - 15; testY += 4) {
      for (let testX = 15; testX < width - 15; testX += 4) {
        if (!this.terrain.isSolid(testX, testY)) {
          const distSq = (testX - safeX) ** 2 + (testY - safeY) ** 2;
          if (distSq < minDistSq) {
            minDistSq = distSq;
            bestPoint = { x: testX, y: testY };
          }
        }
      }
    }

    if (bestPoint) {
      return bestPoint;
    }

    // Fallback if map is 100% solid
    return this.terrain.data.spawnPoints[0] || { x: 500, y: 100 };
  }

  public startMove(dir: 'left' | 'right'): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) {
      activeSlug.movingDir = dir;
      activeSlug.vx = dir === 'left' ? -3.2 : 3.2;
      activeSlug.facing = dir;
    }
  }

  public stopMove(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) {
      activeSlug.movingDir = null;
      activeSlug.vx = 0;
    }
  }

  public startCharge(): void {
    if (this.state.phase !== 'AIMING') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug && activeSlug.isAlive) {
      activeSlug.isChargingPower = true;
      activeSlug.aimPower = 5;
    }
  }

  public releaseCharge(targetPoint?: Vector2D): void {
    if (this.state.phase !== 'AIMING') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug && activeSlug.isAlive && activeSlug.isChargingPower) {
      activeSlug.isChargingPower = false;
      this.fireWeapon(targetPoint);
    }
  }

  public startSteer(dir: 'left' | 'right'): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = dir;
  }

  public stopSteer(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = null;
  }

  public moveSlug(dir: 'left' | 'right'): boolean {
    if (this.state.phase !== 'AIMING') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    const speed = 3.2;
    if (dir === 'left') {
      activeSlug.vx = -speed;
      activeSlug.facing = 'left';
    } else {
      activeSlug.vx = speed;
      activeSlug.facing = 'right';
    }
    return true;
  }

  public steerSheep(dir: 'left' | 'right'): boolean {
    const sheep = this.state.projectiles.find((p) => p.weaponId === 'super_sheep');
    if (!sheep) return false;

    const angleDelta = (dir === 'left' ? -14 : 14) * (Math.PI / 180);
    const currentAngle = Math.atan2(sheep.vy, sheep.vx);
    const newAngle = currentAngle + angleDelta;
    const speed = Math.hypot(sheep.vx, sheep.vy) || 7.5;

    sheep.vx = Math.cos(newAngle) * speed;
    sheep.vy = Math.sin(newAngle) * speed;
    return true;
  }

  public detonateSheep(): boolean {
    const sheepIdx = this.state.projectiles.findIndex((p) => p.weaponId === 'super_sheep');
    if (sheepIdx === -1) return false;

    const sheep = this.state.projectiles[sheepIdx];
    this.state.projectiles.splice(sheepIdx, 1);

    const weapon = getWeapon('super_sheep');
    this.terrain.carveExplosion(sheep.x, sheep.y, weapon.radius);
    this.state.explosions.push({
      id: `ex_${Date.now()}_${Math.random()}`,
      x: sheep.x,
      y: sheep.y,
      radius: weapon.radius,
      damage: weapon.damage,
      customSound: weapon.customSoundKey,
      createdAt: Date.now(),
    });

    applyExplosionToSlugs(sheep.x, sheep.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain);
    this.endTurn();
    return true;
  }

  public jumpSlug(): boolean {
    if (this.state.phase !== 'AIMING') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    if (isSlugGrounded(activeSlug, this.terrain, this.state.slugs)) {
      activeSlug.vy = -7.5;
      activeSlug.vx += activeSlug.facing === 'right' ? 2 : -2;
      sfx.play('jump');
      return true;
    }
    return false;
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
      const safePt = this.findSafeTeleportPoint(targetPoint.x, targetPoint.y);
      activeSlug.x = safePt.x;
      activeSlug.y = safePt.y;
      activeSlug.vx = 0;
      activeSlug.vy = 0;
      sfx.play('teleport');
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
      sfx.play('melee');
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
    sfx.play('fire');
    this.addLog(`${activeSlug.name} a tiré avec ${weapon.name} ! (Puissance: ${Math.round(activeSlug.aimPower)}%)`, 'weapon');
    return true;
  }

  public tick(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    const activeSlugHpBefore = activeSlug && activeSlug.isAlive ? activeSlug.hp : 0;

    // If active slug dies (e.g. drowns or dies from explosion), end turn immediately!
    if (activeSlug && !activeSlug.isAlive && (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE')) {
      this.endTurn();
      return;
    }

    if (activeSlug && activeSlug.isAlive && this.state.phase === 'AIMING') {
      if (activeSlug.movingDir) {
        this.moveSlug(activeSlug.movingDir);
      }
      if (activeSlug.isChargingPower) {
        activeSlug.aimPower += 2.5;
        if (activeSlug.aimPower >= 100) {
          activeSlug.aimPower = 100;
          activeSlug.isChargingPower = false;
          this.fireWeapon();
        }
      }
    }

    const activeSheep = this.state.projectiles.find((p) => p.weaponId === 'super_sheep');
    if (activeSheep && activeSlug && activeSlug.steeringDir) {
      this.steerSheep(activeSlug.steeringDir);
    }

    for (const slug of this.state.slugs) {
      const phys = updateSlugPhysics(slug, this.terrain, this.state.slugs);
      if (phys.fallDamage) {
        this.addLog(`💥 ${slug.name} a subi ${phys.fallDamage} dégâts de chute !`, 'combat');
        sfx.play('splash');
        this.state.floatingDamages.push({
          id: `fd_${Date.now()}_${Math.random()}`,
          x: slug.x,
          y: slug.y - 24,
          damage: phys.fallDamage,
          createdAt: Date.now(),
        });
      }
    }

    // End turn immediately if active slug takes ANY damage during its turn!
    if (
      activeSlug &&
      activeSlug.isAlive &&
      activeSlug.hp < activeSlugHpBefore &&
      (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE')
    ) {
      this.addLog(`⚡ ${activeSlug.name} a pris des dégâts ! Fin du tour !`, 'combat');
      this.endTurn();
      return;
    }

    if (this.state.projectiles.length > 0) {
      const remaining: typeof this.state.projectiles = [];
      for (const proj of this.state.projectiles) {
        // Spawn Smoke & Fire Trail Particles behind active flying projectiles (capped to 40 max)
        if (Math.hypot(proj.vx, proj.vy) > 0.5 && this.state.particles.length < 40) {
          this.state.particles.push({
            x: proj.x - proj.vx * 0.8,
            y: proj.y - proj.vy * 0.8,
            vx: (Math.random() - 0.5) * 0.8,
            vy: (Math.random() - 0.5) * 0.8,
            color: Math.random() > 0.4 ? '#f97316' : '#71717a',
            size: Math.random() * 3 + 2,
            life: 1.0,
          });
        }

        const res = updateProjectilePhysics(proj, this.terrain, this.state.wind, this.state.slugs);
        if (res.exploded) {
          const pt = res.collisionPoint || { x: proj.x, y: proj.y };
          const weapon = getWeapon(proj.weaponId);

          const now = Date.now();
          this.terrain.carveExplosion(pt.x, pt.y, weapon.radius);
          this.state.explosions.push({
            id: `ex_${now}_${Math.random()}`,
            x: pt.x,
            y: pt.y,
            radius: weapon.radius,
            damage: weapon.damage,
            customSound: weapon.customSoundKey,
            createdAt: now,
          });

          sfx.play('explosion');
          const expRes = applyExplosionToSlugs(pt.x, pt.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain);
          for (const dm of expRes.damageEvents) {
            this.state.floatingDamages.push({
              id: `fd_${now}_${Math.random()}`,
              x: dm.x,
              y: dm.y,
              damage: dm.damage,
              createdAt: now,
            });
          }
        } else {
          remaining.push(proj);
        }
      }
      this.state.projectiles = remaining;

      if (this.state.projectiles.length === 0 && this.state.phase === 'PROJECTILE_ACTIVE') {
        this.endTurn();
      }
    }

    // Landmine Proximity Trigger, Countdown & Chain Reaction Processing
    if (this.state.mines && this.state.mines.length > 0) {
      const remainingMines: Landmine[] = [];
      for (const mine of this.state.mines) {
        let exploded = false;

        // Proximity Trigger Check by any living placed slug (25px radius)
        if (!mine.isTriggered) {
          for (const slug of this.state.slugs) {
            if (!slug.isAlive || slug.isPlaced === false) continue;
            if (Math.hypot(slug.x - mine.x, (slug.y - 8) - mine.y) <= 25) {
              mine.isTriggered = true;
              mine.fuseTimerMs = 2000;
              sfx.play('tick');
              this.addLog('🚨 UNE MINE A ÉTÉ DÉCLENCHÉE !', 'combat');
              break;
            }
          }
        } else if (mine.fuseTimerMs !== undefined) {
          mine.fuseTimerMs -= 16;
          if (mine.fuseTimerMs <= 0) {
            exploded = true;
          }
        }

        // Chain Reaction Check (Explosion hitting mine)
        for (const ex of this.state.explosions) {
          if (Math.hypot(mine.x - ex.x, mine.y - ex.y) <= ex.radius + 10) {
            exploded = true;
            break;
          }
        }

        if (exploded) {
          const now = Date.now();
          const radius = 65;
          const damage = 45;
          this.terrain.carveExplosion(mine.x, mine.y, radius);
          this.state.explosions.push({
            id: `ex_mine_${now}_${Math.random()}`,
            x: mine.x,
            y: mine.y,
            radius,
            damage,
            createdAt: now,
          });
          sfx.play('explosion');
          const mineExpRes = applyExplosionToSlugs(mine.x, mine.y, radius, damage, this.state.slugs, this.terrain);
          for (const dm of mineExpRes.damageEvents) {
            this.state.floatingDamages.push({
              id: `fd_${now}_${Math.random()}`,
              x: dm.x,
              y: dm.y,
              damage: dm.damage,
              createdAt: now,
            });
          }
        } else {
          remainingMines.push(mine);
        }
      }
      this.state.mines = remainingMines;
    }

    // Update and decay flying smoke & fire particles
    if (this.state.particles && this.state.particles.length > 0) {
      const remainingParticles: Particle[] = [];
      for (const p of this.state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life > 0) {
          remainingParticles.push(p);
        }
      }
      this.state.particles = remainingParticles;
    }

    // Clean up expired explosions and floating damage numbers
    const currentTime = Date.now();
    this.state.explosions = this.state.explosions.filter(
      (ex) => currentTime - (ex.createdAt || currentTime) < 350
    );
    this.state.floatingDamages = (this.state.floatingDamages || []).filter(
      (fd) => currentTime - fd.createdAt < 1000
    );

    if (this.state.phase === 'AIMING') {
      this.state.turnTimer -= 0.05;
      if (this.state.turnTimer <= 0) {
        this.endTurn();
      }
    }
  }

  public endTurn(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) {
      activeSlug.movingDir = null;
      activeSlug.steeringDir = null;
      activeSlug.isChargingPower = false;
    }

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

    this.state.activeSlugId = this.getNextSlugForTeam(nextTeam.id);
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
