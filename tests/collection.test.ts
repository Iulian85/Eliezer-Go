import test from 'node:test';
import assert from 'node:assert/strict';
import { canCollectAt, collectionDistance } from '../src/utils/collection';
test('collection uses an unrounded one metre boundary and fresh GPS', () => {
  const coin = { latitude: 0, longitude: 0 };
  const at = (metres: number) => ({ latitude: metres / 6371000 * 180 / Math.PI, longitude: 0, accuracy: 3 });
  assert.ok(collectionDistance(at(.99), coin) < 1);
  assert.equal(canCollectAt(at(.99), coin, 1000, 2000), true);
  assert.equal(canCollectAt(at(1.01), coin, 1000, 2000), false);
  assert.equal(canCollectAt(at(.5), coin, 1000, 16000), false);
  assert.equal(canCollectAt({ ...at(.5), accuracy: 50 }, coin, 1000, 2000), false);
  assert.equal(canCollectAt({ ...at(.5), latitude: NaN }, coin, 1000, 2000), false);
});
