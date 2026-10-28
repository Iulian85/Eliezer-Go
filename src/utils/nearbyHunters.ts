import { GeoCoordinate } from './geo';

export interface NearbyHunter {
  id: string;
  callsign: string;
  distanceKm: number; // in km (e.g. 0.4 to 4.9)
  bearingDeg: number; // 0 - 360
  status: 'Hunting' | 'In AR Mode' | 'Collecting' | 'Active';
  lastSeenMin: number; // minutes ago
  level: number;
  coinsCollected: number;
  latitude: number;
  longitude: number;
}

export interface HeatmapZone {
  id: string;
  sectorName: string;
  density: 'ultra' | 'high' | 'medium';
  multiplier: string;
  radiusMeters: number;
  latitude: number;
  longitude: number;
  activeSpawnsCount: number;
}

export interface LandmarkLocation {
  id: string;
  name: string;
  description: string;
  distanceMeters: number;
  bearingDeg: number;
  bonusCoins: number;
  scanned: boolean;
  latitude: number;
  longitude: number;
}

// Generate realistic nearby active hunters within 5km radius
export function generateNearbyHunters(baseLat: number, baseLng: number): NearbyHunter[] {
  const mockCallsigns = [
    'Hunter #4829',
    'Vapor #9120',
    'Echo #3104',
    'Nova #7219',
    'Spectre #1842',
    'Astro #5019',
    'Cipher #6381',
    'Krypton #2940',
  ];

  const statuses: NearbyHunter['status'][] = ['Hunting', 'In AR Mode', 'Collecting', 'Active'];

  return mockCallsigns.map((callsign, idx) => {
    // Generate distance between 0.3km and 4.8km
    const distanceKm = Number((0.3 + ((idx * 0.65) % 4.3)).toFixed(1));
    const bearingDeg = Math.round((idx * 45 + 18) % 360);
    
    // Offset coordinates roughly by distance (1 km ~ 0.009 deg lat)
    const latOffset = (Math.cos((bearingDeg * Math.PI) / 180) * distanceKm * 0.009);
    const lngOffset = (Math.sin((bearingDeg * Math.PI) / 180) * distanceKm * 0.009) / Math.cos((baseLat * Math.PI) / 180);

    return {
      id: `hunter-${idx + 1}`,
      callsign,
      distanceKm,
      bearingDeg,
      status: statuses[idx % statuses.length],
      lastSeenMin: Math.floor(1 + (idx * 1.5)),
      level: 5 + (idx * 3),
      coinsCollected: 24 + (idx * 18),
      latitude: baseLat + latOffset,
      longitude: baseLng + lngOffset,
    };
  });
}

// Generate high-density ELZR heatmap drop zones for the city
export function generateCityHeatmapZones(baseLat: number, baseLng: number): HeatmapZone[] {
  return [
    {
      id: 'zone-1',
      sectorName: 'Sector A1 - Central Plaza',
      density: 'ultra',
      multiplier: '3.8x ELZR Density',
      radiusMeters: 280,
      latitude: baseLat + 0.002,
      longitude: baseLng + 0.001,
      activeSpawnsCount: 14,
    },
    {
      id: 'zone-2',
      sectorName: 'Sector B4 - Tech Quarter Park',
      density: 'high',
      multiplier: '2.5x ELZR Density',
      radiusMeters: 220,
      latitude: baseLat - 0.003,
      longitude: baseLng + 0.004,
      activeSpawnsCount: 9,
    },
    {
      id: 'zone-3',
      sectorName: 'Sector C2 - Old Town Fountain',
      density: 'ultra',
      multiplier: '3.2x ELZR Density',
      radiusMeters: 250,
      latitude: baseLat + 0.004,
      longitude: baseLng - 0.003,
      activeSpawnsCount: 11,
    },
    {
      id: 'zone-4',
      sectorName: 'Sector D1 - Riverfront Walk',
      density: 'medium',
      multiplier: '1.8x ELZR Density',
      radiusMeters: 180,
      latitude: baseLat - 0.002,
      longitude: baseLng - 0.004,
      activeSpawnsCount: 6,
    },
  ];
}

// Generate Smart Scan Landmark targets
export function generateLandmarks(baseLat: number, baseLng: number): LandmarkLocation[] {
  return [
    {
      id: 'landmark-1',
      name: 'City Hall Historic Steps',
      description: 'Historical marble pillars and civic square with high magnetic flux.',
      distanceMeters: 120,
      bearingDeg: 35,
      bonusCoins: 150,
      scanned: false,
      latitude: baseLat + 0.001,
      longitude: baseLng + 0.0008,
    },
    {
      id: 'landmark-2',
      name: 'Central Clock Tower',
      description: 'Gothic spire broadcasting temporal resonance frequencies.',
      distanceMeters: 240,
      bearingDeg: 140,
      bonusCoins: 250,
      scanned: false,
      latitude: baseLat - 0.0018,
      longitude: baseLng + 0.0015,
    },
    {
      id: 'landmark-3',
      name: 'Tech Quarter Glass Archway',
      description: 'Futuristic glass atrium emitting high-frequency ELZR particles.',
      distanceMeters: 380,
      bearingDeg: 220,
      bonusCoins: 300,
      scanned: false,
      latitude: baseLat - 0.0025,
      longitude: baseLng - 0.002,
    },
    {
      id: 'landmark-4',
      name: 'St. James Cathedral Promenade',
      description: 'Ancient stone archway rich with secret merchant spawn energy.',
      distanceMeters: 510,
      bearingDeg: 310,
      bonusCoins: 200,
      scanned: false,
      latitude: baseLat + 0.0035,
      longitude: baseLng - 0.0028,
    },
  ];
}
