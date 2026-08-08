import { GameState, GameConfig, Team, Slug, Vector2D, JournalEntry, Landmine, Particle, HelicopterVehicle } from './types';
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
    this.state.config.mapSeed = Math.floor(Math.random() * 1000000);
    this.initTerrain();
    this.state.slugs = [];
    this.teamLastSlugIndex = {};

    // 1. Reset Inventory Ammo for all Teams!
    const weaponSet = getWeaponSet(this.state.config.weaponSetId);
    for (const team of this.state.teams) {
      team.inventory = { ...weaponSet.inventory };
      this.teamLastSlugIndex[team.id] = -1;
    }

    // 2. Clear all transient visual effects & active entities!
    this.state.explosions = [];
    this.state.particles = [];
    this.state.projectiles = [];
    this.state.floatingDamages = [];
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
      heli.vy = -4.8;
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

    applyExplosionToSlugs(sheep.x, sheep.y, weapon.radius, weapon.damage, this.state.slugs, this.terrain);
    this.endTurn();
    return true;
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
      this.endTurn();
      return true;
    }

    if (weapon.behavior === 'BLOWTORCH') {
      const currentFuel = activeTeam ? activeTeam.inventory['blowtorch'] ?? 0 : 0;
      if (currentFuel <= 0) {
        this.addLog(`Le réservoir du Chalumeau est vide ! ⛽`, 'info');
        return false;
      }
      activeSlug.isBlowtorching = true;
      this.state.phase = 'AIMING';
      sfx.play('fire');
      this.addLog(`${activeSlug.name} utilise le Chalumeau ! (Carburant: ${Math.round(currentFuel)}%) 🔥`, 'weapon');
      return true;
    }

    if (weapon.behavior === 'MELEE_PUSH') {
      const targetSlug = this.state.slugs.find(
        (s) => s.id !== activeSlug.id && s.isAlive && Math.hypot(s.x - activeSlug.x, s.y - activeSlug.y) < 40
      );
      if (targetSlug) {
        const dir = activeSlug.facing === 'right' ? 1 : -1;
        targetSlug.hp = Math.max(0, targetSlug.hp - weapon.damage);
        if (targetSlug.hp === 0) {
          targetSlug.isAlive = false;
        }
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
            this.endTurn();
          }
        }
      }
    }

    // If active slug dies (e.g. drowns or dies from explosion), end turn immediately!
    if (activeSlug && !activeSlug.isAlive && (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE' || this.state.phase === 'RETREAT')) {
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
          this.fireWeapon(activeSlug.currentTargetPoint);
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
            other.hp = Math.max(0, other.hp - 2);
            other.vx = dirX * 4;
            other.vy = dirY * 4 - 1;
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
          this.addLog(`💥 L'hélicoptère s'est crashé et a explosé !`, 'combat');
          heli.hp = 0;
        }
      }
      this.state.helicopters = this.state.helicopters.filter((h) => h.hp > 0 && h.y < this.terrain.data.waterLevel);
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

          // If the active slug took damage from a mine explosion, immediately end their turn!
          const activeSlugTookDamage = mineExpRes.damageEvents.some(
            (dm) => dm.slugId === this.state.activeSlugId
          );
          if (activeSlugTookDamage && (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE')) {
            const activeSlug = this.state.slugs.find((s) => s.id === this.state.activeSlugId);
            this.addLog(`💥 ${activeSlug?.name || 'La limace'} s'est fait sauter sur une mine ! Fin du tour !`, 'combat');
            this.endTurn();
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
      activeSlug.isBlowtorching = false;
      activeSlug.currentTargetPoint = undefined;
    }

    // Ensure all 0 HP slugs are marked as dead!
    for (const slug of this.state.slugs) {
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
