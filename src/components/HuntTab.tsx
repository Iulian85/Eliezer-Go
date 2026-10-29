import React, { useState, useEffect } from 'react';
import { Camera, MapPin, Sparkles, Timer, AlertTriangle, Users, Flame, Radio, Zap } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import { RadarMapOverlay } from './RadarMapOverlay';
import { GeoCoin, GeoCoordinate, getDistanceMeters, getBearingDegrees } from '../utils/geo';
import { fetchCoinDropsFromService } from '../lib/api';
import { generateNearbyHunters, generateCityHeatmapZones } from '../utils/nearbyHunters';
import { enterFullscreen } from '../utils/fullscreen';

interface HuntTabProps {
  onStartHunting: (prewarmedStream?: MediaStream) => boolean;
  elzrInCity: number;
  cityName: string;
  energy: number;
  onNavigateToShop: () => void;
}

export const HuntTab: React.FC<HuntTabProps> = ({
  onStartHunting,
  elzrInCity,
  cityName,
  energy,
  onNavigateToShop,
}) => {
  const [isRadarMapOpen, setIsRadarMapOpen] = useState<boolean>(false);

  const [location, setLocation] = useState<GeoCoordinate | null>(null);
  const [coins, setCoins] = useState<GeoCoin[]>([]);
  const userLat = location?.latitude ?? 0;
  const userLng = location?.longitude ?? 0;
  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(p => setLocation(p.coords), () => setLocation(null), { enableHighAccuracy: true });
    return () => navigator.geolocation.clearWatch(id);
  }, []);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const drops = await fetchCoinDropsFromService();
        if (active) setCoins(drops.map(d => ({
          id: d.id, name: d.name, latitude: d.latitude, longitude: d.longitude,
          type: d.coin_type, value: d.value, collected: false,
          distance: getDistanceMeters(userLat, userLng, d.latitude, d.longitude),
          bearing: getBearingDegrees(userLat, userLng, d.latitude, d.longitude),
        })));
      } catch { if (active) setCoins([]); }
    };
    load();
    const timer = setInterval(load, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [userLat, userLng]);
  const nearbyHunters = generateNearbyHunters(userLat, userLng);
  const heatmapZones = generateCityHeatmapZones(userLat, userLng);

  const handleStart = async () => {
    if (energy < 10) {
      triggerHaptic('error');
      playSound.buttonClick();
      alert('⚡ Insufficient Energy! You need at least 10 Energy to start an AR Hunt. Refill in the Shop!');
      onNavigateToShop();
      return;
    }
    triggerHaptic('heavy');
    playSound.radarPing();

    // Trigger Fullscreen on user tap gesture for full immersion
    enterFullscreen().catch(() => {});

    // Trigger camera directly in the user tap gesture so Telegram / browser opens camera instantly without delay
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        onStartHunting(stream);
        return;
      } catch (err) {
        console.warn('Direct gesture camera request fell through to AR fallback:', err);
      }
    }

    onStartHunting();
  };

  return (
    <div className="flex flex-col px-4 pt-6 pb-28 max-w-md mx-auto min-h-[82vh] justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>LIVE HUNT & RADAR</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToShop}
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/40 text-[10px] font-mono text-amber-300 hover:text-amber-200 transition-all cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span>{energy} ENERGY</span>
            </button>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-[10px] font-mono text-rose-300">
              <Timer className="w-3 h-3 text-rose-400 animate-spin" />
              <span>DURABILITY</span>
            </div>
          </div>
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight font-sans mt-1">
          AR Hunt
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Locate nearby hunters and collect geolocated ELZR coins.
        </p>
      </div>

      {/* Main Radar Card with Dual Mode Buttons */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-[32px] p-5 flex flex-col items-center justify-between my-3 relative overflow-hidden shadow-2xl">
        {/* Background glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Radar Ring Visuals */}
        <div className="relative w-52 h-52 flex items-center justify-center my-3">
          <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-pulse" />
          <div className="absolute inset-8 rounded-full border border-cyan-500/30" />
          <div className="absolute inset-16 rounded-full border border-cyan-500/50" />
          <div className="absolute inset-24 rounded-full border border-cyan-400/80 bg-cyan-950/20 flex items-center justify-center" />

          {/* Sweeping radar needle */}
          <div
            className="absolute top-1/2 left-1/2 w-26 h-[1px] bg-gradient-to-r from-transparent to-cyan-400 origin-left animate-spin pointer-events-none"
            style={{ animationDuration: '3.5s' }}
          />

          {/* Center MapPin */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-cyan-400 flex items-center justify-center shadow-[0_0_25px_#00e5ff] animate-bounce">
            <MapPin className="w-5 h-5 text-[#060b13] fill-[#060b13]" />
          </div>

          {/* Orbiting Coin & Hunter blips */}
          <div className="absolute top-8 right-10 w-3.5 h-3.5 rounded-full bg-amber-400 shadow-[0_0_12px_#f59e0b] animate-ping" />
          <div className="absolute bottom-10 left-10 w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_12px_#a855f7] animate-pulse" />
          <div className="absolute top-12 left-14 w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
          <div className="absolute bottom-12 right-12 w-3 h-3 rounded-full bg-cyan-400 border border-white shadow-[0_0_8px_#00e5ff] animate-ping" />
        </div>

        {/* Interactive Quick Features Bar: [👥 Nearby Hunters 5km] [🔥 Heatmap Zones] */}
        <div className="w-full grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsRadarMapOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-[#071322] border border-amber-500/40 text-left hover:border-amber-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[10px] font-bold uppercase">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>NEARBY HUNTERS</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {nearbyHunters.length} Active in 5km
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5 group-hover:text-amber-300">
              Tap to view & salute ➔
            </div>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setIsRadarMapOpen(true);
            }}
            className="p-2.5 rounded-2xl bg-[#071322] border border-rose-500/40 text-left hover:border-rose-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] font-bold uppercase">
              <Flame className="w-3.5 h-3.5 shrink-0 animate-bounce" />
              <span>CITY HEATMAP</span>
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {heatmapZones[0].density.toUpperCase()} Drop Zone
            </div>
            <div className="text-[9px] font-mono text-slate-400 mt-0.5 group-hover:text-rose-300">
              {heatmapZones[0].multiplier} ➔
            </div>
          </button>
        </div>

        {/* Durability Mechanic Briefing Pill */}
        <div className="w-full bg-[#050c18] border border-amber-500/30 rounded-2xl p-2.5 mb-3 text-left">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
              LIMITED SPAWN DURABILITY
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-relaxed font-sans">
            Rare coins decay in 45s–80s. Reach coordinates before durability drops to zero!
          </p>
        </div>

        {/* START AR HUNT */}
        <div className="w-full flex flex-col gap-2">
          {/* Main START HUNTING Button */}
          <button
            onClick={handleStart}
            className="w-full py-3.5 px-5 rounded-full bg-white text-slate-950 font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_8px_30px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer hover:bg-slate-100"
          >
            <Camera className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span className="font-mono">START AR HUNT</span>
          </button>

        </div>
      </div>

      {/* Quick inventory note */}
      <div className="flex items-center justify-center gap-2 text-xs font-mono text-slate-400 text-center">
        <Sparkles className="w-3.5 h-3.5 text-rose-400" />
        <span>{elzrInCity} ELZR active around {cityName}</span>
      </div>

      {/* Modals */}
      <RadarMapOverlay
        isOpen={isRadarMapOpen && Boolean(location)}
        onClose={() => setIsRadarMapOpen(false)}
        userCoords={location || { latitude: userLat, longitude: userLng }}
        coins={coins}
        activeCoinId={coins[0]?.id || ''}
        onSelectCoin={() => {}}
        currentYaw={45}
      />
    </div>
  );
};
