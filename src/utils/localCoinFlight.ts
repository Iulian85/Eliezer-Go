// Local encounter animation, independent of GPS and phone orientation.
export const FLIGHT_SPEED = .15;
export const FLIGHT_DURATION = 160000;
export function localCoinFlight(startedAt: number, now: number) {
  const elapsed = Math.max(0, now - startedAt);
  const x = 1.5;
  const y = -.2;
  const z = -12 + Math.min(elapsed, FLIGHT_DURATION) / 1000 * FLIGHT_SPEED;
  return { position: [x, y, z] as [number, number, number],
    distance: Math.hypot(x, y, z), escaped: elapsed >= FLIGHT_DURATION };
}
