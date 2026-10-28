/**
 * Geolocation & Radar Navigation Utilities
 * Provides Haversine distance, Geodetic bearing, and coordinate projections
 */

import { METROPOLIS_LOCATIONS } from '../constants';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export function formatGpsCoordinates(lat: number, lon: number): string {
  return `${Math.abs(lat).toFixed(6)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(6)}° ${lon < 0 ? 'W' : 'E'}`;
}

const cityCache = new Map<string, { value: string; expires: number }>();
const cityRequests = new Map<string, Promise<string>>();
export async function reverseGeocodeUserLocation(
  lat: number,
  lon: number
): Promise<{ city: string; region: string; fullLocation: string }> {
  const latitude = Number(lat.toFixed(2)), longitude = Number(lon.toFixed(2));
  const key = `${latitude},${longitude}`;
  const cached = cityCache.get(key);
  let city = cached && cached.expires > Date.now() ? cached.value : '';
  if (!city) {
    if (!cityRequests.has(key)) {
      cityRequests.set(key, (async () => {
        const response = await fetch('/api/location/city', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ latitude, longitude }), signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new Error('City unavailable');
        const data = await response.json();
        if (typeof data.city !== 'string' || !data.city.trim()) throw new Error('City unavailable');
        if (cityCache.size >= 100) cityCache.delete(cityCache.keys().next().value!);
        cityCache.set(key, { value: data.city, expires: Date.now() + 3600000 });
        return data.city as string;
      })());
    }
    try { city = await cityRequests.get(key)!; } finally { cityRequests.delete(key); }
  }
  return { city, region: '', fullLocation: city };
}

export interface GeoCoin {
  id: string;
  name: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  value: number;
  type: 'standard' | 'rare' | 'merchant';
  sponsorName?: string;
  collected: boolean;
  distance: number; // calculated relative to user
  bearing: number;  // 0-360 degrees relative to True North
  maxDurability?: number; // total lifespan in seconds
  expiresAt?: number;     // ms timestamp of despawn
  despawned?: boolean;    // true if despawned
  originLat?: number;     // anchor origin latitude for roaming
  originLon?: number;     // anchor origin longitude for roaming
  wanderHeading?: number; // current wandering heading in degrees
  wanderSpeed?: number;   // roaming speed in meters/second (1-3 m/s)
  wanderRadius?: number;  // roaming bounds radius in meters
}

const EARTH_RADIUS_METERS = 6371000;

/**
 * Calculates distance between two GPS coordinates using the Haversine formula
 */
export function getDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c * 10) / 10;
}

/**
 * Calculates initial bearing in degrees from point 1 to point 2 (0 = North, 90 = East, 180 = South, 270 = West)
 */
export function getBearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;
  return Math.round(bearing);
}

/**
 * Formats bearing into compass cardinal directions (e.g. 45° -> 'NE')
 */
export function getCompassDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Calculates remaining durability seconds and percentage for a coin
 */
export function getRemainingDurability(coin: { maxDurability?: number; expiresAt?: number }): {
  remainingSeconds: number;
  percent: number;
  isCritical: boolean;
  isExpired: boolean;
} {
  if (!coin.maxDurability || !coin.expiresAt) {
    return { remainingSeconds: Infinity, percent: 100, isCritical: false, isExpired: false };
  }
  const now = Date.now();
  const remainingMs = Math.max(0, coin.expiresAt - now);
  const remainingSeconds = Math.ceil(remainingMs / 1000);
  const percent = Math.max(0, Math.min(100, Math.round((remainingMs / (coin.maxDurability * 1000)) * 100)));
  const isExpired = remainingSeconds <= 0;
  const isCritical = !isExpired && (remainingSeconds <= 15 || percent <= 20);

  return { remainingSeconds, percent, isCritical, isExpired };
}

/**
 * Formats seconds into MM:SS format (e.g. 75 -> 01:15)
 */
export function formatCountdown(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '∞';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Generates realistic nearby coins from the metropolis catalog or around GPS coordinates
 */
export function generateNearbyGeoCoins(
  centerLat: number,
  centerLon: number,
  count = 6
): GeoCoin[] {
  const metersPerLat = 111132;
  const metersPerLon = 111320 * Math.cos((centerLat * Math.PI) / 180);
  const now = Date.now();

  // Find nearest metropolis within 35km if applicable (e.g. Gersthofen, New York, Tokyo, London, Paris, etc.)
  const nearestMetro = METROPOLIS_LOCATIONS.find((metro) => {
    const d = getDistanceMeters(centerLat, centerLon, metro.latitude, metro.longitude);
    return d <= 35000;
  });

  if (nearestMetro && nearestMetro.coins.length > 0) {
    return nearestMetro.coins.slice(0, count).map((mc, idx) => {
      let lat = mc.latitude;
      let lon = mc.longitude;

      // Primary active coin (idx 0) drops in close proximity (11m) so player can collect it in AR
      if (idx === 0) {
        const offsetNorth = 9;
        const offsetEast = 5;
        lat = centerLat + offsetNorth / metersPerLat;
        lon = centerLon + offsetEast / metersPerLon;
      }

      // Calculate realistic local distance & bearing from user
      const dist = getDistanceMeters(centerLat, centerLon, lat, lon);
      const bearing = getBearingDegrees(centerLat, centerLon, lat, lon);

      return {
        id: `${mc.id}_${now}_${idx}`,
        name: mc.name,
        landmark: mc.landmark,
        latitude: mc.latitude,
        longitude: mc.longitude,
        value: mc.value,
        type: mc.type,
        sponsorName: mc.sponsorName,
        collected: false,
        distance: dist,
        bearing: bearing,
        maxDurability: mc.type === 'rare' ? 90 : mc.type === 'merchant' ? 120 : undefined,
        expiresAt: mc.type === 'rare' ? now + 90000 : mc.type === 'merchant' ? now + 120000 : undefined,
        despawned: false,
        originLat: mc.latitude,
        originLon: mc.longitude,
        wanderHeading: Math.round(Math.random() * 360),
        wanderSpeed: mc.wanderSpeedMps || 1.5,
        wanderRadius: mc.wanderRadiusMeters || 60,
      };
    });
  }

  // Procedural scattered coins around user's GPS
  const presets = [
    { name: 'ELZR Urban Alpha', type: 'standard' as const, value: 100, dist: 12, angle: 25, wanderSpeed: 1.2, radius: 40 },
    { name: 'Landmark Crystal ELZR', type: 'rare' as const, value: 250, dist: 38, angle: 110, durabilitySeconds: 80, wanderSpeed: 2.0, radius: 60 },
    { name: 'CyberBrew Merchant Drop', type: 'merchant' as const, value: 500, dist: 55, angle: 205, sponsor: 'CyberBrew', wanderSpeed: 1.4, radius: 50 },
    { name: 'Avenue Cruiser ELZR', type: 'standard' as const, value: 100, dist: 78, angle: 295, wanderSpeed: 1.8, radius: 70 },
    { name: 'Plaza Treasure ELZR', type: 'rare' as const, value: 300, dist: 115, angle: 340, durabilitySeconds: 60, wanderSpeed: 2.2, radius: 80 },
    { name: 'NeoTech Partner Drop', type: 'merchant' as const, value: 400, dist: 145, angle: 165, sponsor: 'NeoTech', wanderSpeed: 1.5, radius: 50 },
    { name: 'Quantum Rift ELZR', type: 'rare' as const, value: 450, dist: 50, angle: 70, durabilitySeconds: 45, wanderSpeed: 2.5, radius: 75 },
  ];

  return presets.slice(0, count).map((p, idx) => {
    const rad = (p.angle * Math.PI) / 180;
    const dNorth = Math.cos(rad) * p.dist;
    const dEast = Math.sin(rad) * p.dist;

    const lat = centerLat + dNorth / metersPerLat;
    const lon = centerLon + dEast / metersPerLon;

    return {
      id: `geo_coin_${now}_${idx}`,
      name: p.name,
      latitude: lat,
      longitude: lon,
      value: p.value,
      type: p.type,
      sponsorName: p.sponsor,
      collected: false,
      distance: p.dist,
      bearing: p.angle,
      maxDurability: p.durabilitySeconds,
      expiresAt: p.durabilitySeconds ? now + p.durabilitySeconds * 1000 : undefined,
      despawned: false,
      originLat: lat,
      originLon: lon,
      wanderHeading: p.angle,
      wanderSpeed: p.wanderSpeed,
      wanderRadius: p.radius,
    };
  });
}

/**
 * Recalculates distance and bearing for fixed Service coins relative to user's updated GPS position.
 * Coin coordinates (latitude, longitude) remain 100% fixed and stationary at global Service location.
 */
export function wanderGeoCoins(
  coins: GeoCoin[],
  userLat: number,
  userLon: number,
  _deltaSeconds = 1.0
): GeoCoin[] {
  return coins.map((coin) => {
    if (coin.collected || coin.despawned) return coin;

    const newDist = getDistanceMeters(userLat, userLon, coin.latitude, coin.longitude);
    const newBearing = getBearingDegrees(userLat, userLon, coin.latitude, coin.longitude);

    return {
      ...coin,
      distance: newDist,
      bearing: newBearing,
    };
  });
}
