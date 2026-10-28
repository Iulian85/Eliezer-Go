import test from 'node:test';
import assert from 'node:assert/strict';
import { calibrationDistance, calibrationMotion, changeCalibration, CalibrationState } from '../src/utils/coinCalibration';
import { movingCoinPosition } from '../src/utils/coinMotion';
const initial: CalibrationState = { height: 1.4, speed: .5, running: false, distance: 0, updatedAt: 1000, heading: 90 };
test('calibration stays home until started, changes speed without a jump, pauses and returns home', () => {
  assert.equal(calibrationDistance(initial, 5000), 0);
  const running = changeCalibration(initial, { running: true }, 5000);
  const faster = changeCalibration(running, { speed: 2 }, 15000);
  assert.equal(calibrationDistance(faster, 15000), 5);
  assert.equal(calibrationDistance(faster, 20000), 15);
  const paused = changeCalibration(faster, { running: false }, 20000);
  assert.equal(calibrationDistance(paused, 50000), 15);
  const home = changeCalibration(paused, { running: false, distance: 0 }, 50000);
  const origin = { latitude: 48, longitude: 10 };
  const point = movingCoinPosition(calibrationMotion(origin, home, 50000), 90000);
  assert.ok(Math.abs(point.latitude - origin.latitude) < 1e-10);
  assert.ok(Math.abs(point.longitude - origin.longitude) < 1e-10);
});
