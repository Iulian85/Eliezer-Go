import { Quaternion, Vector3 } from 'three';
import { CoinFlightPath } from './localCoinFlight';

// Orient the incoming path once toward the initial view, never follow subsequent phone turns.
export function initialFlightRotation(path: CoinFlightPath, cameraOrientation: Quaternion) {
  const incoming = new Vector3(path.start[0], 0, path.start[2]).normalize();
  const alignment = new Quaternion().setFromUnitVectors(incoming, new Vector3(0, 0, -1));
  // Pitch/roll must never turn a horizontal flight into an upward flight.
  const forward = new Vector3(0, 0, -1).applyQuaternion(cameraOrientation);
  forward.y = 0;
  if (forward.lengthSq() < .0001) forward.set(0, 0, -1);
  forward.normalize();
  return new Quaternion().setFromUnitVectors(new Vector3(0, 0, -1), forward).multiply(alignment);
}
