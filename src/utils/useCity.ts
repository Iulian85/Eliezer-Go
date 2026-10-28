import { useEffect, useState } from 'react';
import { GeoCoordinate, reverseGeocodeUserLocation } from './geo';

export function useCity(coordinates: GeoCoordinate | null, refresh = 0) {
  const latitude = coordinates ? Number(coordinates.latitude.toFixed(2)) : null;
  const longitude = coordinates ? Number(coordinates.longitude.toFixed(2)) : null;
  const [result, setResult] = useState({ city: '', loading: false });
  useEffect(() => {
    if (latitude === null || longitude === null) return;
    let active = true;
    let retry: ReturnType<typeof setTimeout> | undefined;
    setResult({ city: '', loading: true });
    async function load(attempt = 0) {
      try {
        const location = await reverseGeocodeUserLocation(latitude!, longitude!);
        if (active) setResult({ city: location.city, loading: false });
      } catch {
        if (!active) return;
        if (attempt < 2) retry = setTimeout(() => load(attempt + 1), 16000);
        else setResult({ city: '', loading: false });
      }
    }
    void load();
    return () => { active = false; clearTimeout(retry); };
  }, [latitude, longitude, refresh]);
  return result;
}
