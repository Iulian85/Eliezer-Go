import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Quaternion, Vector3, Euler } from 'three';
import { createCoinFlightPath, localCoinFlight } from '../src/utils/localCoinFlight';
import { initialFlightRotation } from '../src/utils/flightView';

test('coin begins in view and maintains chest height regardless of route direction', () => {
  for (let i = 0; i < 16; i++) {
    let calls = 0;
    const path = createCoinFlightPath(() => calls++ === 0 ? i / 16 : .5);
    const camera = new PerspectiveCamera(75, 9 / 19, .1, 1000);
    camera.quaternion.setFromEuler(new Euler(.2, 1.1, -.1));
    camera.updateMatrixWorld();
    const rotation = initialFlightRotation(path, camera.quaternion);
    for (const progress of [0, .5, 1]) {
      const state = localCoinFlight({ startedAt: 0, path }, progress * path.durationSeconds * 1000, 0);
      const world = new Vector3(...state.position).applyQuaternion(rotation);
      const screen = world.clone().project(camera);
      if (progress === 0) assert.ok(Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && screen.z < 1);
      assert.ok(Math.abs(world.y + .3) < 1e-8, 'path must remain at chest height');
      assert.ok(Math.abs(world.length() - state.distance) < 1e-8);
    }
    const captured = rotation.clone();
    camera.quaternion.copy(new Quaternion());
    assert.deepEqual(rotation, captured, 'phone turns must not redirect the trajectory');
  }
});

test('looking steeply up or down cannot tilt the flight toward the ceiling', () => {
  const path = createCoinFlightPath(() => .5);
  for (const pitch of [-1.4, -.8, .8, 1.4]) {
    const rotation = initialFlightRotation(path, new Quaternion().setFromEuler(new Euler(pitch, 1, .4)));
    for (const progress of [0, .5, 1]) {
      const state = localCoinFlight({ startedAt: 0, path }, progress * path.durationSeconds * 1000, 0);
      assert.ok(Math.abs(new Vector3(...state.position).applyQuaternion(rotation).y + .3) < 1e-8);
    }
  }
});
