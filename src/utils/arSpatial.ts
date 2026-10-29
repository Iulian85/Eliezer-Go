import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from 'three';

export interface Coordinate { latitude: number; longitude: number }

// One-time view calibration. Keep this offset for the session: recomputing it
// each frame would lock the coin to the screen instead of allowing the user to turn.
export function initialCameraAlignment(position: Vector3, focus: Vector3, orientation: Quaternion): Quaternion {
  const facing = new Quaternion().setFromRotationMatrix(
    new Matrix4().lookAt(position, focus, new Vector3(0, 1, 0)),
  );
  return facing.multiply(orientation.clone().invert());
}

// Local tangent plane: X east, Y up, -Z north. One scene unit = one metre.
export function toWorldPosition(point: Coordinate, origin: Coordinate, height = 0): [number, number, number] {
  const radians = Math.PI / 180;
  const longitudeDelta = ((point.longitude - origin.longitude + 540) % 360) - 180;
  return [
    longitudeDelta * radians * 6371000 * Math.cos(origin.latitude * radians),
    height,
    -(point.latitude - origin.latitude) * radians * 6371000,
  ];
}

export function deviceCameraQuaternion(alpha: number, beta: number, gamma: number, screenAngle: number): Quaternion {
  const rad = MathUtils.degToRad;
  return new Quaternion()
    .setFromEuler(new Euler(rad(beta), rad(alpha), -rad(gamma), 'YXZ'))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2))
    .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -rad(screenAngle)));
}

export interface VisualFix extends Coordinate { accuracy: number; timestamp: number }

// Filter only the rendered observer. Collection checks continue to use raw GPS.
export class VisualPositionFilter {
  private current: VisualFix | null = null;
  private recent: VisualFix[] = [];
  private latestTimestamp = 0;
  update(fix: VisualFix): VisualFix | null {
    if (![fix.latitude, fix.longitude, fix.accuracy, fix.timestamp].every(Number.isFinite) ||
        fix.accuracy <= 0 || fix.accuracy > 25 || Math.abs(fix.latitude) > 90 || Math.abs(fix.longitude) > 180) return this.current;
    const previous = this.current;
    if (fix.timestamp <= this.latestTimestamp) return previous;
    if (!previous || fix.timestamp - this.latestTimestamp > 15000) {
      this.latestTimestamp = fix.timestamp;
      this.recent = [fix, fix];
      return (this.current = { ...fix });
    }
    this.latestTimestamp = fix.timestamp;
    // A single GPS spike must not pull the rendered observer sideways and back.
    if (fix.accuracy > previous.accuracy * 2) return previous;
    this.recent = [...this.recent.slice(-2), fix];
    const median = (values: number[]) => values.sort((a, b) => a - b)[1];
    fix = { ...fix, latitude: median(this.recent.map(p => p.latitude)),
      longitude: median(this.recent.map(p => p.longitude)) };
    const [east, , north] = toWorldPosition(fix, previous);
    const distance = Math.hypot(east, north);
    const deadband = Math.min(2.5, Math.max(.5, fix.accuracy * .4));
    // Reject a sudden loss of accuracy instead of teleporting the camera.
    if (fix.accuracy > previous.accuracy * 2 && distance > deadband) return previous;
    const weight = distance <= deadband ? 0 : Math.min(.7, Math.max(.2, 3 / fix.accuracy));
    this.current = {
      latitude: previous.latitude + (fix.latitude - previous.latitude) * weight,
      longitude: previous.longitude + (fix.longitude - previous.longitude) * weight,
      accuracy: fix.accuracy, timestamp: fix.timestamp,
    };
    return this.current;
  }
}
