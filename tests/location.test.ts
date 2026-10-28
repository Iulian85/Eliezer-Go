import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatGpsCoordinates, reverseGeocodeUserLocation } from '../src/utils/geo';

test('city lookup sends an approximate position and displays only the returned city', async () => {
  assert.equal(formatGpsCoordinates(-33.123456, -70.654321), '33.123456° S, 70.654321° W');
  assert.equal(formatGpsCoordinates(0, 0), '0.000000° N, 0.000000° E');
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async (url, options) => {
    requests++;
    assert.equal(url, '/api/location/city');
    assert.deepEqual(JSON.parse(String(options?.body)), { latitude: 51.5, longitude: -0.12 });
    return new Response(JSON.stringify({ city: 'London', street: 'Do not display' }));
  };
  try {
    const location = await reverseGeocodeUserLocation(51.501234, -0.123456);
    assert.deepEqual(location, { city: 'London', region: '', fullLocation: 'London' });
    await reverseGeocodeUserLocation(51.501235, -0.123457);
    assert.equal(requests, 1);
  } finally { globalThis.fetch = originalFetch; }
});
