export interface CoinMotion {
  originLatitude: number;
  originLongitude: number;
  startsAt: number;
  endsAt: number;
  heading: number;
  speed: number;
}

let clockOffset = 0;
export function synchronizeGameClock(serverTime: number, requestStarted: number, received: number) {
  if (Number.isFinite(serverTime)) clockOffset = serverTime - (requestStarted + received) / 2;
}
export function gameTime() { return Date.now() + clockOffset; }

// Position depends on the shared route and clock, never on the hunter or frame rate.
export function movingCoinPosition(motion: CoinMotion, now: number) {
  const seconds = Math.max(0, Math.min(now, motion.endsAt) - motion.startsAt) / 1000;
  const angular = seconds * motion.speed / 6371000;
  const lat = motion.originLatitude * Math.PI / 180;
  const lon = motion.originLongitude * Math.PI / 180;
  const bearing = motion.heading * Math.PI / 180;
  const resultLat = Math.asin(Math.sin(lat) * Math.cos(angular) + Math.cos(lat) * Math.sin(angular) * Math.cos(bearing));
  const resultLon = lon + Math.atan2(Math.sin(bearing) * Math.sin(angular) * Math.cos(lat), Math.cos(angular) - Math.sin(lat) * Math.sin(resultLat));
  return { latitude: resultLat * 180 / Math.PI, longitude: ((resultLon * 180 / Math.PI + 540) % 360) - 180 };
}

export function validCoinMotion(motion: CoinMotion): boolean {
  return motion && [motion.originLatitude, motion.originLongitude, motion.startsAt, motion.endsAt, motion.heading, motion.speed].every(Number.isFinite)
    && Math.abs(motion.originLatitude) <= 90 && Math.abs(motion.originLongitude) <= 180
    && motion.endsAt > motion.startsAt && motion.speed > 0 && motion.speed <= 20;
}
