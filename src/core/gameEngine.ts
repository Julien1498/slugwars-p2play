import { GameState, GameConfig, Vector2D, JournalEntry, Particle, SolidProp, Slug } from './types';
import { DestructibleTerrain } from './terrain';
import { getWeaponSet } from './weapons/weaponSets';
import { getWeapon } from './weapons/registry';
import { updateProjectilePhysics, applyExplosionToSlugs, updateSlugPhysics, isSlugGrounded } from './physics';
import { sfx } from './audio';
import {
  createInitialConfig,
  createInitialState,
  initializeTerrainForConfig,
  registerTeam,
  unregisterTeam,
} from './engine/engineState';
import {
  getNextSlugForTeam,
  randomizeWind,
  findSafePlacementPoint,
  findSafeTeleportPoint,
  isWorldAtRest,
  checkWinner,
} from './engine/turnManager';
import {
  selectWeapon,
  setFuseTimer,
  detonateOilDrum,
  fireWeapon,
} from './engine/weaponHandler';
import {
  enterVehicle,
  exitVehicle,
  steerVehicle,
  updateHelicopters,
} from './engine/vehicleManager';
import {
  updateMines,
  updateSupplyCrates,
} from './engine/supplyDropManager';
import { PhaseManager } from './engine/phaseManager';

export class SlugWarsEngine {
  public state: GameState;
  public terrain!: DestructibleTerrain;
  public teamLastPlayedSlugId: Record<string, string> = {};

  constructor(initialConfig?: Partial<GameConfig>) {
    const config = createInitialConfig(initialConfig);
    this.state = createInitialState(config);
    this.initTerrain();
  }

  public initTerrain(): void {
    const { terrain, waterLevel } = initializeTerrainForConfig(this.state.config);
    this.terrain = terrain;
    this.state.waterLevel = waterLevel;
  }

  public setConfig(partial: Partial<GameConfig>): boolean {
    if (this.state.phase !== 'LOBBY') return false;
    this.state.config = { ...this.state.config, ...partial };
    if (partial.mapTheme !== undefined && partial.mapSeed === undefined) {
      this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    }
    if (partial.mapSeed !== undefined || partial.mapTheme !== undefined || partial.mapSize !== undefined) {
      this.initTerrain();
    }
    return true;
  }

  public addTeam(id: string, name: string, color: string, avatar: string, isHost: boolean): void {
    registerTeam(this.state, id, name, color, avatar, isHost);
  }

  public removeTeam(id: string): void {
    unregisterTeam(this.state, id);
  }

  public getNextSlugForTeam(teamId: string): string {
    return getNextSlugForTeam(this.state, teamId, this.teamLastPlayedSlugId);
  }

  public carveCrater(x: number, y: number, radius: number): void {
    if (!this.state.craters) this.state.craters = [];
    const rX = Math.round(x);
    const rY = Math.round(y);
    const rR = Math.round(radius);
    const id = `c_${rX}_${rY}_${rR}_${this.state.craters.length}`;
    this.state.craters.push({ id, x: rX, y: rY, radius: rR, createdAt: Date.now() });
    const { destroyedOilDrums } = this.terrain.carveExplosion(x, y, radius);
    if (destroyedOilDrums && destroyedOilDrums.length > 0) {
      for (const drum of destroyedOilDrums) {
        this.detonateOilDrum(drum);
      }
    }
  }

  public detonateOilDrum(drum: SolidProp): void {
    detonateOilDrum(
      this.state,
      this.terrain,
      drum,
      (x, y, r) => this.carveCrater(x, y, r),
      (msg, type) => this.addLog(msg, type)
    );
  }

  public startGame(): boolean {
    if (this.state.teams.length === 0) return false;
    if (this.state.config.mapSeed === undefined || this.state.config.mapSeed === null) {
      this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    }
    this.initTerrain();
    this.state.slugs = [];
    this.teamLastPlayedSlugId = {};

    const weaponSet = getWeaponSet(this.state.config.weaponSetId);
    for (const team of this.state.teams) {
      team.inventory = { ...weaponSet.inventory };
      team.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
    }

    this.state.explosions = [];
    this.state.particles = [];
    this.state.projectiles = [];
    this.state.floatingDamages = [];
    this.state.supplyCrates = [];
    this.state.girders = [];
    this.state.craters = [];
    this.state.journal = [];

    for (const team of this.state.teams) {
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
      }
    }

    this.state.mines = (this.terrain.data.minePoints || []).map((pt, idx) => ({
      id: `mine_${idx}_${Date.now()}`,
      x: pt.x,
      y: pt.y,
      isTriggered: false,
    }));

    if (this.state.config.vehiclesEnabled) {
      const { width, theme, waterLevel } = this.terrain.data;
      let spawnX = Math.floor(width * 0.5);
      let spawnY = 150;
      let foundGround = false;
      const scanStartY = theme === 'CAVERN' ? 70 : 20;
      const candidateOffsets = [0, -100, 100, -200, 200, -300, 300, -400, 400];

      for (const offsetX of candidateOffsets) {
        const testX = Math.max(100, Math.min(width - 100, Math.floor(width * 0.5) + offsetX));
        for (let y = scanStartY; y < waterLevel - 45; y++) {
          if (this.terrain.isSolid(testX, y)) {
            let hasOpenHeadroom = true;
            for (let check = 1; check <= 32; check++) {
              if (this.terrain.isSolid(testX, y - check)) {
                hasOpenHeadroom = false;
                break;
              }
            }
            if (hasOpenHeadroom) {
              spawnX = testX;
              spawnY = y - 14;
              foundGround = true;
              break;
            }
          }
        }
        if (foundGround) break;
      }

      this.state.helicopters = [
        {
          id: 'heli_1',
          x: spawnX,
          y: spawnY,
          vx: 0,
          vy: 0,
          hp: 150,
          maxHp: 150,
          facing: 'right',
          pilotSlugId: null,
          rotorAngle: 0,
        },
      ];
    } else {
      this.state.helicopters = [];
    }

    PhaseManager.startPlacement(this.state);
    this.addLog('Phase de Placement ! Placez vos limaces à tour de rôle sur le terrain.', 'info');
    return true;
  }

  public restartGame(): void {
    PhaseManager.startLobby(this.state);
    this.addLog('Retour au salon d\'attente.', 'info');
  }

  public enterVehicle(): boolean {
    return enterVehicle(this.state, (msg, type) => this.addLog(msg, type));
  }

  public exitVehicle(): boolean {
    return exitVehicle(this.state, (msg, type) => this.addLog(msg, type));
  }

  public steerVehicle(dir: 'left' | 'right' | 'up' | 'down'): void {
    steerVehicle(this.state, dir);
  }

  public placeSlug(point: Vector2D): boolean {
    if (this.state.phase !== 'PLACEMENT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || activeSlug.isPlaced) return false;

    const safePt = this.findSafePlacementPoint(point.x, point.y, this.state.slugs);
    activeSlug.x = safePt.x;
    activeSlug.y = safePt.y;
    activeSlug.isPlaced = true;
    sfx.play('jump');
    this.addLog(`${activeSlug.name} positionné sur le terrain !`, 'info');

    const unplaced = this.state.slugs.filter((s) => !s.isPlaced);
    if (unplaced.length === 0) {
      this.state.activeTeamId = this.state.teams[0].id;
      this.state.activeSlugId = this.getNextSlugForTeam(this.state.activeTeamId) || this.state.slugs[0].id;
      this.randomizeWind();
      PhaseManager.startAiming(this.state);
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
    randomizeWind(this.state);
  }

  public findSafePlacementPoint(targetX: number, targetY: number, existingSlugs: Slug[] = []): Vector2D {
    return findSafePlacementPoint(this.terrain, targetX, targetY, existingSlugs);
  }

  public findSafeTeleportPoint(targetX: number, targetY: number, existingSlugs: Slug[] = []): Vector2D {
    return findSafeTeleportPoint(this.terrain, targetX, targetY, existingSlugs);
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

  public startCharge(targetPoint?: Vector2D): void {
    if (this.state.phase !== 'AIMING') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug && activeSlug.isAlive) {
      activeSlug.isChargingPower = true;
      activeSlug.aimPower = 5;
      if (targetPoint) {
        activeSlug.currentTargetPoint = targetPoint;
      }
    }
  }

  public releaseCharge(targetPoint?: Vector2D): void {
    if (this.state.phase !== 'AIMING') return;
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

  public startSteer(dir: 'left' | 'right'): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = dir;
  }

  public stopSteer(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (activeSlug) activeSlug.steeringDir = null;
  }

  public moveSlug(dir: 'left' | 'right'): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME' && this.state.phase !== 'RETREAT') return false;
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
    this.carveCrater(sheep.x, sheep.y, weapon.radius);
    this.state.explosions.push({
      id: `ex_${Date.now()}_${Math.random()}`,
      x: sheep.x,
      y: sheep.y,
      radius: weapon.radius,
      damage: weapon.damage,
      customSound: weapon.customSoundKey,
      createdAt: Date.now(),
    });

    applyExplosionToSlugs(sheep.x, sheep.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain, this.state.teams, sheep.ownerSlugId);
    this.state.phase = 'RESOLVING';
    this.state.phaseTimer = 5.0;
    this.state.settleTimer = 1.2;
    return true;
  }

  public jumpSlug(): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME' && this.state.phase !== 'RETREAT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    if (activeSlug.ropeState) {
      const rope = activeSlug.ropeState;
      activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity * 1.25;
      activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity * 1.25 - 2;
      activeSlug.ropeState = null;
      sfx.play('jump');
      return true;
    }

    if (isSlugGrounded(activeSlug, this.terrain, this.state.slugs)) {
      activeSlug.vy = -7.5;
      activeSlug.vx += activeSlug.facing === 'right' ? 2 : -2;
      sfx.play('jump');
      return true;
    }
    return false;
  }

  public selectWeapon(weaponId: string): boolean {
    return selectWeapon(this.state, weaponId);
  }

  public setFuseTimer(slugId: string, seconds: number): void {
    setFuseTimer(this.state, slugId, seconds);
  }

  public fireWeapon(targetPoint?: Vector2D): boolean {
    return fireWeapon(this.state, this.terrain, targetPoint, (msg, type) => this.addLog(msg, type));
  }

  public tick(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    const activeSlugHpBefore = activeSlug && activeSlug.isAlive ? activeSlug.hp : 0;

    // 1. Slugs physics, water & fall damage update (runs every tick unconditionally)
    const effectiveWaterY = this.state.waterLevel ?? this.terrain.data.waterLevel;
    for (const slug of this.state.slugs) {
      if (slug.y >= effectiveWaterY) {
        if (slug.isAlive) {
          const victimTeam = this.state.teams.find((t) => t.id === slug.teamId);
          if (victimTeam) {
            if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
            victimTeam.stats.deaths++;
          }
        }
        slug.hp = 0;
        slug.isAlive = false;
      }

      const phys = updateSlugPhysics(slug, this.terrain, this.state.slugs);
      if (phys.fallDamage) {
        this.addLog(`💥 ${slug.name} a subi ${phys.fallDamage} dégâts de chute !`, 'combat');
        sfx.play('ouch');
        this.state.floatingDamages.push({
          id: `fd_${Date.now()}_${Math.random()}`,
          x: slug.x,
          y: slug.y - 24,
          damage: phys.fallDamage,
          createdAt: Date.now(),
        });

        const victimTeam = this.state.teams.find((t) => t.id === slug.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.damageTaken += phys.fallDamage;
          if (slug.hp === 0) victimTeam.stats.deaths++;
        }
      }
    }

    if (
      activeSlug &&
      !activeSlug.isAlive &&
      (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE' || this.state.phase === 'RETREAT')
    ) {
      PhaseManager.startResolving(this.state, { settleTimer: 1.2, phaseTimeout: 8.0 });
    }

    if (activeSlug && activeSlug.isAlive && this.state.phase === 'AIMING') {
      if (activeSlug.ropeState) {
        const rope = activeSlug.ropeState;
        const isHookSolid =
          this.terrain.isSolid(rope.hookX, rope.hookY) ||
          this.terrain.isSolid(rope.hookX - 2, rope.hookY) ||
          this.terrain.isSolid(rope.hookX + 2, rope.hookY);

        if (!isHookSolid) {
          activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity;
          activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity;
          activeSlug.ropeState = null;
          this.addLog("Le support du grappin a cédé ! 💥", 'weapon');
          sfx.play('bounce');
          return;
        }

        const g = 20;
        let alpha = -(g / Math.max(25, rope.length)) * Math.sin(rope.angleRad);

        if (activeSlug.movingDir === 'left') alpha -= 0.15;
        else if (activeSlug.movingDir === 'right') alpha += 0.15;

        const prevAngle = rope.angleRad;
        const prevLength = rope.length;
        let targetLength = rope.length;
        if (activeSlug.steeringDir === 'left') targetLength = Math.max(25, rope.length - 4);
        else if (activeSlug.steeringDir === 'right') targetLength = Math.min(250, rope.length + 4);

        rope.angularVelocity = (rope.angularVelocity + alpha) * 0.993;
        const targetAngle = prevAngle + rope.angularVelocity;

        const angleDiff = targetAngle - prevAngle;
        const lengthDiff = targetLength - prevLength;
        const arcDist = Math.abs(angleDiff) * targetLength;
        const totalDist = arcDist + Math.abs(lengthDiff);
        const subSteps = Math.max(1, Math.min(16, Math.ceil(totalDist / 2.0)));

        let finalAngle = prevAngle;
        let finalLength = prevLength;
        let finalX = rope.hookX + Math.sin(prevAngle) * prevLength;
        let finalY = rope.hookY + Math.cos(prevAngle) * prevLength;
        let hitWall = false;

        for (let s = 1; s <= subSteps; s++) {
          const t = s / subSteps;
          const stepAngle = prevAngle + angleDiff * t;
          const stepLength = prevLength + lengthDiff * t;
          const stepX = rope.hookX + Math.sin(stepAngle) * stepLength;
          const stepY = rope.hookY + Math.cos(stepAngle) * stepLength;

          const isBodySolid =
            this.terrain.isSolid(Math.floor(stepX), Math.floor(stepY - 6)) ||
            this.terrain.isSolid(Math.floor(stepX - 6), Math.floor(stepY - 6)) ||
            this.terrain.isSolid(Math.floor(stepX + 6), Math.floor(stepY - 6));

          if (isBodySolid) {
            hitWall = true;
            break;
          }

          finalAngle = stepAngle;
          finalLength = stepLength;
          finalX = stepX;
          finalY = stepY;
        }

        if (hitWall) {
          rope.angularVelocity = -rope.angularVelocity * 0.45;
          rope.angleRad = finalAngle;
          rope.length = finalLength;
          sfx.play('bounce');
        } else {
          rope.angleRad = finalAngle;
          rope.length = finalLength;
        }

        const newX = finalX;
        const newY = finalY;
        if (newY >= this.terrain.data.waterLevel) {
          activeSlug.ropeState = null;
          activeSlug.y = this.terrain.data.waterLevel;
        } else {
          activeSlug.x = newX;
          activeSlug.y = newY;
          activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity;
          activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity;
        }
      } else {
        if (activeSlug.movingDir) {
          this.moveSlug(activeSlug.movingDir);
        }
        if (activeSlug.isChargingPower) {
          activeSlug.aimPower += 2.5;
          if (activeSlug.aimPower >= 100) {
            activeSlug.aimPower = 100;
            activeSlug.isChargingPower = false;
            this.fireWeapon(activeSlug.currentTargetPoint);
          }
        }
      }
    }

    if (activeSlug && activeSlug.isAlive && activeSlug.isBlowtorching) {
      const activeTeam = this.state.teams.find((t) => t.id === activeSlug.teamId);
      const fuel = activeTeam ? activeTeam.inventory['blowtorch'] ?? 0 : 0;

      if (fuel <= 0) {
        activeSlug.isBlowtorching = false;
        if (activeTeam) activeTeam.inventory['blowtorch'] = 0;
        this.addLog(`Le réservoir du Chalumeau est vide ! ⛽`, 'info');
      } else {
        if (activeTeam) {
          activeTeam.inventory['blowtorch'] = Math.max(0, fuel - 1.43);
        }

        const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);
        const flameX = activeSlug.x + dirX * 18;
        const flameY = activeSlug.y - 8 + dirY * 18;

        this.carveCrater(flameX, flameY, 18);
        this.state.explosions.push({
          id: `ex_bt_${Date.now()}_${Math.random()}`,
          x: flameX,
          y: flameY,
          radius: 18,
          damage: 0,
          createdAt: Date.now(),
        });

        activeSlug.x += dirX * 1.3;
        activeSlug.y += dirY * 1.3;

        for (const other of this.state.slugs) {
          if (other.id !== activeSlug.id && other.isAlive && Math.hypot(other.x - flameX, other.y - flameY) < 22) {
            const victimHpBefore = other.hp;
            const actualDamage = Math.min(victimHpBefore, 2);
            other.hp = Math.max(0, other.hp - 2);
            other.vx = dirX * 4;
            other.vy = dirY * 4 - 1;

            const victimTeam = this.state.teams.find((t) => t.id === other.teamId);
            if (victimTeam) {
              if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
              victimTeam.stats.damageTaken += actualDamage;
              if (other.hp === 0 && victimHpBefore > 0) victimTeam.stats.deaths++;
            }
          }
        }

        const curWaterY = this.state.waterLevel ?? this.terrain.data.waterLevel;
        if (activeSlug.y >= curWaterY) {
          activeSlug.isBlowtorching = false;
        }
      }
    }

    const activeSheep = this.state.projectiles.find((p) => p.weaponId === 'super_sheep');
    if (activeSheep && activeSlug && activeSlug.steeringDir) {
      this.steerSheep(activeSlug.steeringDir);
    }

    updateHelicopters(this.state, this.terrain, (msg, type) => this.addLog(msg, type));

    if (
      activeSlug &&
      activeSlug.isAlive &&
      activeSlug.hp < activeSlugHpBefore &&
      this.state.phase === 'AIMING'
    ) {
      PhaseManager.startResolving(this.state, {
        settleTimer: 1.2,
        phaseTimeout: 8.0,
        reason: `⚡ ${activeSlug.name} a pris des dégâts ! Fin du tour !`,
        addLog: (msg, type) => this.addLog(msg, type),
      });
      return;
    }

    if (this.state.projectiles.length > 0) {
      const remaining: typeof this.state.projectiles = [];
      for (const proj of this.state.projectiles) {
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

          this.carveCrater(pt.x, pt.y, weapon.radius);
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
          const expRes = applyExplosionToSlugs(pt.x, pt.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain, this.state.teams, proj.ownerSlugId);
          for (const dm of expRes.damageEvents) {
            this.state.floatingDamages.push({
              id: `fd_${now}_${Math.random()}`,
              x: dm.x,
              y: dm.y,
              damage: dm.damage,
              createdAt: now,
            });
          }

          if (proj.weaponId === 'banana_bomb') {
            for (let i = 0; i < 5; i++) {
              const angle = (i / 5) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
              const speed = 4 + Math.random() * 4;
              remaining.push({
                id: `proj_bananette_${now}_${i}_${Math.random()}`,
                weaponId: 'cluster_banana',
                x: pt.x,
                y: pt.y - 6,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                radius: 4,
                bounces: true,
                windAffected: false,
                fuseTimerMs: 2000 + Math.random() * 800,
                ownerSlugId: proj.ownerSlugId,
              });
            }
          } else if (proj.weaponId === 'concrete_donkey') {
            const bouncesLeft = (proj.behaviorData?.bouncesLeft ?? 8) - 1;
            const curWaterY = this.state.waterLevel ?? this.terrain.data.waterLevel;
            if (bouncesLeft > 0 && pt.y < curWaterY + 30) {
              proj.x = pt.x + (Math.random() - 0.5) * 4;
              proj.y = pt.y - 14;
              proj.vx = (Math.random() - 0.5) * 2;
              proj.vy = -7.5;
              proj.behaviorData = { ...proj.behaviorData, bouncesLeft };
              sfx.play('donkey');
              this.addLog(`🫏 L'Âne de Béton pilonne et rebondit à travers le terrain ! (${bouncesLeft} impacts restants)`, 'combat');
              remaining.push(proj);
            }
          }
        } else {
          remaining.push(proj);
        }
      }
      this.state.projectiles = remaining;
      if (this.state.projectiles.length === 0 && this.state.phase === 'PROJECTILE_ACTIVE') {
        this.state.phase = 'RESOLVING';
        this.state.phaseTimer = 5.0;
        this.state.settleTimer = 1.2;
      }
    }

    updateMines(
      this.state,
      this.terrain,
      (x, y, r) => this.carveCrater(x, y, r),
      (msg, type) => this.addLog(msg, type)
    );
    updateSupplyCrates(this.state, this.terrain, (msg, type) => this.addLog(msg, type));

    if (this.state.particles && this.state.particles.length > 0) {
      const remainingParticles: Particle[] = [];
      for (const p of this.state.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        if (p.life > 0) remainingParticles.push(p);
      }
      this.state.particles = remainingParticles;
    }

    const currentTime = Date.now();
    this.state.explosions = this.state.explosions.filter(
      (ex) => currentTime - (ex.createdAt || currentTime) < 350
    );
    this.state.floatingDamages = (this.state.floatingDamages || []).filter(
      (fd) => currentTime - fd.createdAt < 1000
    );

    PhaseManager.updatePhaseTick(this.state, this.terrain, 0.05, {
      addLog: (msg, type) => this.addLog(msg, type),
      advanceToNextTurn: () => this.endTurn(),
    });
  }

  public endTurn(): void {
    PhaseManager.advanceToNextTurn(this.state, this.terrain, {
      addLog: (msg, type) => this.addLog(msg, type),
      randomizeWind: (state) => randomizeWind(state),
      getNextSlugForTeam: (teamId) => this.getNextSlugForTeam(teamId),
      checkWinner: () => this.checkWinner(),
    });
  }

  public checkWinner(): void {
    checkWinner(this.state, (msg, type) => this.addLog(msg, type));
  }

  public isWorldAtRest(): boolean {
    return isWorldAtRest(this.state, this.terrain);
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
