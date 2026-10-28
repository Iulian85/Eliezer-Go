import { CoinMotion, movingCoinPosition } from './coinMotion';

export interface CalibrationState { height: number; speed: number; running: boolean; distance: number; updatedAt: number; heading: number }
export function calibrationDistance(state: CalibrationState, now: number) {
  return state.distance + (state.running ? Math.max(0, now - state.updatedAt) / 1000 * state.speed : 0);
}
export function changeCalibration(state: CalibrationState, patch: Partial<CalibrationState>, now: number): CalibrationState {
  return { ...state, distance: calibrationDistance(state, now), updatedAt: now, ...patch };
}
export function calibrationMotion(origin: { latitude: number; longitude: number }, state: CalibrationState, now: number): CoinMotion {
  const speed = state.running ? state.speed : 0;
  const position = movingCoinPosition({ originLatitude: origin.latitude, originLongitude: origin.longitude,
    startsAt: 0, endsAt: Number.MAX_SAFE_INTEGER, heading: state.heading, speed: 1 }, state.distance * 1000);
  return { originLatitude: position.latitude, originLongitude: position.longitude,
    startsAt: state.updatedAt, endsAt: now + 86400000, heading: state.heading, speed };
}
