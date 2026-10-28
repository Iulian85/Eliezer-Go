import React, { useState, useEffect, useMemo } from 'react';
import {
  Trophy,
  Medal,
  Crown,
  Sparkles,
  MapPin,
  Globe2,
  Flame,
  Search,
  RefreshCw,
  Share2,
  Crosshair,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

export interface HunterRanking {
  id: string;
  rank: number;
  username: string;
  city: string;
  country: string;
  elzrCollected: number;
  points: number;
  streakDays: number;
  tierTitle: string;
  avatarColor: string;
  isUser?: boolean;
  recentGain?: number;
}

interface LeaderboardTabProps {
  userElzrCollected: number;
  userCity: string;
  userName?: string;
  onNavigateToHunt: () => void;
  onOpenHunterCard?: () => void;
}

const BASE_GLOBAL_HUNTERS: Omit<HunterRanking, 'rank'>[] = [
  {
    id: 'h_1',
    username: 'Satoshi_Hunter',
    city: 'Munich',
    country: 'DE',
    elzrCollected: 384,
    points: 38400,
    streakDays: 24,
    tierTitle: 'Apex Master',
    avatarColor: 'from-amber-400 to-yellow-600',
    recentGain: 3,
  },
  {
    id: 'h_2',
    username: 'Ton_Valkyrie',
    city: 'Gersthofen',
    country: 'DE',
    elzrCollected: 312,
    points: 31200,
    streakDays: 19,
    tierTitle: 'Pioneer Scout',
    avatarColor: 'from-cyan-400 to-blue-600',
    recentGain: 1,
  },
  {
    id: 'h_3',
    username: 'Gram_Titan',
    city: 'Augsburg',
    country: 'DE',
    elzrCollected: 278,
    points: 27800,
    streakDays: 16,
    tierTitle: 'Speed Hunter',
    avatarColor: 'from-emerald-400 to-teal-600',
    recentGain: 2,
  },
  {
    id: 'h_4',
    username: 'CyberGhost_99',
    city: 'Berlin',
    country: 'DE',
    elzrCollected: 245,
    points: 24500,
    streakDays: 14,
    tierTitle: 'Night Stalker',
    avatarColor: 'from-purple-400 to-indigo-600',
  },
  {
    id: 'h_5',
    username: 'AR_Seeker_X',
    city: 'Gersthofen',
    country: 'DE',
    elzrCollected: 198,
    points: 19800,
    streakDays: 12,
    tierTitle: 'Urban Tracker',
    avatarColor: 'from-rose-400 to-pink-600',
  },
  {
    id: 'h_6',
    username: 'Bavaria_King',
    city: 'Nuremberg',
    country: 'DE',
    elzrCollected: 164,
    points: 16400,
    streakDays: 9,
    tierTitle: 'Elite Ranger',
    avatarColor: 'from-sky-400 to-cyan-600',
  },
  {
    id: 'h_7',
    username: 'CryptoDoge_X',
    city: 'Gersthofen',
    country: 'DE',
    elzrCollected: 132,
    points: 13200,
    streakDays: 8,
    tierTitle: 'Coin Scout',
    avatarColor: 'from-yellow-400 to-amber-600',
  },
  {
    id: 'h_8',
    username: 'Quantum_Volt',
    city: 'Frankfurt',
    country: 'DE',
    elzrCollected: 115,
    points: 11500,
    streakDays: 7,
    tierTitle: 'Bounty Hunter',
    avatarColor: 'from-violet-400 to-purple-600',
  },
  {
    id: 'h_9',
    username: 'NeoAugsburg',
    city: 'Augsburg',
    country: 'DE',
    elzrCollected: 94,
    points: 9400,
    streakDays: 5,
    tierTitle: 'Collector',
    avatarColor: 'from-teal-400 to-emerald-600',
  },
  {
    id: 'h_10',
    username: 'Shadow_Ranger',
    city: 'Munich',
    country: 'DE',
    elzrCollected: 76,
    points: 7600,
    streakDays: 4,
    tierTitle: 'Explorer',
    avatarColor: 'from-slate-400 to-slate-600',
  },
  {
    id: 'h_11',
    username: 'Vortex_Hunter',
    city: 'Hamburg',
    country: 'DE',
    elzrCollected: 62,
    points: 6200,
    streakDays: 3,
    tierTitle: 'Seeker',
    avatarColor: 'from-blue-400 to-indigo-600',
  },
  {
    id: 'h_12',
    username: 'PixelRider',
    city: 'Gersthofen',
    country: 'DE',
    elzrCollected: 48,
    points: 4800,
    streakDays: 2,
    tierTitle: 'Novice',
    avatarColor: 'from-amber-400 to-orange-600',
  },
];

const LIVE_ACTIVITY_EVENTS = [
  '⚡ Just now: @Ton_Valkyrie hunted +1 Rare ELZR in Gersthofen!',
  '⚡ 2m ago: @Satoshi_Hunter collected +1 Landmark ELZR (+250 PTS)',
  '⚡ 4m ago: @Gram_Titan claimed a Merchant Drop in Augsburg',
  '⚡ 6m ago: @CyberGhost_99 locked target on 24K Gold Coin in Berlin',
];

export const LeaderboardTab: React.FC<LeaderboardTabProps> = ({
  userElzrCollected,
  userCity,
  userName = 'Hunter',
  onNavigateToHunt,
  onOpenHunterCard,
}) => {
  const [activeCategory, setActiveCategory] = useState<'global' | 'city' | 'sprint'>('global');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTickerIndex, setActiveTickerIndex] = useState(0);

  // Rotate simulated live ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTickerIndex((prev) => (prev + 1) % LIVE_ACTIVITY_EVENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = () => {
    triggerHaptic('medium');
    playSound.buttonClick();
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      triggerHaptic('success');
    }, 800);
  };

  // Rank computation including user
  const { rankedList, userRank, nextRankDiff } = useMemo(() => {
    const userEntry: Omit<HunterRanking, 'rank'> = {
      id: 'current_user',
      username: `@${userName} (You)`,
      city: userCity || 'Gersthofen',
      country: 'DE',
      elzrCollected: userElzrCollected,
      points: userElzrCollected * 100,
      streakDays: 3,
      tierTitle:
        userElzrCollected >= 100
          ? 'Elite Master'
          : userElzrCollected >= 25
          ? 'Urban Scout'
          : 'Active Hunter',
      avatarColor: 'from-cyan-400 to-emerald-400',
      isUser: true,
    };

    let list = [...BASE_GLOBAL_HUNTERS];

    if (activeCategory === 'city') {
      const targetCity = (userCity || 'Gersthofen').toLowerCase();
      list = list.filter(
        (h) =>
          h.city.toLowerCase() === targetCity ||
          h.city.toLowerCase() === 'gersthofen' ||
          h.city.toLowerCase() === 'augsburg'
      );
    } else if (activeCategory === 'sprint') {
      // Sort with recent gain bias
      list = list.map((h) => ({
        ...h,
        elzrCollected: Math.round(h.elzrCollected * 0.2 + (h.recentGain || 1) * 8),
      }));
    }

    // Add user and sort descending
    const all = [...list, userEntry].sort((a, b) => b.elzrCollected - a.elzrCollected);

    const fullRanked: HunterRanking[] = all.map((h, i) => ({
      ...h,
      rank: i + 1,
    }));

    // Search filter
    const filtered = searchQuery.trim()
      ? fullRanked.filter(
          (h) =>
            h.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            h.city.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : fullRanked;

    const userObj = fullRanked.find((h) => h.isUser);
    const uRank = userObj ? userObj.rank : 99;

    // Difference to next rank
    let diff = 1;
    if (userObj && uRank > 1) {
      const nextAhead = fullRanked[uRank - 2];
      if (nextAhead) {
        diff = Math.max(1, nextAhead.elzrCollected - userObj.elzrCollected + 1);
      }
    }

    return {
      rankedList: filtered,
      userRank: uRank,
      nextRankDiff: diff,
    };
  }, [userElzrCollected, userCity, userName, activeCategory, searchQuery]);

  const top3 = rankedList.slice(0, 3);
  const remaining = rankedList.slice(3);

  return (
    <div className="flex flex-col px-4 pt-5 pb-32 max-w-md mx-auto space-y-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 tracking-wider uppercase">
              REAL-TIME RANKINGS
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
            Leaderboard
          </h1>
        </div>

        {/* Header Actions: Refresh & Share */}
        <div className="flex items-center gap-2">
          {onOpenHunterCard && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onOpenHunterCard();
              }}
              title="Share Rank Card"
              className="w-10 h-10 rounded-full bg-[#0a1628] border border-[#142640] text-cyan-400 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleRefresh}
            title="Refresh Leaderboard"
            className="w-10 h-10 rounded-full bg-[#0a1628] border border-[#142640] text-slate-300 hover:text-white flex items-center justify-center active:scale-95 transition-all shadow-md"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Activity Ticker */}
      <div className="w-full bg-[#071322] border border-[#132845] rounded-2xl p-2.5 flex items-center gap-2 overflow-hidden shadow-inner">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 fill-cyan-400" />
        <span className="text-[11px] font-mono text-cyan-300/90 truncate animate-in fade-in duration-300">
          {LIVE_ACTIVITY_EVENTS[activeTickerIndex]}
        </span>
      </div>

      {/* Category Tabs: Global, City, 24h Sprint */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#0a1628] rounded-2xl border border-[#142640]">
        {[
          { id: 'global', label: 'GLOBAL', icon: Globe2 },
          { id: 'city', label: `${(userCity || 'CITY').slice(0, 8)}`, icon: MapPin },
          { id: 'sprint', label: '24H HOT', icon: Flame },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveCategory(tab.id as 'global' | 'city' | 'sprint');
              }}
              className={`py-2 px-2 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="uppercase">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search hunters or cities..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors font-mono"
        />
      </div>

      {/* Top 3 Podium Cards */}
      {top3.length >= 3 && !searchQuery && (
        <div className="grid grid-cols-3 gap-2 pt-2 items-end">
          {/* #2 Rank Silver */}
          <div
            className={`rounded-3xl p-3 flex flex-col items-center text-center relative border transition-all ${
              top3[1].isUser
                ? 'bg-[#0f2d4a] border-cyan-400 shadow-[0_0_18px_rgba(0,229,255,0.3)]'
                : 'bg-[#0a1628] border-slate-700/80 shadow-lg'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-300 text-slate-950 font-black text-xs font-mono flex items-center justify-center shadow mb-2">
              2
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-400 to-slate-200 text-slate-950 font-black text-xs flex items-center justify-center shadow-md mb-1.5">
              {top3[1].username.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top3[1].username}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-full">
              {top3[1].city}
            </div>
            <div className="text-xs font-mono font-black text-cyan-300 mt-2">
              {top3[1].elzrCollected} ELZR
            </div>
          </div>

          {/* #1 Rank Gold */}
          <div
            className={`rounded-3xl p-3.5 flex flex-col items-center text-center relative border transition-all -translate-y-2.5 ${
              top3[0].isUser
                ? 'bg-[#1b2f48] border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-b from-[#1c1809] to-[#0c1626] border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            }`}
          >
            <Crown className="w-5 h-5 text-amber-400 mb-1 animate-bounce" />
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 font-black text-sm font-mono flex items-center justify-center shadow-md mb-2">
              1
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg mb-1.5">
              {top3[0].username.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top3[0].username}
            </div>
            <div className="text-[10px] font-mono text-amber-300/90 truncate max-w-full">
              {top3[0].city}
            </div>
            <div className="text-sm font-mono font-black text-amber-400 mt-2">
              {top3[0].elzrCollected} ELZR
            </div>
          </div>

          {/* #3 Rank Bronze */}
          <div
            className={`rounded-3xl p-3 flex flex-col items-center text-center relative border transition-all ${
              top3[2].isUser
                ? 'bg-[#0f2d4a] border-cyan-400 shadow-[0_0_18px_rgba(0,229,255,0.3)]'
                : 'bg-[#0a1628] border-amber-900/60 shadow-lg'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-amber-700 text-amber-100 font-black text-xs font-mono flex items-center justify-center shadow mb-2">
              3
            </div>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-800 text-amber-100 font-black text-xs flex items-center justify-center shadow-md mb-1.5">
              {top3[2].username.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top3[2].username}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-full">
              {top3[2].city}
            </div>
            <div className="text-xs font-mono font-black text-cyan-300 mt-2">
              {top3[2].elzrCollected} ELZR
            </div>
          </div>
        </div>
      )}

      {/* Remaining Rankings List */}
      <div className="space-y-2">
        {(searchQuery ? rankedList : remaining).map((hunter) => {
          const isUser = hunter.isUser;

          return (
            <div
              key={hunter.id}
              className={`p-3 rounded-2xl border transition-all flex items-center justify-between ${
                isUser
                  ? 'bg-gradient-to-r from-[#0d2a47] to-[#08182b] border-cyan-400 shadow-[0_0_18px_rgba(0,229,255,0.25)]'
                  : 'bg-[#0a1628] border-[#142640] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank number badge */}
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
                    isUser
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'bg-[#081220] text-slate-400 border border-slate-800'
                  }`}
                >
                  #{hunter.rank}
                </div>

                {/* Avatar */}
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${hunter.avatarColor} flex items-center justify-center text-slate-950 font-black text-xs shadow-sm`}
                >
                  {hunter.username.replace('@', '').slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs font-bold ${
                        isUser ? 'text-cyan-300' : 'text-white'
                      }`}
                    >
                      {hunter.username}
                    </span>
                    {isUser && (
                      <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-cyan-400 text-slate-950 uppercase">
                        YOU
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{hunter.city}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">{hunter.tierTitle}</span>
                  </div>
                </div>
              </div>

              {/* Coins & Streak */}
              <div className="text-right">
                <div
                  className={`text-sm font-mono font-black ${
                    isUser ? 'text-cyan-300' : 'text-white'
                  }`}
                >
                  {hunter.elzrCollected}
                </div>
                <div className="text-[9px] font-mono text-slate-500 uppercase">
                  ELZR COINS
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Persistent User Bottom Progress Card */}
      <div className="fixed bottom-20 inset-x-4 max-w-md mx-auto z-30">
        <div className="bg-[#081526]/95 backdrop-blur-md border border-cyan-500/50 rounded-2xl p-3 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-400 text-slate-950 font-black font-mono text-sm flex items-center justify-center shadow-[0_0_10px_#00e5ff]">
              #{userRank}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Your Live Standing</span>
                <span className="text-[9px] font-mono px-1 rounded bg-cyan-400 text-slate-950 font-black">
                  YOU
                </span>
              </div>
              <div className="text-[11px] font-mono text-cyan-300">
                {userElzrCollected} ELZR ·{' '}
                <span className="text-amber-300">+{nextRankDiff} to climb</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('heavy');
              onNavigateToHunt();
            }}
            className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>HUNT NOW</span>
          </button>
        </div>
      </div>
    </div>
  );
};
