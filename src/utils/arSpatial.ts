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
