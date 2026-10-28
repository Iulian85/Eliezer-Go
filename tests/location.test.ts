import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatGpsCoordinates, reverseGeocodeUserLocation } from '../src/utils/geo';

test('location labels use the received GPS fix, including hemispheres and zero', async () => {
  assert.equal(formatGpsCoordinates(-33.123456, -70.654321), '33.123456° S, 70.654321° W');
  assert.equal(formatGpsCoordinates(0, 0), '0.000000° N, 0.000000° E');
  const location = await reverseGeocodeUserLocation(51.5, -0.12);
  assert.equal(location.fullLocation, '51.500000° N, 0.120000° W');
  assert.equal(location.city, '');
});
