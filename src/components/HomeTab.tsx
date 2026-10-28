import React, { useState } from 'react';
import { UserState } from '../types';
import { Zap, Globe2, Users, Radar, Sparkles, Navigation, RefreshCw, Share2, Trophy } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { DailyStreakCard } from './DailyStreakCard';

interface HomeTabProps {
  userState: UserState;
  onUpdateCity: (newCity: string) => void;
  onNavigateToHunt: () => void;
  onNavigateToRanks?: () => void;
  onNavigateToWallet?: () => void;
  onOpenDailyCheckIn: () => void;
  onOpenHunterCard?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userState,
  onUpdateCity,
  onNavigateToHunt,
  onNavigateToRanks,
  onNavigateToWallet,
  onOpenDailyCheckIn,
  onOpenHunterCard,
}) => {
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);

  const detectLocation = () => {
    triggerHaptic('medium');
    setIsDetectingGPS(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            onUpdateCity('GPS LOCATION');
          } catch {
            onUpdateCity('GERSTHOFEN');
          } finally {
            setIsDetectingGPS(false);
          }
        },
        () => {
          setIsDetectingGPS(false);
        },
        { timeout: 7000 }
      );
    } else {
      setIsDetectingGPS(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 px-4 pt-6 pb-28 max-w-md mx-auto">
      {/* Top Status Pill: HOME ONLINE */}
      <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#08172b] border border-cyan-500/40 text-cyan-400 text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.15)]">
        <Zap className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
        <span className="font-semibold">HOME ONLINE</span>
      </div>

      {/* Daily Consecutive Streak Reward Card */}
      <DailyStreakCard
        dailyCheckIn={userState.dailyCheckIn}
        onOpenModal={onOpenDailyCheckIn}
      />

      {/* Card 1: ELZR COLLECTED */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
              ELZR COLLECTED
            </div>
            <div className="text-6xl font-extrabold text-white tracking-tight my-2 font-sans">
              {userState.elzrCollected}
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {onNavigateToWallet && (
              <button
                onClick={() => {
                  triggerHaptic('light');
                  onNavigateToWallet();
                }}
                title="View Hunter Milestones & Badges"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-amber-950/40 border border-amber-500/40 text-amber-300 hover:text-white text-xs font-mono font-bold tracking-wider active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {Object.values(userState.achievements || {}).filter((a) => a.unlocked).length} / 11
                </span>
              </button>
            )}

            {/* Share Status Card Button */}
            {onOpenHunterCard && (
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  onOpenHunterCard();
                }}
                title="Generate Hunter Status Card"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0d233d] border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono font-bold tracking-wider active:scale-95 transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>STATUS CARD</span>
              </button>
            )}
          </div>
        </div>
        <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mt-4 flex items-center justify-between">
          <span>YOUR TOTAL SAVED ON THIS DEVICE</span>
          {onOpenHunterCard && (
            <button
              onClick={() => {
                triggerHaptic('light');
                onOpenHunterCard();
              }}
              className="text-cyan-400 hover:text-cyan-300 font-bold lowercase text-[11px] font-mono"
            >
              share story ➔
            </button>
          )}
        </div>
      </div>

      {/* Card 2: GPS CITY */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-cyan-400 tracking-wider uppercase mb-1 font-mono">
              GPS CITY
            </div>
            <div className="text-3xl font-extrabold text-white tracking-tight my-1 uppercase font-sans">
              {userState.city}
            </div>
          </div>
          <button
            onClick={detectLocation}
            title="Update GPS Location"
            className="w-12 h-12 rounded-full bg-[#0f2a4a] border border-cyan-500/30 flex items-center justify-center text-cyan-400 active:scale-95 transition-transform"
          >
            {isDetectingGPS ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Globe2 className="w-6 h-6" />
            )}
          </button>
        </div>
        <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mt-4 flex items-center justify-between">
          <span>READ FROM PHONE LOCATION</span>
          <button
            onClick={detectLocation}
            className="text-cyan-400 hover:text-cyan-300 font-bold lowercase text-[11px]"
          >
            refresh
          </button>
        </div>
      </div>

      {/* Row: GLOBAL HUNTERS & ACTIVE HUNTERS */}
      <div className="w-full grid grid-cols-2 gap-3.5">
        {/* Left: Global Hunters */}
        <div className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 relative shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-amber-400 tracking-wider uppercase font-mono">
              GLOBAL HUNTERS
            </span>
            <div className="w-7 h-7 rounded-full bg-[#2a2416] border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight my-1">
            {userState.globalHunters}
          </div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-2">
            IN NETWORK
          </div>
        </div>

        {/* Right: Active Hunters */}
        <div className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 relative shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-cyan-400 tracking-wider uppercase font-mono">
              ACTIVE HUNTERS
            </span>
            <div className="w-7 h-7 rounded-full bg-[#0b2b47] border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Radar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-4xl font-extrabold text-white tracking-tight my-1">
            {userState.activeHunters}
          </div>
          <div className="text-[10px] font-mono tracking-wider text-slate-400 uppercase mt-2">
            LAST 15 MIN
          </div>
        </div>
      </div>

      {/* Card 5: ELZR IN CITY */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 relative overflow-hidden shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-bold text-rose-400 tracking-wider uppercase mb-1 font-mono">
              ELZR IN CITY
            </div>
            <div className="text-5xl font-extrabold text-white tracking-tight my-1 font-sans">
              {userState.elzrInCity}
            </div>
          </div>
          <div className="w-11 h-11 rounded-full bg-[#351522] border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
        <div className="text-[11px] font-mono tracking-wider text-slate-400 uppercase mt-4 flex items-center justify-between">
          <span>AVAILABLE INVENTORY FOR {userState.city}</span>
          <button
            onClick={onNavigateToHunt}
            className="text-cyan-400 hover:text-cyan-300 font-bold lowercase text-[11px] flex items-center gap-1"
          >
            <span>hunt now</span>
            <Navigation className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
