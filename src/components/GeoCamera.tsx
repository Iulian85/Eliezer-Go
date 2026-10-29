import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Quaternion, Vector3 } from 'three';
import { Coordinate, initialCameraAlignment, toWorldPosition } from '../utils/arSpatial';

export function GeoCamera({ origin, user, orientation, initialFocus, orientationReady }: {
  origin: Coordinate; user: Coordinate; orientation: Quaternion;
  initialFocus?: [number, number, number]; orientationReady?: boolean;
}) {
  const initialized = useRef(false);
  const target = useRef(new Vector3());
  const alignment = useRef(new Quaternion());
  const viewOrientation = useRef(new Quaternion());
  const alignedToSensor = useRef(false);
  useFrame(({ camera }, delta) => {
    target.current.set(...toWorldPosition(user, origin, 1.6));
    if (!initialized.current) {
      if (initialFocus && orientationReady) {
        alignment.current.copy(initialCameraAlignment(target.current, new Vector3(...initialFocus), orientation));
        alignedToSensor.current = true;
      }
      camera.position.copy(target.current);
      camera.quaternion.copy(alignment.current).multiply(orientation);
      initialized.current = true;
    } else {
      if (orientationReady && !alignedToSensor.current && initialFocus) {
        alignment.current.copy(initialCameraAlignment(target.current, new Vector3(...initialFocus), orientation));
        alignedToSensor.current = true;
      }
      camera.position.lerp(target.current, 1 - Math.exp(-delta * 2));
      viewOrientation.current.copy(alignment.current).multiply(orientation);
      camera.quaternion.slerp(viewOrientation.current, 1 - Math.exp(-delta * 10));
    }
    camera.updateMatrixWorld();
  });
  return null;
}
