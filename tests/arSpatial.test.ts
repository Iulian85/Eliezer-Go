import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vector3, PerspectiveCamera } from 'three';
import { toWorldPosition, deviceCameraQuaternion } from '../src/utils/arSpatial';

const origin = { latitude: 48.4284, longitude: 10.8719 };
const coin = { latitude: origin.latitude + 10 / 6371000 * 180 / Math.PI, longitude: origin.longitude };
const close = (a: number, b: number) => assert.ok(Math.abs(a-b) < 0.001, `${a} != ${b}`);

test('coin remains fixed as the user walks away; distance and apparent size change', () => {
  const fixed = toWorldPosition(coin, origin, 1.3);
  close(fixed[2], -10);
  const camera = new PerspectiveCamera(65, 1, 0.05, 500);
  camera.position.set(...toWorldPosition(origin, origin, 1.6));
  camera.quaternion.copy(deviceCameraQuaternion(0, 90, 0, 0));
  camera.updateMatrixWorld();
  const edge = new Vector3(fixed[0] + 0.5, fixed[1], fixed[2]);
  const nearWidth = edge.clone().project(camera).x;
  const user = { ...origin, latitude: origin.latitude - 10 / 6371000 * 180 / Math.PI };
  camera.position.set(...toWorldPosition(user, origin, 1.6));
  camera.updateMatrixWorld();
  const farWidth = edge.clone().project(camera).x;
  close(nearWidth / farWidth, 2);
  assert.deepEqual(toWorldPosition(coin, origin, 1.3), fixed);
});

test('turning east leaves a northern coin to the left, turning south leaves it behind', () => {
  const north = new Vector3(0, 0, -10);
  const eastView = north.clone().applyQuaternion(deviceCameraQuaternion(270, 90, 0, 0).invert());
  close(eastView.x, -10);
  const southView = north.clone().applyQuaternion(deviceCameraQuaternion(180, 90, 0, 0).invert());
  close(southView.z, 10);
});

test('screen orientation correction preserves the rear camera viewing direction', () => {
  const portrait = new Vector3(0, 0, -1).applyQuaternion(deviceCameraQuaternion(0, 90, 0, 0));
  const landscape = new Vector3(0, 0, -1).applyQuaternion(deviceCameraQuaternion(0, 90, 0, 90));
  close(portrait.distanceTo(landscape), 0);
});

test('walking east produces parallax without moving the coin', () => {
  const user = { ...origin, longitude: origin.longitude + 0.0001 };
  const relative = new Vector3(...toWorldPosition(coin, origin)).sub(new Vector3(...toWorldPosition(user, origin)));
  assert.ok(relative.x < 0);
  close(relative.z, -10);
});

import { VisualPositionFilter } from '../src/utils/arSpatial';
import { wanderGeoCoins, GeoCoin } from '../src/utils/geo';

test('stationary GPS noise is held, inaccurate and out-of-order fixes cannot teleport the observer', () => {
  const filter = new VisualPositionFilter();
  const initial = { ...origin, accuracy: 5, timestamp: 1000 };
  filter.update(initial);
  const smallNoise = { ...initial, latitude: origin.latitude + .000002, timestamp: 2000 };
  assert.equal(filter.update(smallNoise)?.latitude, origin.latitude);
  assert.equal(filter.update({ ...initial, latitude: origin.latitude + .001, accuracy: 80, timestamp: 3000 })?.latitude, origin.latitude);
  assert.equal(filter.update({ ...initial, latitude: origin.latitude + .001, timestamp: 500 })?.latitude, origin.latitude);
});

test('sustained walking moves the observer while the address and pedestal stay fixed', () => {
  const filter = new VisualPositionFilter();
  filter.update({ ...origin, accuracy: 3, timestamp: 1000 });
  const destination = { ...origin, latitude: origin.latitude - 10 / 6371000 * 180 / Math.PI };
  let visual = origin;
  for (let i = 2; i < 12; i++) visual = filter.update({ ...destination, accuracy: 3, timestamp: i * 1000 })!;
  assert.ok(Math.abs(toWorldPosition(visual, origin)[2] - 10) < 1);
  const drop = { ...coin, id: 'fixed', collected: false, distance: 10, bearing: 0 } as GeoCoin;
  const updated = wanderGeoCoins([drop], destination.latitude, destination.longitude, 100)[0];
  assert.equal(updated.latitude, drop.latitude);
  assert.equal(updated.longitude, drop.longitude);
  close(updated.distance, 20);
  assert.deepEqual(toWorldPosition(updated, origin, 0), toWorldPosition(drop, origin, 0));
});
