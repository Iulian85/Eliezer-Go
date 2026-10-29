import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Vector3 } from 'three';
import { deviceCameraQuaternion, initialCameraAlignment } from '../src/utils/arSpatial';

test('five-metre calibration coin starts inside the portrait camera for any initial heading or tilt', () => {
  for (const alpha of [0, 90, 180, 270]) {
    for (const beta of [10, 60, 90, 160]) {
      const camera = new PerspectiveCamera(75, 393 / 852, .1, 1000);
      camera.position.set(0, 1.6, 0);
      const coin = new Vector3(5, 1.3, 0);
      const sensor = deviceCameraQuaternion(alpha, beta, 0, 0);
      const alignment = initialCameraAlignment(camera.position, coin, sensor);
      camera.quaternion.copy(alignment).multiply(sensor);
      camera.updateMatrixWorld();
      const projected = coin.clone().project(camera);
      assert.ok(Math.abs(projected.x) < .001 && Math.abs(projected.y) < .001);
      assert.ok(projected.z > -1 && projected.z < 1);
    }
  }
});

test('calibration stays constant when turning and walking; the coin is not screen-locked', () => {
  const camera = new PerspectiveCamera(75, 393 / 852, .1, 1000);
  camera.position.set(0, 1.6, 0);
  const coin = new Vector3(0, 1.3, -5);
  const savedPosition = coin.clone();
  const firstSensor = deviceCameraQuaternion(0, 90, 0, 0);
  const alignment = initialCameraAlignment(camera.position, coin, firstSensor);
  camera.quaternion.copy(alignment).multiply(deviceCameraQuaternion(90, 90, 0, 0));
  camera.updateMatrixWorld();
  assert.ok(Math.abs(coin.clone().project(camera).x) > 1);
  camera.quaternion.copy(alignment).multiply(firstSensor);
  camera.position.z = 5;
  camera.updateMatrixWorld();
  assert.ok(camera.position.distanceTo(coin) > 10);
  assert.deepEqual(coin, savedPosition);
});
