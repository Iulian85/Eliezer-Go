import { useFrame } from '@react-three/fiber';
import { Quaternion } from 'three';
import { Coordinate, toWorldPosition } from '../utils/arSpatial';

export function GeoCamera({ origin, user, orientation }: {
  origin: Coordinate; user: Coordinate; orientation: Quaternion;
}) {
  useFrame(({ camera }) => {
    camera.position.set(...toWorldPosition(user, origin, 1.6));
    camera.quaternion.copy(orientation);
    camera.updateMatrixWorld();
  });
  return null;
}
