import { Quaternion } from 'three';
import { Coordinate, toWorldPosition } from './arSpatial';
import { TrackedReality } from './trackingEngine';

export const COIN_CENTER_HEIGHT = 1.3;
export const COIN_VISUAL_SCALE = .52;
export interface GroundAlignment {
  user: Coordinate; coin: Coordinate; facing: Quaternion;
}
export function fixedGroundPosition(alignment: GroundAlignment): [number, number, number] {
  return toWorldPosition(alignment.coin, alignment.user, COIN_CENTER_HEIGHT);
}
export class GroundTrackingGate {
  private normalSince: number | null = null;
  update(frame: TrackedReality | null, now: number): boolean {
    const values = frame ? [frame.position?.x, frame.position?.y, frame.position?.z,
      frame.rotation?.x, frame.rotation?.y, frame.rotation?.z, frame.rotation?.w, ...(frame.intrinsics ?? [])] : [];
    if (!frame || frame.trackingStatus !== 'NORMAL' || frame.trackingReason === 'INITIALIZING' ||
      frame.intrinsics?.length !== 16 || values.some(value => !Number.isFinite(value))) {
      this.normalSince = null; return false;
    }
    if (this.normalSince === null) this.normalSince = now;
    return now - this.normalSince >= 800;
  }
}
