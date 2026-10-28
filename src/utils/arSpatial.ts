import { Euler, MathUtils, Quaternion, Vector3 } from 'three';

export interface Coordinate { latitude: number; longitude: number }

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
  update(fix: VisualFix): VisualFix | null {
    if (![fix.latitude, fix.longitude, fix.accuracy, fix.timestamp].every(Number.isFinite) ||
        fix.accuracy <= 0 || fix.accuracy > 25 || Math.abs(fix.latitude) > 90 || Math.abs(fix.longitude) > 180) return this.current;
    const previous = this.current;
    if (!previous) return (this.current = { ...fix });
    if (fix.timestamp <= previous.timestamp) return previous;
    if (fix.timestamp - previous.timestamp > 15000) return (this.current = { ...fix });
    const [east, , north] = toWorldPosition(fix, previous);
    const distance = Math.hypot(east, north);
    const deadband = Math.min(1.2, Math.max(.35, fix.accuracy * .12));
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
