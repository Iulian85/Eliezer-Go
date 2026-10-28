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
  private sawInitialization = false;
  private baseline: TrackedReality['position'] | null = null;
  private moved = false;
  private locked = false;
  private invalidated = false;
  get needsRestart() { return this.invalidated; }
  observeStatus(status: string, reason?: string) {
    if (reason === 'INITIALIZING') this.sawInitialization = true;
    if (this.locked && (status !== 'NORMAL' || reason === 'INITIALIZING')) this.invalidated = true;
  }
  update(frame: TrackedReality | null, now: number): boolean {
    const values = frame ? [frame.position?.x, frame.position?.y, frame.position?.z,
      frame.rotation?.x, frame.rotation?.y, frame.rotation?.z, frame.rotation?.w, ...(frame.intrinsics ?? [])] : [];
    if (frame) this.observeStatus(frame.trackingStatus, frame.trackingReason);
    if (!frame || frame.trackingStatus !== 'NORMAL' || frame.trackingReason === 'INITIALIZING' ||
      frame.intrinsics?.length !== 16 || values.some(value => !Number.isFinite(value))) {
      // A recovered/rebuilt map may use a different origin. Never silently move the anchor.
      if (this.locked) this.invalidated = true;
      this.baseline = null; this.moved = false;
      this.normalSince = null; return false;
    }
    if (this.invalidated || !this.sawInitialization) return false;
    if (this.normalSince === null) this.normalSince = now;
    if (!this.baseline) this.baseline = { ...frame.position };
    if (Math.hypot(frame.position.x - this.baseline.x, frame.position.z - this.baseline.z) >= .25) this.moved = true;
    // Absolute scale defines the floor at y=0. Reject poses that still place the
    // camera at the origin, and require measured translation (not rotation alone).
    const ready = now - this.normalSince >= 800 && this.moved && frame.position.y > .3 && frame.position.y < 2.5;
    if (ready) this.locked = true;
    return ready;
  }
}
