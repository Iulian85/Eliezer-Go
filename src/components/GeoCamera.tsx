import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import { Coordinate, toWorldPosition } from '../utils/arSpatial';

export function GeoCamera({ origin, user, orientation }: {
  origin: Coordinate; user: Coordinate; orientation: Quaternion;
}) {
  const initialized = useRef(false);
  const target = useRef(new Vector3());
  useFrame(({ camera }, delta) => {
    target.current.set(...toWorldPosition(user, origin, 1.6));
    if (!initialized.current) {
      camera.position.copy(target.current);
      camera.quaternion.copy(orientation);
      initialized.current = true;
    } else {
      camera.position.lerp(target.current, 1 - Math.exp(-delta * 2));
      camera.quaternion.slerp(orientation, 1 - Math.exp(-delta * 10));
    }
    camera.updateMatrixWorld();
  });
  return null;
}
