import test from 'node:test';
import assert from 'node:assert/strict';
import { movingCoinPosition, validCoinMotion, gameTime, synchronizeGameClock } from '../src/utils/coinMotion';
import { getDistanceMeters } from '../src/utils/geo';
const route = { originLatitude: 48.42, originLongitude: 10.87, startsAt: 10000, endsAt: 2010000, heading: 90, speed: 1.5 };
test('coin follows the shared route for 3 km without player input or frame integration', () => {
  const start = movingCoinPosition(route, 10000);
  const after = movingCoinPosition(route, 20000);
  assert.equal(getDistanceMeters(start.latitude, start.longitude, after.latitude, after.longitude), 15);
  assert.deepEqual(after, movingCoinPosition(JSON.parse(JSON.stringify(route)), 20000), 'reloading must preserve position');
  const end = movingCoinPosition(route, route.endsAt);
  assert.equal(getDistanceMeters(start.latitude, start.longitude, end.latitude, end.longitude), 3000);
  assert.deepEqual(end, movingCoinPosition(route, route.endsAt + 100000));
  assert.deepEqual(start, movingCoinPosition(route, 0));
});
test('moving coin leaves a stationary hunter collection radius', () => {
  const point = movingCoinPosition(route, route.startsAt + 4000);
  assert.ok(getDistanceMeters(route.originLatitude, route.originLongitude, point.latitude, point.longitude) > 5);
});
test('route validation and server clock reject malformed motion and compensate device clock', () => {
  assert.equal(validCoinMotion(route), true);
  assert.equal(validCoinMotion({ ...route, speed: NaN }), false);
  const now = Date.now(); synchronizeGameClock(now + 60000, now, now);
  assert.ok(Math.abs(gameTime() - Date.now() - 60000) < 5);
  synchronizeGameClock(now, now, now);
});
