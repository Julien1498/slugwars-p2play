import { Vector2D, GameState } from '../../../core/types';
import { DevCursorTool } from '../../../hooks/useDevMode';

export function executeDevCursorAction(
  tool: DevCursorTool,
  pos: Vector2D,
  gameState: GameState,
  engine: any,
  onDevAction?: (devMethod: string, devArgs?: any[]) => void
): void {
  if (!engine && !onDevAction) return;

  switch (tool) {
    case 'teleport_slug':
      if (gameState.activeSlugId) {
        if (onDevAction) onDevAction('devTeleportSlug', [gameState.activeSlugId, pos.x, pos.y]);
        else engine?.devTeleportSlug?.(gameState.activeSlugId, pos.x, pos.y);
      }
      break;
    case 'spawn_crate_weapon':
      if (onDevAction) onDevAction('devSpawnCrate', [pos.x, pos.y, 'weapon']);
      else engine?.devSpawnCrate?.(pos.x, pos.y, 'weapon');
      break;
    case 'spawn_crate_health':
      if (onDevAction) onDevAction('devSpawnCrate', [pos.x, pos.y, 'health']);
      else engine?.devSpawnCrate?.(pos.x, pos.y, 'health');
      break;
    case 'spawn_crate_utility':
      if (onDevAction) onDevAction('devSpawnCrate', [pos.x, pos.y, 'utility']);
      else engine?.devSpawnCrate?.(pos.x, pos.y, 'utility');
      break;
    case 'spawn_mine':
      if (onDevAction) onDevAction('devSpawnMine', [pos.x, pos.y]);
      else engine?.devSpawnMine?.(pos.x, pos.y);
      break;
    case 'spawn_drum':
      if (onDevAction) onDevAction('devSpawnOilDrum', [pos.x, pos.y]);
      else engine?.devSpawnOilDrum?.(pos.x, pos.y);
      break;
    case 'spawn_heli':
      if (onDevAction) onDevAction('devSpawnHelicopter', [pos.x, pos.y]);
      else engine?.devSpawnHelicopter?.(pos.x, pos.y);
      break;
  }
}
