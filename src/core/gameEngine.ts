import { GameState, GameConfig, Vector2D, JournalEntry, SolidProp, Slug } from './types';
import { DestructibleTerrain } from './terrain';
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
import {
  startMove,
  stopMove,
  moveSlug,
  jumpSlug,
  startCharge,
  releaseCharge,
  startSteer,
  stopSteer,
  steerSheep,
  detonateSheep,
} from './engine/engineControls';
import {
  updateSlugsPhysicsAndDrowning,
  updateSlugRopeAndCharge,
  updateBlowtorchTick,
} from './engine/engineTickSlugs';
import {
  updateProjectilesInTick,
  cleanupExpiredVFX,
} from './engine/engineTickProjectiles';
import {
  setupGameStart,
  handlePlaceSlug,
  handleCarveCrater,
} from './engine/engineLifecycle';

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
    handleCarveCrater(this.state, this.terrain, x, y, radius, (drum) => this.detonateOilDrum(drum));
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
    return setupGameStart(
      this.state,
      this.terrain,
      this.teamLastPlayedSlugId,
      () => this.initTerrain(),
      (msg, type) => this.addLog(msg, type)
    );
  }

  public restartGame(): void {
    PhaseManager.startLobby(this.state);
    this.addLog('Retour au salon d\'attente.', 'info');
  }

  public enterVehicle(): boolean {
    return enterVehicle(this.state, (msg, type) => this.addLog(msg, type));
  }

  public exitVehicle(): boolean {
    return exitVehicle(this.state, (msg, type) => this.addLog(msg, type), this.terrain);
  }

  public steerVehicle(dir: 'left' | 'right' | 'up' | 'down'): void {
    steerVehicle(this.state, dir);
  }

  public placeSlug(point: Vector2D): boolean {
    return handlePlaceSlug(
      this.state,
      this.terrain,
      point,
      (tId) => this.getNextSlugForTeam(tId),
      () => this.randomizeWind(),
      (msg, type) => this.addLog(msg, type)
    );
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
    startMove(this.state, dir);
  }

  public stopMove(): void {
    stopMove(this.state);
  }

  public startCharge(targetPoint?: Vector2D): void {
    startCharge(this.state, targetPoint, (tp) => this.fireWeapon(tp));
  }

  public releaseCharge(targetPoint?: Vector2D): void {
    releaseCharge(this.state, targetPoint, (tp) => this.fireWeapon(tp));
  }

  public startSteer(dir: 'left' | 'right'): void {
    startSteer(this.state, dir);
  }

  public stopSteer(): void {
    stopSteer(this.state);
  }

  public moveSlug(dir: 'left' | 'right'): boolean {
    return moveSlug(this.state, dir);
  }

  public steerSheep(dir: 'left' | 'right'): boolean {
    return steerSheep(this.state, dir);
  }

  public detonateSheep(): boolean {
    return detonateSheep(this.state, this.terrain, (x, y, r) => this.carveCrater(x, y, r));
  }

  public jumpSlug(): boolean {
    return jumpSlug(this.state, this.terrain);
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

    // 1. Slugs physics & water drowning
    const effectiveWaterY = this.state.waterLevel ?? this.terrain.data.waterLevel;
    updateSlugsPhysicsAndDrowning(
      this.state,
      this.terrain,
      (msg, type) => this.addLog(msg, type),
      effectiveWaterY
    );

    // 2. Active slug death interruption
    if (
      activeSlug &&
      !activeSlug.isAlive &&
      (this.state.phase === 'AIMING' || this.state.phase === 'PROJECTILE_ACTIVE' || this.state.phase === 'RETREAT')
    ) {
      PhaseManager.startResolving(this.state, { settleTimer: 1.2, phaseTimeout: 30.0 });
    }

    // 3. Ninja rope & power charging
    if (
      activeSlug &&
      activeSlug.isAlive &&
      (this.state.phase === 'AIMING' || this.state.phase === 'TURN_TIME' || this.state.phase === 'RETREAT')
    ) {
      updateSlugRopeAndCharge(
        this.state,
        this.terrain,
        activeSlug,
        (dir) => this.moveSlug(dir),
        (tp) => this.fireWeapon(tp),
        (msg, type) => this.addLog(msg, type)
      );
    }

    // 4. Blowtorch tunneling
    if (activeSlug && activeSlug.isAlive && activeSlug.isBlowtorching) {
      updateBlowtorchTick(
        this.state,
        this.terrain,
        activeSlug,
        (x, y, r) => this.carveCrater(x, y, r),
        (msg, type) => this.addLog(msg, type)
      );
    }

    // 5. Super sheep steer
    const activeSheep = this.state.projectiles.find((p) => p.weaponId === 'super_sheep');
    if (activeSheep && activeSlug && activeSlug.steeringDir) {
      this.steerSheep(activeSlug.steeringDir);
    }

    // 6. Helicopter physics
    updateHelicopters(this.state, this.terrain, (msg, type) => this.addLog(msg, type));

    // 7. Active slug took damage during aiming -> interrupt turn immediately
    if (
      activeSlug &&
      activeSlug.isAlive &&
      activeSlug.hp < activeSlugHpBefore &&
      this.state.phase === 'AIMING'
    ) {
      PhaseManager.startResolving(this.state, {
        settleTimer: 1.2,
        phaseTimeout: 30.0,
        reason: `⚡ ${activeSlug.name} a pris des dégâts ! Fin du tour !`,
        addLog: (msg, type) => this.addLog(msg, type),
      });
      return;
    }

    // 8. Projectiles simulation
    updateProjectilesInTick(
      this.state,
      this.terrain,
      (x, y, r) => this.carveCrater(x, y, r),
      (msg, type) => this.addLog(msg, type)
    );

    // 9. Mines & supply drops
    updateMines(
      this.state,
      this.terrain,
      (x, y, r) => this.carveCrater(x, y, r),
      (msg, type) => this.addLog(msg, type)
    );
    updateSupplyCrates(this.state, this.terrain, (msg, type) => this.addLog(msg, type));

    // 10. Expired VFX cleanup
    cleanupExpiredVFX(this.state, Date.now());

    // 11. Phase machine tick
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
