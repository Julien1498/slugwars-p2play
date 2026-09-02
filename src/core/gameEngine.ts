import { GameState, GameConfig, Vector2D, JournalEntry, SolidProp, Slug, MAP_SIZE_CONFIGS } from './types';
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
} from './engine/vehicleManager';
import { PhaseManager } from './engine/phaseManager';
import {
  startMove,
  stopMove,
  moveSlug,
  jumpSlug,
  stopJump,
  startCharge,
  releaseCharge,
  startSteer,
  stopSteer,
  steerSheep,
  detonateSheep,
} from './engine/engineControls';
import {
  setupGameStart,
  handlePlaceSlug,
  handleCarveCrater,
} from './engine/engineLifecycle';
import { executeEngineTick } from './engine/engineTick';
import * as devCtrl from './engine/devControls';

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
    if (partial.mapSeed !== undefined || partial.mapTheme !== undefined || partial.mapSize !== undefined) {
      const sizeCfg = MAP_SIZE_CONFIGS[this.state.config.mapSize || 'NORMAL'] || MAP_SIZE_CONFIGS.NORMAL;
      this.state.waterLevel = sizeCfg.height - 80;
      if (this.terrain?.data) {
        this.terrain.data.theme = this.state.config.mapTheme;
        this.terrain.data.seed = this.state.config.mapSeed;
        this.terrain.data.width = sizeCfg.width;
        this.terrain.data.height = sizeCfg.height;
        this.terrain.data.waterLevel = this.state.waterLevel;
      }
    }
    return true;
  }

  public addTeam(id: string, name: string, color: string, avatar: string, isHost: boolean, hat?: string): void {
    registerTeam(this.state, id, name, color, avatar, isHost, this.terrain, hat);
  }

  public setTeamHat(teamId: string, hatId: string): void {
    const team = this.state.teams.find((t) => t.id === teamId);
    if (team) {
      team.hat = hatId;
    }
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
      () => this.terrain,
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

  public stopJump(): void {
    stopJump(this.state);
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
    executeEngineTick(this.state, this.terrain, {
      addLog: (msg, type) => this.addLog(msg, type),
      carveCrater: (x, y, r) => this.carveCrater(x, y, r),
      moveSlug: (dir) => this.moveSlug(dir),
      fireWeapon: (tp) => this.fireWeapon(tp),
      steerSheep: (dir) => this.steerSheep(dir),
      endTurn: () => this.endTurn(),
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

  public devSetInfiniteAmmo(): void { devCtrl.devSetInfiniteAmmo(this.state); }
  public devUnlockAllWeapons(): void { devCtrl.devUnlockAllWeapons(this.state); }
  public devHealAll(hp?: number): void { devCtrl.devHealAll(this.state, hp); }
  public devSetOneHp(): void { devCtrl.devSetOneHp(this.state); }
  public devKillSlug(slugId: string): void { devCtrl.devKillSlug(this.state, slugId); }
  public devTeleportSlug(slugId: string, x: number, y: number): void { devCtrl.devTeleportSlug(this.state, slugId, x, y); }
  public devSpawnCrate(x: number, y: number, type?: 'health' | 'weapon' | 'utility') { return devCtrl.devSpawnCrate(this.state, x, y, type); }
  public devSpawnMine(x: number, y: number) { return devCtrl.devSpawnMine(this.state, x, y); }
  public devSpawnOilDrum(x: number, y: number) { return devCtrl.devSpawnOilDrum(this.state, this.terrain, x, y); }
  public devSpawnHelicopter(x: number, y: number) { return devCtrl.devSpawnHelicopter(this.state, x, y); }
  public devSetWind(wind: number): void { devCtrl.devSetWind(this.state, wind); }
  public devRiseWater(amountPx?: number): void { devCtrl.devRiseWater(this.state, this.terrain, amountPx); }
  public devLowerWater(amountPx?: number): void { devCtrl.devLowerWater(this.state, this.terrain, amountPx); }
  public devTriggerArmageddon(): void { devCtrl.devTriggerArmageddon(this.state, this.terrain, (m, t) => this.addLog(m, t)); }
  public devForceWin(teamId?: string): void { devCtrl.devForceWin(this.state, teamId, (m, t) => this.addLog(m, t)); }
  public devAutoPlaceAllSlugs(): void { devCtrl.devAutoPlaceAllSlugs(this.state, this.terrain, (m, t) => this.addLog(m, t)); }
  public devDigTerrain(x: number, y: number, radius?: number): void { devCtrl.devDigTerrain(this.state, this.terrain, x, y, radius); }
  public devBuildTerrain(x: number, y: number, radius?: number): void { devCtrl.devBuildTerrain(this.state, this.terrain, x, y, radius); }
  public devToggleFreezeTimer(): boolean { return devCtrl.devToggleFreezeTimer(this.state); }
  public devToggleGodMode(): boolean { return devCtrl.devToggleGodMode(this.state); }
}
