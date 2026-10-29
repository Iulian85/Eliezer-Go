import test from 'node:test';
import assert from 'node:assert/strict';
import { PerspectiveCamera, Quaternion, Vector3, Euler } from 'three';
import { createCoinFlightPath, localCoinFlight } from '../src/utils/localCoinFlight';
import { initialFlightRotation } from '../src/utils/flightView';

test('incoming coin is in view at nine and two metres for every initial route direction', () => {
  for (let i = 0; i < 16; i++) {
    let calls = 0;
    const path = createCoinFlightPath(() => calls++ === 0 ? i / 16 : .5);
    const camera = new PerspectiveCamera(75, 9 / 19, .1, 1000);
    camera.quaternion.setFromEuler(new Euler(.2, 1.1, -.1));
    camera.updateMatrixWorld();
    const rotation = initialFlightRotation(path, camera.quaternion);
    for (const approachDistance of [9, 2]) {
      const progress = (40 - approachDistance) / 80;
      const state = localCoinFlight({ startedAt: 0, path }, progress * path.durationSeconds * 1000, 0);
      const world = new Vector3(...state.position).applyQuaternion(rotation);
      const screen = world.clone().project(camera);
      assert.ok(Math.abs(screen.x) < 1 && Math.abs(screen.y) < 1 && screen.z < 1);
      assert.ok(Math.abs(world.length() - state.distance) < 1e-8);
    }
    const captured = rotation.clone();
    camera.quaternion.copy(new Quaternion());
    assert.deepEqual(rotation, captured, 'phone turns must not redirect the trajectory');
  }
});
