import test from 'node:test';
import assert from 'node:assert/strict';
import { selectFlightCameraSource } from '../src/utils/flightCameraSource';

test('Telegram-only orientation can start rendering without a browser sensor event', () => {
  assert.equal(selectFlightCameraSource(null, false, false), null);
  assert.equal(selectFlightCameraSource(null, false, true), 'native');
  assert.equal(selectFlightCameraSource('native', true, true), 'native');
});

test('legacy browser orientation remains selected when it is available first', () => {
  assert.equal(selectFlightCameraSource(null, true, false), 'browser');
  assert.equal(selectFlightCameraSource('browser', true, true), 'browser');
});
