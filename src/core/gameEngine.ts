import { GameState, GameConfig, Team, Slug, Vector2D, JournalEntry, Landmine, Particle, HelicopterVehicle, MAP_SIZE_CONFIGS } from './types';
import { getWeaponSet } from './weapons/weaponSets';
import { getWeapon } from './weapons/registry';
import { generateProceduralTerrain } from './terrainGenerator';
import { DestructibleTerrain } from './terrain';
import { updateProjectilePhysics, applyExplosionToSlugs, updateSlugPhysics, isSlugGrounded, updateHelicopterPhysics } from './physics';
import { sfx } from './audio';

export class SlugWarsEngine {
  public state: GameState;
  public terrain!: DestructibleTerrain;

  constructor(initialConfig?: Partial<GameConfig>) {
    const config: GameConfig = {
      weaponSetId: 'CLASSIC',
      slugHp: 100,
      slugsPerTeam: 3,
      turnDuration: 45,
      windEnabled: true,
      vehiclesEnabled: true,
      dayNightCycle: 'DAY',
      mapTheme: 'ISLAND',
      mapSize: 'NORMAL',
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
    const sizeCfg = MAP_SIZE_CONFIGS[this.state.config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;
    const data = generateProceduralTerrain(
      this.state.config.mapSeed,
      this.state.config.mapTheme,
      sizeCfg.width,
      sizeCfg.height
    );
    this.terrain = new DestructibleTerrain(data);
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
    const teamSlugs = this.state.slugs.filter((s) => s.teamId === teamId && s.isAlive && s.hp > 0);
    if (teamSlugs.length === 0) return '';

    let prevIndex = this.teamLastSlugIndex[teamId];
    if (prevIndex === undefined || prevIndex < 0 || prevIndex >= teamSlugs.length) {
      prevIndex = -1;
    }

    const nextIndex = (prevIndex + 1) % teamSlugs.length;
    this.teamLastSlugIndex[teamId] = nextIndex;

    return teamSlugs[nextIndex].id;
  }

  public startGame(): boolean {
    if (this.state.teams.length === 0) return false;
    if (this.state.config.mapSeed === undefined || this.state.config.mapSeed === null) {
      this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    }
    this.initTerrain();
    this.state.slugs = [];
    this.teamLastSlugIndex = {};

    // 1. Reset Inventory Ammo & Stats for all Teams!
    const weaponSet = getWeaponSet(this.state.config.weaponSetId);
    for (const team of this.state.teams) {
      team.inventory = { ...weaponSet.inventory };
      team.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
      this.teamLastSlugIndex[team.id] = -1;
    }

    // 2. Clear all transient visual effects & active entities!
    this.state.explosions = [];
    this.state.particles = [];
    this.state.projectiles = [];
    this.state.floatingDamages = [];
    this.state.supplyCrates = [];
    this.state.girders = [];
    this.state.journal = [];

    let slugIndex = 1;
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
        slugIndex++;
      }
    }

    this.state.mines = (this.terrain.data.minePoints || []).map((pt, idx) => ({
      id: `mine_${idx}_${Date.now()}`,
      x: pt.x,
      y: pt.y,
      isTriggered: false,
    }));

    if (this.state.config.vehiclesEnabled) {
      const { width, height, theme, waterLevel } = this.terrain.data;
      let spawnX = Math.floor(width * 0.5);
      let spawnY = 150;
      let foundGround = false;

      const scanStartY = theme === 'CAVERN' ? 70 : 20;

      // Scan X columns from center outward to find solid earth ground with clear open headroom
      const candidateOffsets = [0, -100, 100, -200, 200, -300, 300, -400, 400];
      for (const offsetX of candidateOffsets) {
        const testX = Math.max(100, Math.min(width - 100, Math.floor(width * 0.5) + offsetX));

        for (let y = scanStartY; y < waterLevel - 45; y++) {
          // Check for solid ground pixel
          if (this.terrain.isSolid(testX, y)) {
            // Verify there is at least 32px of OPEN AIR headroom directly above this ground!
            let hasOpenHeadroom = true;
            for (let check = 1; check <= 32; check++) {
              if (this.terrain.isSolid(testX, y - check)) {
                hasOpenHeadroom = false;
                break;
              }
            }

            if (hasOpenHeadroom) {
              spawnX = testX;
              spawnY = y - 14; // Place helicopter skids sitting flat ON TOP of solid ground!
              foundGround = true;
              break;
            }
          }
        }
        if (foundGround) break;
      }

      this.state.helicopters = [
        {
          id: `heli_1`,
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

    this.state.phase = 'PLACEMENT';
    this.state.activeTeamId = this.state.teams[0].id;
    const firstSlug = this.state.slugs.find((s) => s.teamId === this.state.activeTeamId && !s.isPlaced);
    this.state.activeSlugId = firstSlug ? firstSlug.id : this.state.slugs[0].id;
    this.state.turnTimer = 30;
    this.addLog('Phase de Placement ! Placez vos limaces à tour de rôle sur le terrain.', 'info');
    return true;
  }

  public enterVehicle(): boolean {
    if (this.state.phase !== 'AIMING') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive || activeSlug.inVehicleId) return false;

    const nearbyHeli = this.state.helicopters.find(
      (h) => !h.pilotSlugId && Math.hypot(h.x - activeSlug.x, h.y - activeSlug.y) < 65
    );

    if (nearbyHeli) {
      nearbyHeli.pilotSlugId = activeSlug.id;
      activeSlug.inVehicleId = nearbyHeli.id;
      sfx.play('teleport');
      this.addLog(`${activeSlug.name} s'est installé aux commandes de l'hélicoptère ! 🚁`, 'info');
      return true;
    }
    return false;
  }

  public exitVehicle(): boolean {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.inVehicleId) return false;

    const heli = this.state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
    if (heli) {
      heli.pilotSlugId = null;
      activeSlug.inVehicleId = null;
      activeSlug.x = heli.x + (heli.facing === 'right' ? 25 : -25);
      activeSlug.y = heli.y - 10;
      activeSlug.vy = -4;
      this.addLog(`${activeSlug.name} est sorti de l'hélicoptère.`, 'info');
      return true;
    }
    return false;
  }

  public steerVehicle(dir: 'left' | 'right' | 'up' | 'down'): void {
    if (this.state.phase !== 'AIMING') return;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.inVehicleId) return;

    const heli = this.state.helicopters.find((h) => h.id === activeSlug.inVehicleId);
    if (!heli) return;

    if (dir === 'left') {
      heli.vx = -4.5;
      heli.facing = 'left';
    } else if (dir === 'right') {
      heli.vx = 4.5;
      heli.facing = 'right';
    } else if (dir === 'up') {
      if (heli.y > 30) {
        heli.vy = -4.8;
      }
    } else if (dir === 'down') {
      heli.vy = 3.5;
    }
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
      this.randomizeWind();
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

    applyExplosionToSlugs(sheep.x, sheep.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain, this.state.teams, sheep.ownerSlugId);
    this.state.phase = 'RESOLVING';
    this.state.phaseTimer = 0.8;
    return true;
  }

  public jumpSlug(): boolean {
    if (this.state.phase !== 'AIMING' && this.state.phase !== 'TURN_TIME' && this.state.phase !== 'RETREAT') return false;
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    if (!activeSlug || !activeSlug.isAlive) return false;

    if (activeSlug.ropeState) {
      // Detach from rope with full swinging momentum!
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

    if (targetPoint) {
      activeSlug.currentTargetPoint = targetPoint;
    } else if (activeSlug.currentTargetPoint) {
      targetPoint = activeSlug.currentTargetPoint;
    }

    if (weapon.behavior === 'TELEPORT' && targetPoint) {
      const safePt = this.findSafeTeleportPoint(targetPoint.x, targetPoint.y);
      activeSlug.x = safePt.x;
      activeSlug.y = safePt.y;
      activeSlug.vx = 0;
      activeSlug.vy = 0;
      sfx.play('teleport');
      this.addLog(`${activeSlug.name} s'est téléporté !`, 'weapon');
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.5;
      return true;
    }

    if (weapon.id === 'blowtorch') {
      activeSlug.isBlowtorching = true;
      activeSlug.aimPower = 5;
      sfx.play('fire');
      this.addLog(`${activeSlug.name} allume son Chalumeau ! 🔥 (Maintenez pour creuser)`, 'weapon');
      return true;
    }

    if (weapon.id === 'ninja_rope') {
      const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
      const dirX = Math.cos(angleRad);
      const dirY = Math.sin(angleRad);

      const maxRange = 550;
      const startX = activeSlug.x;
      const startY = activeSlug.y - 12;

      let hitSolid = false;
      let hookX = startX;
      let hookY = startY;

      for (let dist = 10; dist <= maxRange; dist += 3) {
        const testX = startX + dirX * dist;
        const testY = startY + dirY * dist;

        if (testX < 0 || testX >= this.terrain.data.width || testY < 0) {
          break;
        }

        if (this.terrain.isSolid(testX, testY)) {
          hitSolid = true;
          hookX = testX;
          hookY = testY;
          break;
        }
      }

      if (hitSolid) {
        const ropeLength = Math.hypot(startX - hookX, startY - hookY);
        const initialAngle = Math.atan2(startX - hookX, startY - hookY);

        activeSlug.ropeState = {
          hookX,
          hookY,
          length: Math.max(25, ropeLength),
          angleRad: initialAngle,
          angularVelocity: activeSlug.facing === 'right' ? 0.04 : -0.04,
        };

        sfx.play('rope_attach');
        this.addLog(`${activeSlug.name} a accroché son Grappin Ninja ! 🪢`, 'weapon');
      } else {
        sfx.play('rope_shoot');
        this.addLog(`Le grappin n'a rien accroché !`, 'info');
      }
      return true;
    }

    if (weapon.id === 'girder' && targetPoint) {
      const length = 110;
      const thickness = 14;
      const angleDeg = activeSlug.aimAngle || 0;
      const rad = (angleDeg * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      const halfL = length / 2;
      const halfT = thickness / 2;

      const gx = targetPoint.x;
      const gy = targetPoint.y;

      const w = this.terrain.data.width;
      const h = this.terrain.data.height;

      for (let dl = -halfL; dl <= halfL; dl++) {
        for (let dt = -halfT; dt <= halfT; dt++) {
          const px = Math.round(gx + dl * cos - dt * sin);
          const py = Math.round(gy + dl * sin + dt * cos);
          if (px >= 0 && px < w && py >= 0 && py < h) {
            this.terrain.data.grid[py * w + px] = 1;
          }
        }
      }

      if (!this.state.girders) this.state.girders = [];
      this.state.girders = [
        ...this.state.girders,
        {
          id: `girder_${Date.now()}_${Math.random()}`,
          x: gx,
          y: gy,
          angleDeg,
          length,
          thickness,
        }
      ];

      sfx.play('girder');
      this.addLog(`${activeSlug.name} a posé une Poutre Métallique ! 🪜`, 'weapon');
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.5;
      return true;
    }

    if (weapon.behavior === 'AIRDROP' && targetPoint) {
      if (!this.state.supplyCrates) this.state.supplyCrates = [];
      this.state.supplyCrates.push({
        id: `crate_${Date.now()}_${Math.random()}`,
        x: targetPoint.x,
        y: -30,
        vy: 2.2,
        isLanded: false,
        crateType: 'health',
        healAmount: 50,
      });

      sfx.play('airdrop');
      this.addLog(`✈️ Largage aérien d'une Caisse de Ravitaillement en cours ! 📦`, 'weapon');
      this.state.phase = 'RETREAT';
      this.state.retreatTimer = 4.0;
      return true;
    }

    if (weapon.behavior === 'MELEE_PUSH') {
      const targetSlug = this.state.slugs.find(
        (s) => s.id !== activeSlug.id && s.isAlive && Math.hypot(s.x - activeSlug.x, s.y - activeSlug.y) < 40
      );
      if (targetSlug) {
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        const victimHpBefore = targetSlug.hp;
        const actualDamage = Math.min(victimHpBefore, weapon.damage);
        targetSlug.hp = Math.max(0, targetSlug.hp - weapon.damage);
        if (targetSlug.hp === 0) {
          targetSlug.isAlive = false;
        }
        targetSlug.vx = dir * 18;
        targetSlug.vy = -10;

        const victimTeam = this.state.teams.find((t) => t.id === targetSlug.teamId);
        if (victimTeam) {
          if (!victimTeam.stats) victimTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          victimTeam.stats.damageTaken += actualDamage;
          if (targetSlug.hp === 0 && victimHpBefore > 0) victimTeam.stats.deaths++;
        }

        if (activeTeam && activeTeam.id !== targetSlug.teamId) {
          if (!activeTeam.stats) activeTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
          activeTeam.stats.damageDealt += actualDamage;
          if (targetSlug.hp === 0 && victimHpBefore > 0) activeTeam.stats.kills++;
        }

        this.addLog(`${activeSlug.name} a frappé ${targetSlug.name} à la batte !`, 'combat');
      }
      sfx.play('melee');
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.8;
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

    if (weapon.id === 'dynamite' || weapon.id === 'holy_grenade' || weapon.id === 'banana_bomb' || weapon.behavior === 'BOUNCING_TIMER') {
      this.state.phase = 'RETREAT';
      this.state.retreatTimer = 4.0;
      this.addLog(`🏃 TEMPS DE FUITE (RETREAT) ! 4s pour vous mettre à l'abri !`, 'info');
    }

    sfx.play('fire');
    this.addLog(`${activeSlug.name} a tiré avec ${weapon.name} ! (Puissance: ${Math.round(activeSlug.aimPower)}%)`, 'weapon');
    return true;
  }

  public tick(): void {
    const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
    const activeSlugHpBefore = activeSlug && activeSlug.isAlive ? activeSlug.hp : 0;

    // 1. TURN_START Phase (Banner transition)
    if (this.state.phase === 'TURN_START') {
      if (this.state.phaseTimer !== undefined) {
        this.state.phaseTimer -= 0.05;
        if (this.state.phaseTimer <= 0) {
          this.state.phase = 'AIMING';
          this.state.phaseTimer = undefined;
        }
      }
    }

    // 2. RETREAT Phase (3 to 5 second retreat countdown with fast beeps)
    if (this.state.phase === 'RETREAT') {
      if (this.state.retreatTimer !== undefined) {
        const prevSec = Math.ceil(this.state.retreatTimer);
        this.state.retreatTimer -= 0.05;
        const newSec = Math.ceil(this.state.retreatTimer);
        if (newSec < prevSec && newSec > 0) {
          sfx.play('tick');
        }
        if (this.state.retreatTimer <= 0) {
          this.state.retreatTimer = undefined;
          if (this.state.projectiles.length > 0) {
            this.state.phase = 'PROJECTILE_ACTIVE';
          } else {
            this.state.phase = 'RESOLVING';
            this.state.phaseTimer = 0.6;
          }
        }
      }
    }

    // 3. RESOLVING Phase (Wait until all physics, explosions, damage, and falling slugs have 100% calmed down)
    if (this.state.phase === 'RESOLVING') {
      if (this.isWorldAtRest()) {
        if (this.state.phaseTimer === undefined) {
          this.state.phaseTimer = 0.4;
        } else {
          this.state.phaseTimer -= 0.05;
          if (this.state.phaseTimer <= 0) {
            this.state.phaseTimer = undefined;
            this.endTurn();
            return;
          }
        }
      } else {
        // Still active movement, bouncing, or explosions: keep settling timer refreshed
        this.state.phaseTimer = 0.4;
      }
    }

    // If active slug dies (e.g. drowns or dies from explosion), transition to resolution
    if (activeSlug && !activeSlug.isAlive && (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE' || this.state.phase === 'RETREAT')) {
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.6;
    }

    if (activeSlug && activeSlug.isAlive && this.state.phase === 'AIMING') {
      // Active Ninja Rope Swinging & Climbing (Smooth Pendulum with Slug Body Collision & Support Check)
      if (activeSlug.ropeState) {
        const rope = activeSlug.ropeState;

        // Check if rope anchor point is still anchored in solid terrain
        const isHookSolid =
          this.terrain.isSolid(rope.hookX, rope.hookY) ||
          this.terrain.isSolid(rope.hookX - 2, rope.hookY) ||
          this.terrain.isSolid(rope.hookX + 2, rope.hookY) ||
          this.terrain.isSolid(rope.hookX, rope.hookY - 2) ||
          this.terrain.isSolid(rope.hookX, rope.hookY + 2);

        if (!isHookSolid) {
          // Anchor support was destroyed by explosion or crater! Detach rope and slug falls
          activeSlug.vx = Math.cos(rope.angleRad) * rope.length * rope.angularVelocity;
          activeSlug.vy = -Math.sin(rope.angleRad) * rope.length * rope.angularVelocity;
          activeSlug.ropeState = null;
          this.addLog("Le support du grappin a cédé ! 💥", 'weapon');
          sfx.play('bounce');
          return;
        }

        const g = 20;
        let alpha = -(g / Math.max(25, rope.length)) * Math.sin(rope.angleRad);

        // Swing pump with movement keys (A/D or Left/Right)
        if (activeSlug.movingDir === 'left') {
          alpha -= 0.15;
        } else if (activeSlug.movingDir === 'right') {
          alpha += 0.15;
        }

        // Climb up (W / Z / ArrowUp) or Descend down (S / ArrowDown)
        if (activeSlug.steeringDir === 'left') {
          rope.length = Math.max(25, rope.length - 4);
        } else if (activeSlug.steeringDir === 'right') {
          rope.length = Math.min(550, rope.length + 4);
        }

        const prevAngle = rope.angleRad;
        rope.angularVelocity = (rope.angularVelocity + alpha) * 0.993;
        rope.angleRad += rope.angularVelocity;

        let newX = rope.hookX + Math.sin(rope.angleRad) * rope.length;
        let newY = rope.hookY + Math.cos(rope.angleRad) * rope.length;

        // Check if slug body collides with solid terrain (wall/ceiling/ground)
        const isBodySolid =
          this.terrain.isSolid(newX, newY - 6) ||
          this.terrain.isSolid(newX - 6, newY - 6) ||
          this.terrain.isSolid(newX + 6, newY - 6) ||
          this.terrain.isSolid(newX, newY - 14) ||
          this.terrain.isSolid(newX, newY + 2);

        if (isBodySolid) {
          // Bounce off wall with elastic loss
          const wasFast = Math.abs(rope.angularVelocity) > 0.04;
          rope.angularVelocity = -rope.angularVelocity * 0.45;
          rope.angleRad = prevAngle + rope.angularVelocity;

          newX = rope.hookX + Math.sin(rope.angleRad) * rope.length;
          newY = rope.hookY + Math.cos(rope.angleRad) * rope.length;

          // If still solid after rebound (e.g. descending into ground), retract rope slightly
          if (this.terrain.isSolid(newX, newY) || this.terrain.isSolid(newX, newY + 2)) {
            rope.length = Math.max(25, rope.length - 4);
            newX = rope.hookX + Math.sin(rope.angleRad) * rope.length;
            newY = rope.hookY + Math.cos(rope.angleRad) * rope.length;
          }

          if (wasFast) {
            sfx.play('bounce');
          }
        }

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

    // Active Blowtorch Tunneling with gradual fuel depletion (usable little by little!)
    if (activeSlug && activeSlug.isAlive && activeSlug.isBlowtorching) {
      const activeTeam = this.state.teams.find((t) => t.id === activeSlug.teamId);
      const fuel = activeTeam ? activeTeam.inventory['blowtorch'] ?? 0 : 0;

      if (fuel <= 0) {
        activeSlug.isBlowtorching = false;
        if (activeTeam) activeTeam.inventory['blowtorch'] = 0;
        this.addLog(`Le réservoir du Chalumeau est vide ! ⛽`, 'info');
      } else {
        // Deplete fuel by ~1.43% per 50ms tick (total 3.5 seconds across all bursts)
        if (activeTeam) {
          activeTeam.inventory['blowtorch'] = Math.max(0, fuel - 1.43);
        }

        const angleRad = (activeSlug.facing === 'right' ? -activeSlug.aimAngle : 180 + activeSlug.aimAngle) * (Math.PI / 180);
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);

        const flameX = activeSlug.x + dirX * 18;
        const flameY = activeSlug.y - 8 + dirY * 18;

        // 1. Carve destructible terrain tunnel
        this.terrain.carveExplosion(flameX, flameY, 18);
        this.state.explosions.push({
          id: `ex_bt_${Date.now()}_${Math.random()}`,
          x: flameX,
          y: flameY,
          radius: 18,
          damage: 0,
          createdAt: Date.now(),
        });

        // 2. Move slug forward along blowtorch angle
        activeSlug.x += dirX * 1.3;
        activeSlug.y += dirY * 1.3;

        // 3. Flame particles
        for (let i = 0; i < 3; i++) {
          this.state.particles.push({
            x: flameX + (Math.random() - 0.5) * 6,
            y: flameY + (Math.random() - 0.5) * 6,
            vx: dirX * 4 + (Math.random() - 0.5) * 2,
            vy: dirY * 4 + (Math.random() - 0.5) * 2,
            color: Math.random() > 0.3 ? '#f97316' : '#fde047',
            size: Math.random() * 4 + 2,
            life: 0.8,
          });
        }

        // 4. Damage & push enemy slugs touched by torch beam
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
            const attackerTeam = this.state.teams.find((t) => t.id === activeSlug.teamId);
            if (attackerTeam && attackerTeam.id !== other.teamId) {
              if (!attackerTeam.stats) attackerTeam.stats = { kills: 0, deaths: 0, damageDealt: 0, damageTaken: 0 };
              attackerTeam.stats.damageDealt += actualDamage;
              if (other.hp === 0 && victimHpBefore > 0) attackerTeam.stats.kills++;
            }
          }
        }

        // Stop blowtorch if slug falls into water
        if (activeSlug.y >= this.terrain.data.waterLevel) {
          activeSlug.isBlowtorching = false;
        }
      }
    }

    const activeSheep = this.state.projectiles.find((p) => p.weaponId === 'super_sheep');
    if (activeSheep && activeSlug && activeSlug.steeringDir) {
      this.steerSheep(activeSlug.steeringDir);
    }

    if (this.state.helicopters && this.state.helicopters.length > 0) {
      for (const heli of this.state.helicopters) {
        const pilot = this.state.slugs.find((s) => s.id === heli.pilotSlugId);
        const res = updateHelicopterPhysics(heli, this.terrain, pilot);

        if (res.crashed || heli.hp <= 0) {
          this.state.explosions.push({
            id: `ex_heli_${Date.now()}_${Math.random()}`,
            x: heli.x,
            y: heli.y,
            radius: 55,
            damage: 45,
            createdAt: Date.now(),
          });
          if (pilot) {
            pilot.inVehicleId = null;
            pilot.hp = Math.max(0, pilot.hp - 35);
            pilot.vy = -8;
          }
          applyExplosionToSlugs(heli.x, heli.y, 55, 45, this.state.slugs, this.terrain, this.state.teams, heli.pilotSlugId || undefined);
          this.addLog(`💥 L'hélicoptère s'est crashé et a explosé !`, 'combat');
          heli.hp = 0;
        }
      }
      this.state.helicopters = this.state.helicopters.filter((h) => h.hp > 0 && h.y < this.terrain.data.waterLevel);
    }

    for (const slug of this.state.slugs) {
      // Check Drowning
      if (slug.y >= this.terrain.data.waterLevel) {
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

    // End turn immediately only if active player hurts THEMSELVES during their own active aiming turn!
    if (
      activeSlug &&
      activeSlug.isAlive &&
      activeSlug.hp < activeSlugHpBefore &&
      this.state.phase === 'AIMING'
    ) {
      this.addLog(`⚡ ${activeSlug.name} a pris des dégâts ! Fin du tour !`, 'combat');
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.8;
      return;
    }

    if (this.state.phase === 'PROJECTILE_ACTIVE' && (!this.state.projectiles || this.state.projectiles.length === 0)) {
      this.state.phase = 'RESOLVING';
      this.state.phaseTimer = 0.6;
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

          // Banana Bomb Cluster Separation into 5 mini-bananas!
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
          }

          // Concrete Donkey Multiple Bounce Tunneling (Crushes straight down through terrain!)
          if (proj.weaponId === 'concrete_donkey') {
            const bouncesLeft = (proj.behaviorData?.bouncesLeft ?? 8) - 1;
            if (bouncesLeft > 0 && pt.y < this.terrain.data.waterLevel - 30) {
              remaining.push({
                ...proj,
                id: `proj_donkey_${now}_${bouncesLeft}`,
                x: pt.x,
                y: pt.y + 16,
                vx: 0,
                vy: 14,
                behaviorData: { bouncesLeft },
              });
            }
          }
        } else {
          remaining.push(proj);
        }
      }
      this.state.projectiles = remaining;

      if (this.state.projectiles.length === 0 && this.state.phase === 'PROJECTILE_ACTIVE') {
        this.state.phase = 'RESOLVING';
        this.state.phaseTimer = 0.6;
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
          mine.fuseTimerMs -= 50;
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
          const mineExpRes = applyExplosionToSlugs(mine.x, mine.y, radius, damage, this.state.slugs, this.terrain, this.state.teams);
          for (const dm of mineExpRes.damageEvents) {
            this.state.floatingDamages.push({
              id: `fd_${now}_${Math.random()}`,
              x: dm.x,
              y: dm.y,
              damage: dm.damage,
              createdAt: now,
            });
          }

          // If the active slug took damage during its active turn, transition to resolving!
          const activeSlugTookDamage = mineExpRes.damageEvents.some(
            (dm) => dm.slugId === this.state.activeSlugId
          );
          if (activeSlugTookDamage && this.state.phase === 'AIMING') {
            const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
            this.addLog(`💥 ${activeSlug?.name || 'La limace'} s'est fait sauter sur une mine ! Fin du tour !`, 'combat');
            this.state.phase = 'RESOLVING';
            this.state.phaseTimer = 0.8;
          }
        } else {
          remainingMines.push(mine);
        }
      }
      this.state.mines = remainingMines;
    }

    // 6. Update Supply Crates (Falling with Parachute & Ground Pickup)
    if (this.state.supplyCrates && this.state.supplyCrates.length > 0) {
      const remainingCrates: typeof this.state.supplyCrates = [];
      for (const crate of this.state.supplyCrates) {
        if (!crate.isLanded) {
          crate.x += this.state.wind * 0.15;
          crate.y += crate.vy;

          if (this.terrain.isSolid(crate.x, crate.y + 10) || crate.y >= this.terrain.data.waterLevel - 15) {
            crate.isLanded = true;
            crate.vy = 0;
          }
        }

        let collected = false;
        // Check if collected by any living slug
        for (const s of this.state.slugs) {
          if (s.isAlive && Math.hypot(s.x - crate.x, (s.y - 8) - crate.y) < 20) {
            const oldHp = s.hp;
            s.hp = Math.min(s.maxHp, s.hp + crate.healAmount);
            const gained = s.hp - oldHp;

            this.state.floatingDamages.push({
              id: `heal_${Date.now()}_${Math.random()}`,
              x: s.x,
              y: s.y - 22,
              damage: -gained,
              createdAt: Date.now(),
            });

            sfx.play('airdrop');
            this.addLog(`📦 ${s.name} a ramassé une Caisse de Ravitaillement (+${gained} HP) !`, 'combat');
            collected = true;
            break;
          }
        }

        if (!collected && crate.y < this.terrain.data.waterLevel) {
          remainingCrates.push(crate);
        }
      }
      this.state.supplyCrates = remainingCrates;
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
      activeSlug.isBlowtorching = false;
      activeSlug.ropeState = null;
      activeSlug.currentTargetPoint = undefined;
    }

    // Ensure all 0 HP slugs are marked as dead & reset charging power
    for (const slug of this.state.slugs) {
      slug.isChargingPower = false;
      slug.aimPower = 5;
      slug.movingDir = null;
      slug.vx = 0;
      if (slug.hp <= 0) {
        slug.hp = 0;
        slug.isAlive = false;
      }
    }

    this.checkWinner();
    if (this.state.phase === 'GAME_OVER') return;

    const aliveTeams = this.state.teams.filter((t) =>
      this.state.slugs.some((s) => s.teamId === t.id && s.isAlive && s.hp > 0)
    );
    if (aliveTeams.length <= 1) {
      this.checkWinner();
      return;
    }

    const currentIdx = aliveTeams.findIndex((t) => t.id === this.state.activeTeamId);
    const nextTeam = aliveTeams[(currentIdx + 1) % aliveTeams.length];
    this.state.activeTeamId = nextTeam.id;

    const nextSlugId = this.getNextSlugForTeam(nextTeam.id);
    if (!nextSlugId) {
      const fallbackSlug = this.state.slugs.find((s) => s.isAlive && s.hp > 0 && s.isPlaced);
      if (fallbackSlug) {
        this.state.activeTeamId = fallbackSlug.teamId;
        this.state.activeSlugId = fallbackSlug.id;
      } else {
        this.checkWinner();
        return;
      }
    } else {
      this.state.activeSlugId = nextSlugId;
    }

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

  public isWorldAtRest(): boolean {
    // 1. Any active flying projectiles?
    if (this.state.projectiles && this.state.projectiles.length > 0) return false;

    // 2. Any triggered mines counting down?
    if (
      this.state.mines &&
      this.state.mines.some((m) => m.isTriggered && m.fuseTimerMs !== undefined && m.fuseTimerMs > 0)
    ) {
      return false;
    }

    // 3. Any unlanded supply crates falling?
    if (this.state.supplyCrates && this.state.supplyCrates.some((c) => !c.isLanded)) return false;

    // 4. Any slugs flying / bouncing / falling in the air?
    for (const slug of this.state.slugs) {
      if (!slug.isAlive || slug.isPlaced === false || slug.inVehicleId) continue;
      if (Math.abs(slug.vx) > 0.25 || Math.abs(slug.vy) > 0.25) return false;
      if (!isSlugGrounded(slug, this.terrain, this.state.slugs)) return false;
    }

    return true;
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
