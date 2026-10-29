import { Quaternion, Vector3 } from 'three';
import { CoinFlightPath } from './localCoinFlight';

// Orient the incoming path once toward the initial view, never follow subsequent phone turns.
export function initialFlightRotation(path: CoinFlightPath, cameraOrientation: Quaternion) {
  const incoming = new Vector3(path.start[0], 0, path.start[2]).normalize();
  const alignment = new Quaternion().setFromUnitVectors(incoming, new Vector3(0, 0, -1));
  return cameraOrientation.clone().multiply(alignment);
}
