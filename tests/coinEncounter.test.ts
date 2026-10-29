import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coinEncounterReport } from '../src/utils/coinEncounter';
import { toWorldPosition } from '../src/utils/arSpatial';
import { collectionDistance, canCollectAt } from '../src/utils/collection';

test('address-fixed drop ignores the 40 m flight and escaped state in AR and radar', () => {
  const coin = { calibration: true, latitude: 48, longitude: 10 };
  const user = { ...coin, accuracy: 3 };
  const flight = { distance: 40, bearing: 112, timeLeft: 0, escaped: true };
  const report = coinEncounterReport(coin, flight);
  assert.equal(report?.distance ?? collectionDistance(user, coin), 0);
  assert.equal(report, undefined);
  assert.equal(canCollectAt(user, coin, 1000, 1000), true);
  const fixed = toWorldPosition(coin, user, 1.3);
  const movedUser = { ...user, latitude: user.latitude + .0001 };
  assert.ok(collectionDistance(movedUser, coin) > 11);
  assert.deepEqual(toWorldPosition(coin, user, 1.3), fixed);
});

test('regular flying coins retain the original encounter report', () => {
  const flight = { distance: 40, bearing: 112, timeLeft: 20, escaped: false };
  assert.equal(coinEncounterReport({}, flight), flight);
  assert.equal(coinEncounterReport({ calibration: false }, flight), flight);
});

test('fixed coin rendering is not blocked by the GPS accuracy gate', () => {
  const fixed = { calibration: true };
  const gps = { latitude: 48.4208, longitude: 10.8758, accuracy: 60 };
  assert.equal(fixed.calibration, true);
  assert.ok(gps.accuracy > 25);
  // Rendering uses the saved geographic point; collection still uses canCollectAt.
  assert.equal(coinEncounterReport(fixed, { distance: 5, bearing: 90, timeLeft: 0, escaped: false }), undefined);
});
