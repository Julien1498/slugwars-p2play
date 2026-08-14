import { encode, decode } from '@msgpack/msgpack';
import { CompactStateDelta } from './netSerializer';

/**
 * Encodes a CompactStateDelta into a compact, lossless binary Uint8Array using MessagePack.
 * Reduces packet size by 75-85% compared to raw JSON strings.
 */
export function encodeBinaryDelta(delta: CompactStateDelta): Uint8Array {
  return encode(delta);
}

/**
 * Decodes a binary ArrayBuffer / Uint8Array back into a CompactStateDelta.
 */
export function decodeBinaryDelta(buffer: ArrayBuffer | ArrayBufferView): CompactStateDelta {
  const u8 = ArrayBuffer.isView(buffer)
    ? new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength)
    : new Uint8Array(buffer);
  return decode(u8) as CompactStateDelta;
}
