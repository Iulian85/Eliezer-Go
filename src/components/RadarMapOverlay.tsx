import React, { useState, useEffect } from 'react';
import { X, Navigation2, MapPin, Sparkles, Trophy, Megaphone, Flame, Users, Radio, Send, CheckCircle2, Timer } from 'lucide-react';
import { GeoCoin, GeoCoordinate, getCompassDirection, getRemainingDurability, formatCountdown } from '../utils/geo';
import { NearbyHunter, HeatmapZone, generateNearbyHunters, generateCityHeatmapZones } from '../utils/nearbyHunters';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import { formatCoinDistance } from '../utils/encounterDisplay';

interface RadarMapOverlayProps {
  encounterMode?: boolean;
  isOpen: boolean;
  onClose: () => void;
  userCoords: GeoCoordinate;
  coins: GeoCoin[];
  activeCoinId: string;
  onSelectCoin: (coinId: string) => void;
  currentYaw: number; // compass heading in degrees
}

export const RadarMapOverlay: React.FC<RadarMapOverlayProps> = ({
  encounterMode = false,
  isOpen,
  onClose,
  userCoords,
  coins,
  activeCoinId,
  onSelectCoin,
  currentYaw,
}) => {
  const [radarRange, setRadarRange] = useState<number>(15000); // 50m, 200m, 1000m, 15000m (15km)
  const [mapMode, setMapMode] = useState<'heading' | 'north'>('north'); // Default: Rigid Geographic North-up
  const [activeLayer, setActiveLayer] = useState<'coins' | 'hunters' | 'heatmap'>('coins');
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  
  // Selected hunter state for interactive inspection & salute ping
  const [selectedHunter, setSelectedHunter] = useState<NearbyHunter | null>(null);
  const [pingSuccess, setPingSuccess] = useState<string | null>(null);
  const [, setTick] = useState<number>(0);

  // Generate mock nearby hunters and heatmap zones relative to user position
  const [nearbyHunters] = useState<NearbyHunter[]>(() =>
    generateNearbyHunters(userCoords.latitude, userCoords.longitude)
  );
  const [heatmapZones] = useState<HeatmapZone[]>(() =>
    generateCityHeatmapZones(userCoords.latitude, userCoords.longitude)
  );

  // Live timer update every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter uncollected coins
  const uncollectedCoins = coins
    .filter((c) => !c.collected)
    .sort((a, b) => a.distance - b.distance);

  const activeCoin = coins.find((c) => c.id === activeCoinId) || uncollectedCoins[0];

  const handleCoinClick = (coin: GeoCoin) => {
    triggerHaptic('medium');
    playSound.buttonClick();
    onSelectCoin(coin.id);
  };

  const handleSendPing = (hunter: NearbyHunter) => {
    triggerHaptic('heavy');
    playSound.radarPing();
    setPingSuccess(`Salute & Radar Ping sent to ${hunter.callsign}! (+5 XP)`);
    setTimeout(() => {
      setPingSuccess(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-lg animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#071322] border border-cyan-500/40 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,229,255,0.2)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#142640]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
              <h2 className="text-base font-bold text-white font-mono tracking-wider uppercase">
                {encounterMode ? 'AR RADAR & HEATMAP' : 'GPS RADAR & HEATMAP'}
              </h2>
            </div>
            <div className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              {userCoords.latitude.toFixed(4)}°N, {userCoords.longitude.toFixed(4)}°E · ±{userCoords.accuracy || 3}m
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* North-up vs Heading-up mode toggle */}
            <button
              onClick={() => {
                triggerHaptic('light');
                setMapMode(mapMode === 'heading' ? 'north' : 'heading');
              }}
              title="Toggle North-Up / Heading-Up"
              className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-300 hover:text-white"
            >
              {mapMode === 'heading' ? 'HDG-UP' : 'N-UP'}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs: [Coins] [Nearby Hunters] [Heatmap Zones] */}
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveLayer('coins');
            }}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
              activeLayer === 'coins'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#0a1628] text-slate-400 hover:text-white border border-[#142640]'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Coins ({uncollectedCoins.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveLayer('hunters');
            }}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
              activeLayer === 'hunters'
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-[#0a1628] text-slate-400 hover:text-white border border-[#142640]'
            }`}
          >
            <Users className="w-3 h-3" />
            <span>Hunters ({nearbyHunters.length})</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveLayer('heatmap');
              setShowHeatmap(true);
            }}
            className={`py-1.5 px-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1 transition-all ${
              activeLayer === 'heatmap'
                ? 'bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'bg-[#0a1628] text-slate-400 hover:text-white border border-[#142640]'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Heatmap</span>
          </button>
        </div>

        {/* Tactical Radar Display Screen */}
        <div className="relative w-full aspect-square max-w-[310px] mx-auto my-3 flex items-center justify-center">
          {/* Radar Background circle with glowing cyan border */}
          <div className="absolute inset-0 rounded-full bg-[#040a14] border-2 border-cyan-500/50 shadow-[inset_0_0_30px_rgba(0,229,255,0.15)] overflow-hidden">
            {/* Real-time Heatmap Overlay Radial Gradients */}
            {(showHeatmap || activeLayer === 'heatmap') && (
              <div className="absolute inset-0 pointer-events-none opacity-80 z-0">
                {heatmapZones.map((zone, idx) => {
                  const angle = (idx * 90 + 35) % 360;
                  const rad = (angle * Math.PI) / 180;
                  const dist = 70 + (idx * 25);
                  const hx = Math.sin(rad) * dist;
                  const hy = -Math.cos(rad) * dist;

                  return (
                    <div
                      key={zone.id}
                      className="absolute w-28 h-28 rounded-full blur-xl -translate-x-1/2 -translate-y-1/2 animate-pulse"
                      style={{
                        top: `calc(50% + ${hy}px)`,
                        left: `calc(50% + ${hx}px)`,
                        background:
                          zone.density === 'ultra'
                            ? 'radial-gradient(circle, rgba(244,63,94,0.65) 0%, rgba(245,158,11,0.3) 50%, transparent 80%)'
                            : 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, rgba(6,182,212,0.2) 60%, transparent 80%)',
                      }}
                    />
                  );
                })}
              </div>
            )}

            {/* Concentric distance rings */}
            <div className="absolute inset-[15%] rounded-full border border-cyan-500/20 z-10" />
            <div className="absolute inset-[35%] rounded-full border border-cyan-500/25 z-10" />
            <div className="absolute inset-[55%] rounded-full border border-cyan-500/35 z-10" />
            <div className="absolute inset-[75%] rounded-full border border-cyan-500/50 z-10" />

            {/* Crosshair axes */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/20 z-10" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/20 z-10" />

            {/* Rotating radar sweep needle */}
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-cyan-300 origin-left animate-spin pointer-events-none z-10"
              style={{ animationDuration: '4s' }}
            />

            {/* Distance Markers */}
            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400/60 z-10">
              {radarRange >= 1000 ? `${radarRange / 1000}KM` : `${radarRange}M`}
            </span>

            {/* PLOT NEARBY COIN BLIPS */}
            {(activeLayer === 'coins' || activeLayer === 'heatmap') &&
              uncollectedCoins.map((coin) => {
                const effectiveAngle =
                  mapMode === 'heading'
                    ? (coin.bearing - currentYaw + 360) % 360
                    : coin.bearing;

                const angleRad = (effectiveAngle * Math.PI) / 180;
                const ratio = Math.min(0.92, coin.distance / radarRange);
                const radiusPx = 140 * ratio;

                const blipX = Math.sin(angleRad) * radiusPx;
                const blipY = -Math.cos(angleRad) * radiusPx;

                const isSelected = activeCoin && activeCoin.id === coin.id;
                const durability = getRemainingDurability(coin);

                return (
                  <button
                    key={coin.id}
                    onClick={() => handleCoinClick(coin)}
                    title={`${coin.name} (${formatCoinDistance(coin.distance)})`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 transition-all hover:scale-125 cursor-pointer"
                    style={{
                      transform: `translate(calc(-50% + ${blipX}px), calc(-50% + ${blipY}px))`,
                    }}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-all ${
                        isSelected ? 'ring-4 ring-cyan-400 scale-125 animate-pulse' : ''
                      } ${
                        durability.isCritical
                          ? 'bg-rose-500 shadow-[0_0_12px_#f43f5e] ring-2 ring-rose-400 animate-ping'
                          : coin.type === 'rare'
                          ? 'bg-purple-500 shadow-[0_0_10px_#a855f7]'
                          : coin.type === 'merchant'
                          ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'
                          : 'bg-amber-400 shadow-[0_0_10px_#fbbf24]'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                  </button>
                );
              })}

            {/* PLOT NEARBY HUNTER MARKERS (5km Radius Active Players) */}
            {(activeLayer === 'hunters' || activeLayer === 'heatmap') &&
              nearbyHunters.map((hunter) => {
                const effectiveAngle =
                  mapMode === 'heading'
                    ? (hunter.bearingDeg - currentYaw + 360) % 360
                    : hunter.bearingDeg;

                const angleRad = (effectiveAngle * Math.PI) / 180;
                // Scale distance visually inside radar screen
                const distRatio = Math.min(0.88, hunter.distanceKm / 5.0);
                const radiusPx = 135 * distRatio;

                const hx = Math.sin(angleRad) * radiusPx;
                const hy = -Math.cos(angleRad) * radiusPx;

                return (
                  <button
                    key={hunter.id}
                    onClick={() => {
                      triggerHaptic('medium');
                      playSound.buttonClick();
                      setSelectedHunter(hunter);
                    }}
                    title={`${hunter.callsign} (${hunter.distanceKm}km away)`}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-25 hover:scale-125 transition-all cursor-pointer group"
                    style={{
                      transform: `translate(calc(-50% + ${hx}px), calc(-50% + ${hy}px))`,
                    }}
                  >
                    {/* Pulsing Hunter Ring */}
                    <div className="relative flex items-center justify-center">
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-400 animate-ping absolute" />
                      <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-cyan-400 text-cyan-300 flex items-center justify-center shadow-[0_0_10px_#00e5ff]">
                        <Radio className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
                      </div>
                    </div>
                    <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] font-mono font-bold text-cyan-300 bg-slate-950/90 px-1 rounded border border-cyan-500/40 whitespace-nowrap">
                      {hunter.callsign.split(' ')[0]} ({hunter.distanceKm}k)
                    </span>
                  </button>
                );
              })}

            {/* CENTER HUNTER / USER ICON WITH DIRECTIONAL VISION CONE */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
              <div
                className="w-16 h-16 -top-8 -left-8 absolute transition-transform duration-150"
                style={{
                  transform: `rotate(${mapMode === 'north' ? currentYaw : 0}deg)`,
                }}
              >
                <div
                  className="w-full h-full opacity-40"
                  style={{
                    background:
                      'conic-gradient(from 330deg at 50% 50%, rgba(0,229,255,0.7) 0deg, transparent 60deg)',
                    clipPath: 'polygon(50% 50%, 0% 0%, 100% 0%)',
                  }}
                />
              </div>

              <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_#00e5ff] relative z-10 flex items-center justify-center">
                <Navigation2
                  className="w-2.5 h-2.5 text-slate-950 fill-slate-950"
                  style={{
                    transform: `rotate(${mapMode === 'north' ? currentYaw : 0}deg)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Radar Range Scale Controls */}
        <div className="flex items-center justify-between px-2 py-1.5 bg-[#0a1628] rounded-xl border border-[#142640] mb-3">
          <span className="text-[10px] font-mono text-slate-400 uppercase">
            Radar Scale:
          </span>
          <div className="flex items-center gap-1">
            {[
              { val: 50, label: '50M' },
              { val: 200, label: '200M' },
              { val: 1000, label: '1KM' },
              { val: 15000, label: '15KM' },
            ].map((scale) => (
              <button
                key={scale.val}
                onClick={() => {
                  triggerHaptic('light');
                  setRadarRange(scale.val);
                }}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                  radarRange === scale.val
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                    : 'bg-[#071322] text-slate-400 hover:text-white'
                }`}
              >
                {scale.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Context List based on active layer */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-48">
          {activeLayer === 'coins' && (
            <>
              <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                Nearby Targets ({uncollectedCoins.length})
              </div>

              {uncollectedCoins.map((coin) => {
                const isSelected = activeCoin && activeCoin.id === coin.id;
                const dir = getCompassDirection(coin.bearing);
                const durability = getRemainingDurability(coin);

                return (
                  <div
                    key={coin.id}
                    onClick={() => handleCoinClick(coin)}
                    className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0d2a47] to-[#071829] border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                        : 'bg-[#0a1628] border-[#142640] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>{coin.name}</span>
                            {isSelected && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 font-black">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {dir} {coin.bearing}° · +{coin.value} PTS
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-extrabold font-mono text-cyan-300">
                          {formatCoinDistance(coin.distance)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {activeLayer === 'hunters' && (
            <>
              <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>Active Hunters within 5km ({nearbyHunters.length})</span>
                <span className="text-[9px] text-slate-400">Live Network</span>
              </div>

              {nearbyHunters.map((hunter) => (
                <div
                  key={hunter.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    setSelectedHunter(hunter);
                  }}
                  className="p-3 rounded-2xl bg-[#0a1628] border border-[#142640] hover:border-amber-500/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-amber-950/60 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold text-xs font-mono">
                      L{hunter.level}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono flex items-center gap-1.5">
                        <span>{hunter.callsign}</span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {hunter.status}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        Seen {hunter.lastSeenMin}m ago · {hunter.coinsCollected} Coins
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold font-mono text-amber-300">
                      {hunter.distanceKm} km
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendPing(hunter);
                      }}
                      className="mt-1 px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950 text-[9px] font-mono font-bold flex items-center gap-1"
                    >
                      <Send className="w-2.5 h-2.5" />
                      <span>SALUTE</span>
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeLayer === 'heatmap' && (
            <>
              <div className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider px-1 flex items-center justify-between">
                <span>🔥 High-Value Drop Sectors</span>
                <span className="text-[9px] text-rose-300">Real-Time Density</span>
              </div>

              {heatmapZones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-3 rounded-2xl bg-[#0a1628] border border-rose-500/30 hover:border-rose-400 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-400 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 animate-bounce" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white font-mono">
                        {zone.sectorName}
                      </div>
                      <div className="text-[10px] font-mono text-rose-300/80 font-bold">
                        {zone.multiplier} · {zone.activeSpawnsCount} Drops Active
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-1 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300">
                      {zone.density}
                    </span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Ping Success Toast */}
        {pingSuccess && (
          <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-mono text-center flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{pingSuccess}</span>
          </div>
        )}

        {/* Hunter Details Inspection Modal / Drawer */}
        {selectedHunter && (
          <div className="mt-3 p-3.5 rounded-2xl bg-[#0b1b30] border border-cyan-500/50 flex flex-col gap-2 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-[#183152] pb-2">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold font-mono text-white">
                  {selectedHunter.callsign}
                </span>
                <span className="text-[9px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                  Level {selectedHunter.level}
                </span>
              </div>
              <button
                onClick={() => setSelectedHunter(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300">
              <div>Distance: <span className="font-bold text-white">{selectedHunter.distanceKm} km</span></div>
              <div>Status: <span className="font-bold text-cyan-400">{selectedHunter.status}</span></div>
              <div>Coins Collected: <span className="font-bold text-amber-400">{selectedHunter.coinsCollected} ELZR</span></div>
              <div>Last Active: <span className="font-bold text-slate-300">{selectedHunter.lastSeenMin}m ago</span></div>
            </div>

            <button
              onClick={() => handleSendPing(selectedHunter)}
              className="mt-1 w-full py-2 rounded-xl bg-amber-500 text-slate-950 font-bold font-mono text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.4)] active:scale-95 transition-transform"
            >
              <Send className="w-3.5 h-3.5 text-slate-950" />
              <span>SEND RADAR SALUTE & PING</span>
            </button>
          </div>
        )}

        {/* Close or Action Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="mt-3 w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer hover:brightness-110"
        >
          TARGET IN AR CAMERA
        </button>
      </div>
    </div>
  );
};
