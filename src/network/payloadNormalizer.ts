import { GameState } from '../core/types';
import { CompactStateDelta } from './serializer/netSerializerTypes';
import { decodeBinaryDelta } from './netBinarySerializer';

/**
 * Universal Network Payload Normalizer:
 * Safely extracts a full GameState regardless of whether the transport
 * passed it direct, wrapped in `{ type: 'STATE_UPDATE', state }`, or `{ state }`.
 */
export function unwrapGameState(rawPayload: any): GameState | null {
  if (!rawPayload) return null;

  if (rawPayload.state && rawPayload.state.config) {
    return rawPayload.state as GameState;
  }
  if (rawPayload.config) {
    return rawPayload as GameState;
  }
  return null;
}

/**
 * Universal Network Delta Normalizer:
 * Extracts compact JSON delta or decodes binary ArrayBuffer deltas safely.
 */
export function unwrapDeltaState(rawPayload: any): CompactStateDelta | null {
  if (!rawPayload) return null;

  if (rawPayload instanceof ArrayBuffer || ArrayBuffer.isView(rawPayload)) {
    try {
      return decodeBinaryDelta(rawPayload);
    } catch (err: unknown) {
      console.warn('Binary decode error:', err instanceof Error ? err.message : String(err));
      return null;
    }
  }

  if (rawPayload.isDelta && rawPayload.delta) {
    return rawPayload.delta as CompactStateDelta;
  }
  if (rawPayload.delta) {
    return rawPayload.delta as CompactStateDelta;
  }

  return null;
}
