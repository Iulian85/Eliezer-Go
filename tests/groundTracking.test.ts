import test from 'node:test';
import assert from 'node:assert/strict';
import { Quaternion, Vector3, PerspectiveCamera } from 'three';
import { GroundTrackingGate, fixedGroundPosition, COIN_CENTER_HEIGHT, COIN_VISUAL_SCALE } from '../src/utils/groundTracking';
import { telegramOrientationQuaternion } from '../src/utils/telegramOrientation';

const frame = { position: { x: 0, y: 1.6, z: 0 }, rotation: { x: 0, y: 0, z: 0, w: 1 },
  intrinsics: new PerspectiveCamera(65, 1, .05, 200).projectionMatrix.elements, trackingStatus: 'NORMAL' };

test('ground tracking requires scale initialization, translation, and a plausible floor height', () => {
  const gate = new GroundTrackingGate();
  assert.equal(gate.update(frame, 0), false, 'NORMAL alone does not establish absolute scale');
  assert.equal(gate.update({ ...frame, trackingReason: 'INITIALIZING' }, 0), false);
  assert.equal(gate.update(frame, 100), false);
  assert.equal(gate.update(frame, 899), false);
  assert.equal(gate.update(frame, 900), false, 'rotation-only/static camera must not enable the coin');
  const translated = { ...frame, position: { x: 0, y: 1.4, z: .3 } };
  assert.equal(gate.update({ ...translated, position: { ...translated.position, y: 0 } }, 1000), false);
  assert.equal(gate.update(translated, 1100), true);
  assert.equal(gate.update({ ...frame, trackingStatus: 'LIMITED' }, 1000), false);
  assert.equal(gate.needsRestart, true);
  assert.equal(gate.update(frame, 1500), false);
  assert.equal(gate.update(translated, 2300), false, 'a recovered map cannot silently reposition a locked coin');
  assert.equal(gate.update({ ...frame, position: { x: NaN, y: 0, z: 0 } }, 2400), false);
});

test('initialization received via pipeline event also gates the frame stream', () => {
  const gate = new GroundTrackingGate();
  gate.observeStatus('LIMITED', 'INITIALIZING');
  assert.equal(gate.update(frame, 0), false);
  assert.equal(gate.update({ ...frame, position: { x: .4, y: 1.6, z: 0 } }, 900), true);
  gate.observeStatus('LIMITED');
  assert.equal(gate.update(frame, 1000), false);
});

test('fixed ground coin stays at chest height as tracked camera walks back and lowers', () => {
  const user = { latitude: 48.42, longitude: 10.87 };
  const coin = { ...user, latitude: user.latitude + 5 / 6371000 * 180 / Math.PI };
  const anchor = fixedGroundPosition({ user, coin, facing: new Quaternion() });
  assert.equal(anchor[1], 1.3);
  assert.ok(Math.abs(COIN_CENTER_HEIGHT - 2.5 * COIN_VISUAL_SCALE) < 1e-10, 'pedestal must be on ground');
  const camera = new PerspectiveCamera(65, 1, .05, 200);
  camera.position.set(0, 1.6, 0); camera.updateMatrixWorld();
  const edge = new Vector3(anchor[0] + .5, anchor[1], anchor[2]);
  const near = edge.clone().project(camera);
  camera.position.set(0, .8, 5); camera.updateMatrixWorld();
  const far = edge.clone().project(camera);
  assert.ok(Math.abs(near.x / far.x - 2) < .0001);
  assert.ok(far.y > near.y, 'lowering phone changes perspective instead of raising the ground');
  assert.deepEqual(anchor, fixedGroundPosition({ user, coin, facing: new Quaternion() }));
});

test('Telegram radians map to the rear camera and relative north is rejected', () => {
  const q = telegramOrientationQuaternion({ absolute: true, alpha: 0, beta: Math.PI / 2, gamma: 0 }, 0)!;
  const forward = new Vector3(0, 0, -1).applyQuaternion(q);
  assert.ok(forward.distanceTo(new Vector3(0, 0, -1)) < .00001);
  assert.equal(telegramOrientationQuaternion({ absolute: false, alpha: 0, beta: 0, gamma: 0 }, 0), null);
});
