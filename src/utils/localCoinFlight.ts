export interface CoinFlightPath {
  id: number;
  start: [number, number, number];
  end: [number, number, number];
  durationSeconds: number;
}

// Flight algorithm from Eliezer-Hunt/views/ARView.tsx.
export function createCoinFlightPath(random = Math.random): CoinFlightPath {
  const angle = random() * Math.PI * 2;
  const traverseDistance = 40;
  const passOffsetX = (random() - .5) * .6;
  const passY = 1.3 + random() * .4;
  const passOffsetZ = (random() - .5) * .6;
  const dx = Math.cos(angle), dz = Math.sin(angle);
  const start: [number, number, number] = [passOffsetX - dx * traverseDistance, passY, passOffsetZ - dz * traverseDistance];
  const end: [number, number, number] = [passOffsetX + dx * traverseDistance, passY + (random() - .5) * .4, passOffsetZ + dz * traverseDistance];
  return { id: Date.now() + Math.floor(random() * 100000), start, end, durationSeconds: 20 + random() * 8 };
}

export interface CoinFlight { startedAt: number; path: CoinFlightPath }
export function localCoinFlight(flight: CoinFlight, now: number, animationSeconds = now / 1000) {
  const elapsed = Math.max(0, now - flight.startedAt) / 1000;
  const progress = Math.min(elapsed / flight.path.durationSeconds, 1);
  const position = flight.path.start.map((value, axis) => value + (flight.path.end[axis] - value) * progress) as [number, number, number];
  position[1] += Math.sin(animationSeconds * 1.2) * .02;
  return { position, distance: Math.hypot(...position), escaped: progress >= 1 };
}
