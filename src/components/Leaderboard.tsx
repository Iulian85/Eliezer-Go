import React, { useState, useMemo } from 'react';
import { Trophy, Medal, Crown, Sparkles, MapPin, Globe, ChevronRight, UserCheck } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

export interface LeaderboardHunter {
  id: string;
  rank: number;
  username: string;
  city: string;
  elzrCollected: number;
  badgeTitle: string;
  avatarColor: string;
  isUser?: boolean;
}

interface LeaderboardProps {
  userElzrCollected: number;
  userCity: string;
  onNavigateToHunt?: () => void;
  onNavigateToRanks?: () => void;
}

const GLOBAL_BASE_HUNTERS: Omit<LeaderboardHunter, 'rank'>[] = [
  {
    id: 'h_1',
    username: 'Satoshi_Hunter',
    city: 'Munich',
    elzrCollected: 384,
    badgeTitle: 'Apex Master',
    avatarColor: 'from-amber-400 to-yellow-600',
  },
  {
    id: 'h_2',
    username: 'Ton_Valkyrie',
    city: 'Gersthofen',
    elzrCollected: 312,
    badgeTitle: 'Pioneer Scout',
    avatarColor: 'from-cyan-400 to-blue-600',
  },
  {
    id: 'h_3',
    username: 'Gram_Titan',
    city: 'Augsburg',
    elzrCollected: 278,
    badgeTitle: 'Speed Hunter',
    avatarColor: 'from-emerald-400 to-teal-600',
  },
  {
    id: 'h_4',
    username: 'CyberGhost_99',
    city: 'Berlin',
    elzrCollected: 245,
    badgeTitle: 'Night Stalker',
    avatarColor: 'from-purple-400 to-indigo-600',
  },
  {
    id: 'h_5',
    username: 'AR_Seeker_X',
    city: 'Gersthofen',
    elzrCollected: 198,
    badgeTitle: 'Urban Tracker',
    avatarColor: 'from-rose-400 to-pink-600',
  },
  {
    id: 'h_6',
    username: 'Bavaria_King',
    city: 'Nuremberg',
    elzrCollected: 164,
    badgeTitle: 'Elite Ranger',
    avatarColor: 'from-sky-400 to-cyan-600',
  },
  {
    id: 'h_7',
    username: 'CryptoDoge_X',
    city: 'Gersthofen',
    elzrCollected: 132,
    badgeTitle: 'Coin Scout',
    avatarColor: 'from-yellow-400 to-amber-600',
  },
  {
    id: 'h_8',
    username: 'Quantum_Volt',
    city: 'Frankfurt',
    elzrCollected: 115,
    badgeTitle: 'Bounty Hunter',
    avatarColor: 'from-violet-400 to-purple-600',
  },
  {
    id: 'h_9',
    username: 'NeoAugsburg',
    city: 'Augsburg',
    elzrCollected: 94,
    badgeTitle: 'Collector',
    avatarColor: 'from-teal-400 to-emerald-600',
  },
  {
    id: 'h_10',
    username: 'Shadow_Ranger',
    city: 'Munich',
    elzrCollected: 76,
    badgeTitle: 'Explorer',
    avatarColor: 'from-slate-400 to-slate-600',
  },
];

export const Leaderboard: React.FC<LeaderboardProps> = ({
  userElzrCollected,
  userCity,
  onNavigateToHunt,
  onNavigateToRanks,
}) => {
  const [scope, setScope] = useState<'global' | 'local'>('global');

  // Compute dynamic leaderboard including the user's live score
  const { top10, userRank } = useMemo(() => {
    // Current user representation
    const userHunter: Omit<LeaderboardHunter, 'rank'> = {
      id: 'current_user',
      username: 'You (Hunter)',
      city: userCity || 'Gersthofen',
      elzrCollected: userElzrCollected,
      badgeTitle: userElzrCollected >= 50 ? 'Elite Hunter' : userElzrCollected > 0 ? 'Active Scout' : 'Recruit',
      avatarColor: 'from-cyan-400 to-emerald-400',
      isUser: true,
    };

    // Filter by city if in local mode
    let list = [...GLOBAL_BASE_HUNTERS];
    if (scope === 'local') {
      const cityFilter = (userCity || 'Gersthofen').toLowerCase();
      list = list.filter((h) => h.city.toLowerCase() === cityFilter || h.city.toLowerCase() === 'gersthofen' || h.city.toLowerCase() === 'augsburg');
    }

    // Add user and sort by elzrCollected descending
    const all = [...list, userHunter].sort((a, b) => b.elzrCollected - a.elzrCollected);

    // Assign 1-indexed ranks
    const ranked: LeaderboardHunter[] = all.map((item, index) => ({
      ...item,
      rank: index + 1,
    }));

    const userEntry = ranked.find((h) => h.isUser);
    const calculatedUserRank = userEntry ? userEntry.rank : 99;

    // Return top 10
    return {
      top10: ranked.slice(0, 10),
      userRank: calculatedUserRank,
    };
  }, [userElzrCollected, userCity, scope]);

  const handleScopeChange = (newScope: 'global' | 'local') => {
    if (newScope !== scope) {
      triggerHaptic('light');
      playSound.buttonClick();
      setScope(newScope);
    }
  };

  return (
    <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-2xl relative overflow-hidden">
      {/* Glow behind */}
      <div className="absolute top-0 right-10 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#142640]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <Trophy className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white font-sans tracking-wide">
              TOP 10 HUNTERS
            </h2>
            <p className="text-[10px] font-mono text-cyan-400">
              Ranked by Collected ELZR Coins
            </p>
          </div>
        </div>

        {/* Global vs Local city toggle */}
        <div className="flex items-center bg-[#071322] border border-[#142640] p-1 rounded-xl">
          <button
            onClick={() => handleScopeChange('global')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              scope === 'global'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            GLOBAL
          </button>
          <button
            onClick={() => handleScopeChange('local')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              scope === 'local'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            CITY
          </button>
        </div>
      </div>

      {/* Top 3 Podium Highlights */}
      <div className="grid grid-cols-3 gap-2 my-4 pt-1">
        {/* Rank 2 (Silver) */}
        {top10[1] && (
          <div
            className={`rounded-2xl p-2.5 flex flex-col items-center text-center relative border transition-all ${
              top10[1].isUser
                ? 'bg-[#0f2d4a] border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-[#081322] border-slate-700/80'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-300 text-slate-950 flex items-center justify-center font-black text-xs font-mono shadow-md mb-1.5">
              2
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top10[1].username}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-full">
              {top10[1].city}
            </div>
            <div className="text-xs font-mono font-extrabold text-cyan-300 mt-1">
              {top10[1].elzrCollected} ELZR
            </div>
          </div>
        )}

        {/* Rank 1 (Gold Crown) */}
        {top10[0] && (
          <div
            className={`rounded-2xl p-3 flex flex-col items-center text-center relative border transition-all -translate-y-1.5 ${
              top10[0].isUser
                ? 'bg-[#1a2f47] border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'bg-gradient-to-b from-[#1c180a] to-[#0c1424] border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400 mb-0.5 animate-bounce" />
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 flex items-center justify-center font-black text-xs font-mono shadow-md mb-1">
              1
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top10[0].username}
            </div>
            <div className="text-[10px] font-mono text-amber-300/80 truncate max-w-full">
              {top10[0].city}
            </div>
            <div className="text-sm font-mono font-black text-amber-400 mt-1">
              {top10[0].elzrCollected} ELZR
            </div>
          </div>
        )}

        {/* Rank 3 (Bronze) */}
        {top10[2] && (
          <div
            className={`rounded-2xl p-2.5 flex flex-col items-center text-center relative border transition-all ${
              top10[2].isUser
                ? 'bg-[#0f2d4a] border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                : 'bg-[#081322] border-amber-800/60'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-amber-700 text-amber-100 flex items-center justify-center font-black text-xs font-mono shadow-md mb-1.5">
              3
            </div>
            <div className="text-xs font-bold text-white truncate max-w-full">
              {top10[2].username}
            </div>
            <div className="text-[10px] font-mono text-slate-400 truncate max-w-full">
              {top10[2].city}
            </div>
            <div className="text-xs font-mono font-extrabold text-cyan-300 mt-1">
              {top10[2].elzrCollected} ELZR
            </div>
          </div>
        )}
      </div>

      {/* Ranks 4 to 10 List */}
      <div className="space-y-2 mt-2">
        {top10.slice(3).map((hunter) => {
          const isUser = hunter.isUser;

          return (
            <div
              key={hunter.id}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                isUser
                  ? 'bg-gradient-to-r from-[#0d2a47] to-[#08182b] border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                  : 'bg-[#081220] border-[#162a47] hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Rank number badge */}
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    isUser
                      ? 'bg-cyan-400 text-slate-950 font-black'
                      : 'bg-[#0c1a2e] text-slate-400 border border-slate-800'
                  }`}
                >
                  {hunter.rank}
                </div>

                {/* Avatar Initial */}
                <div
                  className={`w-8 h-8 rounded-xl bg-gradient-to-br ${hunter.avatarColor} flex items-center justify-center text-slate-950 font-black text-xs shadow-sm`}
                >
                  {hunter.username.slice(0, 2).toUpperCase()}
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
                      <span className="text-[8px] font-mono font-black px-1 rounded bg-cyan-400 text-slate-950 uppercase">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-rose-400" />
                    <span>{hunter.city}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-500">{hunter.badgeTitle}</span>
                  </div>
                </div>
              </div>

              {/* Coins Amount */}
              <div className="text-right">
                <div
                  className={`text-xs font-mono font-extrabold ${
                    isUser ? 'text-cyan-300' : 'text-white'
                  }`}
                >
                  {hunter.elzrCollected}
                </div>
                <div className="text-[8px] font-mono text-slate-500 uppercase">
                  ELZR
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* User Rank Sticky Banner if outside top 10 */}
      {userRank > 10 && (
        <div className="mt-3 pt-3 border-t border-[#142640] flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-[#0d2a47] to-[#08182b] border border-cyan-500/40 shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-400 text-slate-950 font-black font-mono text-xs flex items-center justify-center">
              #{userRank}
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Your Ranking</span>
                <span className="text-[8px] font-mono px-1 rounded bg-cyan-400 text-slate-950 font-black">
                  YOU
                </span>
              </div>
              <div className="text-[10px] font-mono text-cyan-300">
                {userElzrCollected} ELZR Collected
              </div>
            </div>
          </div>

          {onNavigateToHunt && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                onNavigateToHunt();
              }}
              className="py-1.5 px-3 rounded-xl bg-cyan-400 text-slate-950 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span>CLIMB RANK</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Button to navigate to full dedicated Ranks tab */}
      {onNavigateToRanks && (
        <button
          onClick={() => {
            triggerHaptic('light');
            playSound.buttonClick();
            onNavigateToRanks();
          }}
          className="w-full mt-3 py-2 px-3 rounded-xl bg-[#08182b] hover:bg-[#0c2440] border border-[#142640] hover:border-cyan-500/40 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-bold tracking-wider uppercase flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span>VIEW FULL LEADERBOARD & RECENT ACTIVITY</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
