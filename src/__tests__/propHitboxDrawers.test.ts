import { describe, it, expect, vi } from 'vitest';
import { SOLID_PROP_HITBOX_DRAWERS } from '../rendering/props/propHitboxDrawers';
import { SolidProp } from '../core/types';

describe('SOLID_PROP_HITBOX_DRAWERS', () => {
  const propTypes: SolidProp['type'][] = [
    'tree',
    'mushroom',
    'flower',
    'cactus',
    'bunker',
    'totem',
    'oil_drum',
    'crystal',
    'lamppost',
    'hedgehog',
    'chick',
  ];

  it('provides a dedicated hitbox drawer for all 11 prop types', () => {
    for (const type of propTypes) {
      expect(typeof SOLID_PROP_HITBOX_DRAWERS[type]).toBe('function');
    }
  });

  it.each(propTypes)('executes hitbox drawing safely for %s', (type) => {
    const mockCtx = {
      strokeStyle: '',
      lineWidth: 0,
      strokeRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      ellipse: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D;

    const drawer = SOLID_PROP_HITBOX_DRAWERS[type];
    expect(() => drawer(mockCtx)).not.toThrow();
  });
});
