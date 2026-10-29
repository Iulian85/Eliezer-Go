export const COLLECTION_RADIUS_METERS = 2;
export interface CollectionPosition { latitude: number; longitude: number; accuracy?: number }
export function collectionDistance(a: CollectionPosition, b: CollectionPosition) {
  const rad = Math.PI / 180;
  const x = Math.sin((b.latitude - a.latitude) * rad / 2) ** 2 + Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin((b.longitude - a.longitude) * rad / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function canCollectAt(user: CollectionPosition | null, coin: CollectionPosition, measuredAt: number, now: number) {
  return Boolean(user && [user.latitude, user.longitude, user.accuracy, coin.latitude, coin.longitude, measuredAt, now].every(Number.isFinite)
    && Math.abs(user.latitude) <= 90 && Math.abs(user.longitude) <= 180
    && user.accuracy! > 0 && user.accuracy! <= 10 && now - measuredAt >= -5000 && now - measuredAt < 15000
    && collectionDistance(user, coin) <= COLLECTION_RADIUS_METERS);
}
