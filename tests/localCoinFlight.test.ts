import test from 'node:test';
import assert from 'node:assert/strict';
import { localCoinFlight, createCoinFlightPath } from '../src/utils/localCoinFlight';

test('camera loading does not consume the flight or cause an immediate escape', () => {
  const flight = { startedAt: NaN, path: createCoinFlightPath(() => .5) };
  assert.equal(localCoinFlight(flight, 300000).escaped, false);
  assert.equal(localCoinFlight(flight, 300000).position[1], flight.path.start[1] - 1.6);
  flight.startedAt = 300000;
  assert.equal(localCoinFlight(flight, 301000).escaped, false);
});

test('earlier deployed drift uses 0.6–1.1 m/s without frame-rate accumulation', () => {
  const start = 1000;
  const path = createCoinFlightPath(() => .5);
  assert.deepEqual(path.start, [0, 1.3, -7]);
  const flight = { startedAt: start, path };
  const first = localCoinFlight(flight, start, 0);
  const after = localCoinFlight(flight, start + 6000, 0);
  assert.ok(Math.abs(after.position[0] - first.position[0] + .85 * 6) < 1e-10);
  // Extra renders, GPS fixes or orientation events cannot accumulate flight movement.
  for (let i = 0; i < 100; i++) localCoinFlight(flight, start + i * 50);
  assert.deepEqual(localCoinFlight(flight, start + 6000, 0), after);
});

test('drift starts visible and ends at the nine metre boundary without looping', () => {
  const start = 1000;
  const flight = { startedAt: start, path: createCoinFlightPath(() => .5) };
  const duration = flight.path.durationSeconds * 1000;
  assert.ok(localCoinFlight(flight, start).distance < 9);
  assert.ok(Math.abs(localCoinFlight(flight, start + duration, 0).distance - 9) < 1e-8);
  assert.equal(localCoinFlight(flight, start + duration - 1).escaped, false);
  assert.equal(localCoinFlight(flight, start + duration).escaped, true);
  assert.deepEqual(localCoinFlight(flight, start + duration * 2, 0), localCoinFlight(flight, start + duration, 0));
});
