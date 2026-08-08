import { GameState, GameConfig, Team, Slug, Vector2D, JournalEntry, Landmine, Particle } from './types';
import { getWeaponSet } from './weapons/weaponSets';
import { getWeapon } from './weapons/registry';
import { generateProceduralTerrain } from './terrainGenerator';
import { DestructibleTerrain } from './terrain';
import { updateProjectilePhysics, applyExplosionToSlugs, updateSlugPhysics, isSlugGrounded } from './physics';
import { sfx } from './audio';
import { TurnManager } from './turnManager';
import { VehicleManager } from './vehicleManager';

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
      vehiclesEnabled: true,
      dayNightCycle: 'DAY',
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
      helicopters: [],
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
    this.state.mines = (data.minePoints || []).map((pt, i) => ({
      id: `mine_${i}`,
      x: pt.x,
      y: pt.y,
      isTriggered: false,
    }));
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

  public addTeam(id: string, name: string, color: string, avatar: string, isHost: boolean = false): Team {
    const defaultWeapons = getWeaponSet(this.state.config.weaponSetId);
    const team: Team = { id, name, color, avatar, isHost, inventory: { ...defaultWeapons.inventory } };
    this.state.teams.push(team);
    this.addLog(`Équipe ${name} a rejoint la bataille !`, 'info');
    return team;
  }

  public removeTeam(id: string): void {
    this.state.teams = this.state.teams.filter((t) => t.id !== id);
    this.state.slugs = this.state.slugs.filter((s) => s.teamId !== id);
  }

  public setConfig(newConfig: Partial<GameConfig>): void {
    this.state.config = { ...this.state.config, ...newConfig };
    if (newConfig.mapSeed !== undefined || newConfig.mapTheme !== undefined) {
      this.initTerrain();
    }
  }

  public startGame(): boolean {
    if (this.state.teams.length === 0) return false;
    this.initTerrain();

    const slugs: Slug[] = [];
    const spawnPoints = [...this.terrain.data.spawnPoints];

    this.state.teams.forEach((team) => {
      for (let i = 0; i < this.state.config.slugsPerTeam; i++) {
        const slugId = `slug_${team.id}_${i}`;
        const spawnPt = spawnPoints.pop() || { x: 400 + i * 80, y: 100 };
        slugs.push({
          id: slugId,
          teamId: team.id,
          name: `${team.name} #${i + 1}`,
          x: spawnPt.x,
          y: spawnPt.y,
          vx: 0,
          vy: 0,
          hp: this.state.config.slugHp,
          maxHp: this.state.config.slugHp,
          isAlive: true,
          facing: 'right',
          aimAngle: 45,
          aimPower: 50,
          selectedWeaponId: 'bazooka',
          isPlaced: false,
        });
      }
    });

    this.state.slugs = slugs;
    VehicleManager.spawnHelicopters(this.state, this.terrain);
    TurnManager.initTurnState(this.state);
    this.addLog('Phase de Placement ! Placez vos limaces à tour de rôle sur le terrain.', 'info');
    return true;
  }

  public placeSlug(point: Vector2D): boolean {
    if (this.state.phase !== 'PLACEMENT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || activeSlug.isPlaced) return false;

    activeSlug.x = point.x;
    activeSlug.y = point.y;
    activeSlug.isPlaced = true;
    sfx.play('teleport');
    this.addLog(`${activeSlug.name} a été placée sur le terrain !`, 'info');

    const unplaced = this.state.slugs.filter((s) => !s.isPlaced);
    if (unplaced.length === 0) {
      this.state.phase = 'TURN_START';
      this.state.phaseTimer = 1.5;
      this.state.turnTimer = this.state.config.turnDuration;
      TurnManager.randomizeWind(this.state);
      this.addLog('Toutes les limaces sont placées ! Début de la partie ! 🚀', 'info');
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

  public enterVehicle(): boolean {
    return VehicleManager.enterVehicle(this.state, this.addLog.bind(this));
  }

  public exitVehicle(): boolean {
    return VehicleManager.exitVehicle(this.state, this.addLog.bind(this));
  }

  public steerVehicle(dir: 'left' | 'right' | 'up' | 'down'): void {
    VehicleManager.steerVehicle(this.state, dir);
  }

  public startMove(dir: 'left' | 'right'): boolean {
    return this.moveSlug(dir);
  }

  public moveSlug(dir: 'left' | 'right'): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME' && this.state.phase !== 'RETREAT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    const speed = 3.2;
    activeSlug.vx = dir === 'left' ? -speed : speed;
    activeSlug.facing = dir;
    return true;
  }

  public startSteer(dir: 'left' | 'right'): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = dir;
  }

  public stopSteer(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = null;
  }

  public stopMove(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) {
      activeSlug.movingDir = null;
      activeSlug.vx = 0;
    }
  }

  public jumpSlug(): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME' && this.state.phase !== 'RETREAT') return false;
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

  public startCharge(targetPoint?: Vector2D): void {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug && activeSlug.isAlive) {
      activeSlug.isChargingPower = true;
      activeSlug.aimPower = 5;
      if (targetPoint) activeSlug.currentTargetPoint = targetPoint;
    }
  }

  public releaseCharge(targetPoint?: Vector2D): void {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug && activeSlug.isAlive) {
      if (activeSlug.isBlowtorching) {
        activeSlug.isBlowtorching = false;
        return;
      }
      if (activeSlug.isChargingPower) {
        activeSlug.isChargingPower = false;
        this.fireWeapon(targetPoint);
      }
    }
  }

  public fireWeapon(targetPoint?: Vector2D): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    const weapon = getWeapon(activeSlug.selectedWeaponId);
    const activeTeam = this.state.teams.find((t) => t.id === activeSlug.teamId);
    if (activeTeam) {
      const currentAmmo = activeTeam.inventory[weapon.id] ?? -1;
      if (currentAmmo === 0) return false;
      if (currentAmmo > 0) activeTeam.inventory[weapon.id]--;
    }

    if (targetPoint) activeSlug.currentTargetPoint = targetPoint;

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

    if (weapon.id === 'dynamite' || weapon.id === 'holy_grenade' || weapon.id === 'banana_bomb' || weapon.behavior === 'BOUNCING_TIMER') {
      this.state.phase = 'RETREAT';
      this.state.retreatTimer = 4.0;
      this.addLog(`🏃 TEMPS DE FUITE (RETREAT) ! 4s pour vous mettre à l'abri !`, 'info');
    }

    sfx.play('fire');
    this.addLog(`${activeSlug.name} a tiré avec ${weapon.name} ! (Puissance: ${Math.round(activeSlug.aimPower)}%)`, 'weapon');
    return true;
  }

  public endTurn(): void {
    TurnManager.endTurn(this.state, this.addLog.bind(this));
  }

  public tick(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    const activeSlugHpBefore = activeSlug && activeSlug.isAlive ? activeSlug.hp : 0;

    if (this.state.phase === 'TURN_START' && this.state.phaseTimer !== undefined) {
      this.state.phaseTimer -= 0.05;
      if (this.state.phaseTimer <= 0) {
        this.state.phase = 'AIMING';
        this.state.phaseTimer = undefined;
      }
    }

    if (this.state.phase === 'RETREAT' && this.state.retreatTimer !== undefined) {
      const prevSec = Math.ceil(this.state.retreatTimer);
      this.state.retreatTimer -= 0.05;
      const newSec = Math.ceil(this.state.retreatTimer);
      if (newSec < prevSec && newSec > 0) sfx.play('tick');
      if (this.state.retreatTimer <= 0) {
        this.state.retreatTimer = undefined;
        if (this.state.projectiles.length > 0) {
          this.state.phase = 'PROJECTILE_ACTIVE';
        } else {
          this.endTurn();
        }
      }
    }

    VehicleManager.updateHelicopters(this.state, this.terrain, this.addLog.bind(this));

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

    if (this.state.projectiles.length > 0) {
      const remaining: typeof this.state.projectiles = [];
      for (const proj of this.state.projectiles) {
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

    // Decay floating damages & explosions
    const currentTime = Date.now();
    this.state.explosions = this.state.explosions.filter((ex) => currentTime - ex.createdAt < 350);
    this.state.floatingDamages = (this.state.floatingDamages || []).filter((fd) => currentTime - fd.createdAt < 1000);

    if (this.state.phase === 'AIMING' || this.state.phase === 'TURN_TIME') {
      this.state.turnTimer -= 0.05;
      if (this.state.turnTimer <= 0) {
        this.endTurn();
      }
    }
  }
}
