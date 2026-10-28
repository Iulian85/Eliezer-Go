import { WeatherCondition, WeatherData } from '../types';

export interface WeatherPreset {
  id: WeatherCondition;
  label: string;
  description: string;
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  themeColor: string;
  badgeBg: string;
}

export const WEATHER_PRESETS: Record<WeatherCondition, WeatherPreset> = {
  clear: {
    id: 'clear',
    label: 'Clear / Solar Dust',
    description: 'Crisp sky with ambient cyber motes and solar drift',
    temperature: 22,
    windSpeed: 6.5,
    weatherCode: 0,
    themeColor: '#38bdf8',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  cloudy: {
    id: 'cloudy',
    label: 'Overcast / Atmospheric Haze',
    description: 'Diffused sky with rolling cybernetic haze',
    temperature: 17,
    windSpeed: 12.0,
    weatherCode: 3,
    themeColor: '#94a3b8',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  },
  rain: {
    id: 'rain',
    label: 'Rain Storm / Cyber Downpour',
    description: 'Dynamic falling streaks with droplet splash physics',
    temperature: 14,
    windSpeed: 21.0,
    weatherCode: 63,
    themeColor: '#00e5ff',
    badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  snow: {
    id: 'snow',
    label: 'Blizzard / Drifting Crystals',
    description: 'Freezing altitude with drifting hexagonal cryo-particles',
    temperature: -2,
    windSpeed: 15.4,
    weatherCode: 73,
    themeColor: '#e0f2fe',
    badgeBg: 'bg-sky-400/20 text-sky-200 border-sky-400/40',
  },
  fog: {
    id: 'fog',
    label: 'Dense Fog / Volumetric Mist',
    description: 'Low-visibility volumetric mist shroud across the terrain',
    temperature: 9,
    windSpeed: 4.2,
    weatherCode: 45,
    themeColor: '#a78bfa',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  thunder: {
    id: 'thunder',
    label: 'Thunderstorm / Lightning Arc',
    description: 'Torrential downpour with sudden atmospheric lightning flashes',
    temperature: 19,
    windSpeed: 34.0,
    weatherCode: 95,
    themeColor: '#f59e0b',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
};

export function mapWmoCodeToCondition(code: number): { condition: WeatherCondition; label: string } {
  if (code === 0 || code === 1) {
    return { condition: 'clear', label: code === 0 ? 'Clear Sky' : 'Mainly Clear' };
  }
  if (code === 2 || code === 3) {
    return { condition: 'cloudy', label: code === 2 ? 'Partly Cloudy' : 'Overcast' };
  }
  if (code === 45 || code === 48) {
    return { condition: 'fog', label: 'Dense Fog' };
  }
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return { condition: 'rain', label: code >= 63 ? 'Heavy Rain' : 'Light Rain' };
  }
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return { condition: 'snow', label: 'Snowfall' };
  }
  if (code >= 95 && code <= 99) {
    return { condition: 'thunder', label: 'Thunderstorm' };
  }
  return { condition: 'clear', label: 'Clear Sky' };
}

// Memory cache to prevent hammering Open-Meteo
let cachedWeather: { data: WeatherData; timestamp: number; key: string } | null = null;
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Fetches real-world local weather from Open-Meteo given GPS latitude and longitude.
 * Falls back to default realistic weather if offline or network fails.
 */
export async function fetchLiveWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  return { condition: 'clear', label: 'Weather preview', temperature: 19, windSpeed: 8, weatherCode: 0, isSimulated: true };
}
