export interface CoinFlightPath {
  id: number;
  start: [number, number, number];
  end: [number, number, number];
  durationSeconds: number;
}

// DriftingCoin movement from the earlier deployed Eliezer-Hunt version.
export function createCoinFlightPath(random = Math.random): CoinFlightPath {
  const start: [number, number, number] = [(random() - .5) * 5, 1.3, -7];
  const angle = random() * Math.PI * 2;
  const speed = .6 + random() * .5;
  const vx = Math.cos(angle) * speed, vz = Math.sin(angle) * speed;
  const projection = start[0] * vx + start[2] * vz;
  const radiusSquared = start[0] ** 2 + start[2] ** 2 + (start[1] - VIEWER_HEIGHT) ** 2;
  const durationSeconds = (-projection + Math.sqrt(projection ** 2 + speed ** 2 * (81 - radiusSquared))) / speed ** 2;
  const end: [number, number, number] = [start[0] + vx * durationSeconds, start[1], start[2] + vz * durationSeconds];
  return { id: Date.now() + Math.floor(random() * 100000), start, end, durationSeconds };
}

export interface CoinFlight { startedAt: number; path: CoinFlightPath }
export const VIEWER_HEIGHT = 1.6;
export function localCoinFlight(flight: CoinFlight, now: number, animationSeconds = now / 1000) {
  if (!Number.isFinite(flight.startedAt)) {
    const position: [number, number, number] = [flight.path.start[0], flight.path.start[1] - VIEWER_HEIGHT, flight.path.start[2]];
    return { position, distance: Math.hypot(...position), escaped: false };
  }
  const elapsed = Math.max(0, now - flight.startedAt) / 1000;
  const progress = Math.min(elapsed / flight.path.durationSeconds, 1);
  const position = flight.path.start.map((value, axis) => value + (flight.path.end[axis] - value) * progress) as [number, number, number];
  position[1] += Math.sin(animationSeconds * 2.5) * .15 - VIEWER_HEIGHT;
  return { position, distance: Math.hypot(...position), escaped: progress >= 1 };
}
