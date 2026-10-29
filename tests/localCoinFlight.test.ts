import test from 'node:test';
import assert from 'node:assert/strict';
import { localCoinFlight, FLIGHT_DURATION } from '../src/utils/localCoinFlight';

test('local flight is straight, slow and depends only on elapsed time', () => {
  const start = 1000;
  const first = localCoinFlight(start, start);
  const after = localCoinFlight(start, start + 10000);
  assert.equal(after.position[2] - first.position[2], 1.5);
  assert.equal(after.position[1], first.position[1]);
  assert.equal(after.position[0], first.position[0]);
  // Extra renders, GPS fixes or orientation events cannot accumulate flight movement.
  for (let i = 0; i < 100; i++) localCoinFlight(start, start + i * 50);
  assert.deepEqual(localCoinFlight(start, start + 10000), after);
});

test('flight passes within two metres once and escapes without looping', () => {
  const start = 1000;
  assert.ok(localCoinFlight(start, start).distance > 2);
  assert.ok(localCoinFlight(start, start + FLIGHT_DURATION / 2).distance < 2);
  assert.equal(localCoinFlight(start, start + FLIGHT_DURATION - 1).escaped, false);
  assert.equal(localCoinFlight(start, start + FLIGHT_DURATION).escaped, true);
  assert.deepEqual(localCoinFlight(start, start + FLIGHT_DURATION * 2), localCoinFlight(start, start + FLIGHT_DURATION));
});
