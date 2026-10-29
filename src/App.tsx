/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserState, AdCampaign, ARCoinTarget, AchievementDefinition } from './types';
import { loadUserState, saveUserState, loadCampaigns, saveCampaigns } from './utils/storage';
import { initTelegramApp, triggerHaptic } from './utils/telegram';
import { getTodayDateString, getYesterdayDateString, StreakTier } from './utils/dailyRewards';
import { Navigation, NavTab } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { HuntTab } from './components/HuntTab';
import { ShopTab } from './components/ShopTab';
import { FrensTab } from './components/FrensTab';
import { WalletTab } from './components/WalletTab';
import { LeaderboardTab } from './components/LeaderboardTab';
import { ARView } from './components/ARView';
import { DailyCheckInModal } from './components/DailyCheckInModal';
import { HunterCardModal } from './components/HunterCardModal';
import { AdminTab } from './components/AdminTab';
import { BiometricAuthGate } from './components/BiometricAuthGate';
import { soundManager, playSound } from './utils/audio';
import { checkAchievements } from './utils/achievements';
import confetti from 'canvas-confetti';
import { Volume2, VolumeX, Trophy, Maximize, Minimize, ShieldAlert, Megaphone } from 'lucide-react';
import {
  isFullscreen as checkFullscreen,
  toggleFullscreen,
  subscribeFullscreenChange,
} from './utils/fullscreen';
import { syncHunterToService, fetchAccountBalance } from './lib/api';
import { getIsAdminModeVisible, isWalletAdminAuthorized } from './utils/adminAuth';
import { useTonAddress } from '@tonconnect/ui-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('home');
  const [userState, setUserState] = useState<UserState>(() => loadUserState());
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(() => loadCampaigns());
  const [isARActive, setIsARActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const [isHunterCardOpen, setIsHunterCardOpen] = useState<boolean>(false);
  const [telegramUser, setTelegramUser] = useState<{ id: number; first_name?: string; username?: string } | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());
  const [achievementToast, setAchievementToast] = useState<AchievementDefinition | null>(null);
  const [isFs, setIsFs] = useState<boolean>(() => checkFullscreen());

  useEffect(() => {
    if (!telegramUser?.id || isARActive) return;
    let active = true;
    void fetchAccountBalance().then(account => {
      if (active && account) setUserState(previous => ({ ...previous, elzrCollected: account.balance,
        points: { ...previous.points, gameplay: account.score } }));
    });
    return () => { active = false; };
  }, [telegramUser?.id, isARActive]);

  // Biometric Gatekeeper State - requires biometric fingerprint scan on launch
  const [biometricHash, setBiometricHash] = useState<string>(() => {
    return localStorage.getItem('elzr_biometric_hash') || '';
  });
  const [isBiometricGateOpen, setIsBiometricGateOpen] = useState<boolean>(() => {
    return false;
  });

  // Admin Visibility & Tonkeeper Address Detection
  const tonAddress = useTonAddress();
  const [isAdminVisible, setIsAdminVisible] = useState<boolean>(() => isWalletAdminAuthorized(tonAddress));

  // Whenever user connects Tonkeeper in Wallet Tab, automatically link biometric hash + wallet address through the API
  useEffect(() => {
    if (tonAddress) {
      const bioHash = biometricHash || localStorage.getItem('elzr_biometric_hash') || undefined;

      if (telegramUser?.id) {
        syncHunterToService({
          telegram_id: telegramUser.id,
          username: telegramUser.username,
          first_name: telegramUser.first_name,
          ton_wallet: tonAddress,
          gram_wallet: tonAddress,
          biometric_hash_id: bioHash,
          elzr_balance: userState.elzrCollected,
          energy: energy,
          score: totalPoints,
        });
      }

      if (isWalletAdminAuthorized(tonAddress)) {
        setIsAdminVisible(true);
      } else {
        setIsAdminVisible(false);
      }
    } else {
      setIsAdminVisible(false);
    }
  }, [tonAddress, telegramUser, biometricHash, userState.elzrCollected]);

  // Global Admin Event States
  const [is2XEventActive, setIs2XEventActive] = useState<boolean>(false);
  const [globalAnnouncement, setGlobalAnnouncement] = useState<string>(
    ''
  );

  useEffect(() => {
    const unsub = subscribeFullscreenChange((active) => {
      setIsFs(active);
    });
    return () => unsub();
  }, []);

  // Energy & Booster state
  const [energy, setEnergy] = useState<number>(100);
  const [maxEnergy, setMaxEnergy] = useState<number>(100);
  const [activeBoosters, setActiveBoosters] = useState<Record<string, number>>({});
  const [activeSkin, setActiveSkin] = useState<string>('standard');
  const [inventory, setInventory] = useState<string[]>(['standard']);

  // Energy auto-recharge timer
  useEffect(() => {
    const timer = setInterval(() => {
      setEnergy((prev) => (prev < maxEnergy ? Math.min(maxEnergy, prev + 1) : prev));
    }, 20000);
    return () => clearInterval(timer);
  }, [maxEnergy]);

  const handleRefillEnergy = (
    amount: number,
    costType: 'elzr' | 'ton' | 'gram',
    costValue: number
  ): boolean => {
    if (costType === 'elzr') {
      if (userState.elzrCollected < costValue) return false;
      setUserState((prev) => ({ ...prev, elzrCollected: prev.elzrCollected - costValue }));
    } else if (costType === 'ton') {
      if (!userState.wallet.connected || userState.wallet.tonBalance < costValue) return false;
      setUserState((prev) => ({
        ...prev,
        wallet: { ...prev.wallet, tonBalance: Math.max(0, prev.wallet.tonBalance - costValue) },
      }));
    } else if (costType === 'gram') {
      if (!userState.wallet.connected || userState.wallet.gramBalance < costValue) return false;
      setUserState((prev) => ({
        ...prev,
        wallet: { ...prev.wallet, gramBalance: Math.max(0, prev.wallet.gramBalance - costValue) },
      }));
    }

    setEnergy((prev) => Math.min(maxEnergy, prev + amount));
    return true;
  };

  const handleBuyBooster = (
    boosterId: string,
    durationMinutes: number,
    costType: 'elzr' | 'ton' | 'gram',
    costValue: number
  ): boolean => {
    if (costType === 'elzr') {
      if (userState.elzrCollected < costValue) return false;
      setUserState((prev) => ({ ...prev, elzrCollected: prev.elzrCollected - costValue }));
    } else if (costType === 'ton') {
      if (!userState.wallet.connected || userState.wallet.tonBalance < costValue) return false;
      setUserState((prev) => ({
        ...prev,
        wallet: { ...prev.wallet, tonBalance: Math.max(0, prev.wallet.tonBalance - costValue) },
      }));
    } else if (costType === 'gram') {
      if (!userState.wallet.connected || userState.wallet.gramBalance < costValue) return false;
      setUserState((prev) => ({
        ...prev,
        wallet: { ...prev.wallet, gramBalance: Math.max(0, prev.wallet.gramBalance - costValue) },
      }));
    }

    const expireTime = Date.now() + durationMinutes * 60 * 1000;
    setActiveBoosters((prev) => ({ ...prev, [boosterId]: expireTime }));

    if (boosterId === 'hyper_overdrive') {
      setEnergy(maxEnergy);
    }
    return true;
  };

  const handleEquipSkin = (
    skinId: string,
    costType?: 'elzr' | 'ton',
    costValue?: number
  ): boolean => {
    if (inventory.includes(skinId)) {
      setActiveSkin(skinId);
      return true;
    }

    if (costType && costValue) {
      if (costType === 'elzr') {
        if (userState.elzrCollected < costValue) return false;
        setUserState((prev) => ({ ...prev, elzrCollected: prev.elzrCollected - costValue }));
      } else if (costType === 'ton') {
        if (!userState.wallet.connected || userState.wallet.tonBalance < costValue) return false;
        setUserState((prev) => ({
          ...prev,
          wallet: { ...prev.wallet, tonBalance: Math.max(0, prev.wallet.tonBalance - costValue) },
        }));
      }

      setInventory((prev) => [...prev, skinId]);
      setActiveSkin(skinId);
      return true;
    }
    return false;
  };

  const handleStartHuntingWithEnergy = (prewarmedStream?: MediaStream): boolean => {
    const isUnlimited = Boolean(activeBoosters['hyper_overdrive'] && activeBoosters['hyper_overdrive'] > Date.now());
    if (!isUnlimited && energy < 10) {
      return false;
    }
    if (!isUnlimited) {
      setEnergy((prev) => Math.max(0, prev - 10));
    }
    if (prewarmedStream) {
      setCameraStream(prewarmedStream);
    }
    setIsARActive(true);
    return true;
  };

  useEffect(() => {
    return soundManager.subscribe((state) => {
      setIsMuted(state.isMuted);
    });
  }, []);

  // Initialize Telegram WebApp SDK
  useEffect(() => {
    const tgInfo = initTelegramApp();
    if (tgInfo.user) {
      setTelegramUser(tgInfo.user);
      // Auto-tailor referral code if newly loaded
      if (userState.referral.code === 'ELZR0C102F1B' && tgInfo.user.id) {
        const customCode = `ELZR${tgInfo.user.id.toString(16).toUpperCase()}`;
        setUserState((prev) => ({
          ...prev,
          referral: { ...prev.referral, code: customCode },
        }));
      }
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    saveUserState(userState);
  }, [userState]);

  useEffect(() => {
    saveCampaigns(campaigns);
  }, [campaigns]);

  // Evaluate Hunter Milestones & Badges automatically
  useEffect(() => {
    const { updatedState, newlyUnlocked } = checkAchievements(userState);
    if (newlyUnlocked.length > 0) {
      setUserState(updatedState);
      const topUnlocked = newlyUnlocked[0];
      setAchievementToast(topUnlocked);
      triggerHaptic('success');
      playSound.streakMilestone();
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.15 },
        colors: ['#00e5ff', '#fbbf24', '#a855f7'],
      });
      const timer = setTimeout(() => {
        setAchievementToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [
    userState.elzrCollected,
    userState.dailyCheckIn.currentStreak,
    userState.points.rareCoins,
    userState.points.merchantDrops,
  ]);

  // Handlers
  const handleUpdateCity = (newCity: string) => {
    setUserState((prev) => ({ ...prev, city: newCity }));
  };

  const handleCoinCollected = (coin: ARCoinTarget) => {
    if (!Number.isFinite(coin.creditedBalance) || !Number.isFinite(coin.creditedScore)) return;
    setUserState(prev => ({ ...prev, elzrCollected: coin.creditedBalance!,
      elzrInCity: Math.max(0, prev.elzrInCity - coin.value),
      points: { ...prev.points, gameplay: coin.creditedScore! } }));
  };

  const handleActivateReferralCode = (code: string): boolean => {
    if (userState.referral.hasActivatedCode) return false;

    setUserState((prev) => ({
      ...prev,
      referral: {
        ...prev.referral,
        hasActivatedCode: true,
        activatedCode: code,
        referralPts: prev.referral.referralPts + 500,
      },
    }));
    return true;
  };

  const handleClaimDailyReward = (reward: StreakTier) => {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    const wasYesterday = userState.dailyCheckIn.lastCheckInDate === yesterday;
    const nextStreak = wasYesterday ? userState.dailyCheckIn.currentStreak + 1 : 1;

    setUserState((prev) => ({
      ...prev,
      elzrCollected: prev.elzrCollected + reward.elzr,
      points: {
        ...prev.points,
        miningRewards: prev.points.miningRewards + reward.points,
      },
      dailyCheckIn: {
        currentStreak: nextStreak,
        lastCheckInDate: today,
        totalCheckIns: prev.dailyCheckIn.totalCheckIns + 1,
      },
    }));
  };

  const handleAddCampaign = (
    newCampaignData: Omit<AdCampaign, 'id' | 'createdAt' | 'collectedCount'>
  ) => {
    const newCamp: AdCampaign = {
      ...newCampaignData,
      id: `camp_${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      collectedCount: 0,
    };

    setCampaigns((prev) => [newCamp, ...prev]);

    // Increase available coins in city
    setUserState((prev) => ({
      ...prev,
      elzrInCity: prev.elzrInCity + newCampaignData.coinsDropped,
      points: {
        ...prev.points,
        merchantDrops: prev.points.merchantDrops + 50,
      },
    }));
  };

  // Compute total points
  const totalPoints =
    userState.points.gameplay +
    userState.points.rareCoins +
    userState.points.eventCoins +
    userState.points.miningRewards +
    userState.points.merchantDrops +
    userState.referral.referralPts;

  return (
    <div className="min-h-screen bg-[#060b13] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Top Status & Audio Bar */}
      <header className="w-full max-w-md mx-auto bg-[#081220]/90 backdrop-blur border-b border-[#142640] pt-[max(0.375rem,calc(var(--sat)+0.25rem))] pb-1.5 px-4 flex items-center justify-between text-[11px] font-mono text-cyan-400 z-30">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>TMA: @{telegramUser?.username || telegramUser?.first_name || 'Hunter'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {isAdminVisible && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                setCurrentTab('admin');
              }}
              title="Open Admin Dashboard"
              className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 ${
                currentTab === 'admin'
                  ? 'bg-cyan-500 text-slate-950 font-black border-cyan-400'
                  : 'bg-slate-900 border-slate-700/80 text-cyan-400 hover:text-white'
              }`}
            >
              <ShieldAlert className="w-3 h-3 text-cyan-400" />
              <span className="font-bold hidden xs:inline">ADMIN</span>
            </button>
          )}
          <button
            onClick={async () => {
              triggerHaptic('light');
              const next = await toggleFullscreen();
              setIsFs(next);
            }}
            title={isFs ? 'Exit Fullscreen' : 'Fullscreen Experience'}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            {isFs ? (
              <>
                <Minimize className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-bold hidden xs:inline">EXIT FS</span>
              </>
            ) : (
              <>
                <Maximize className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400 font-bold hidden xs:inline">FULLSCREEN</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              triggerHaptic('light');
              soundManager.toggleMute();
            }}
            title={isMuted ? 'Unmute Audio Immersion' : 'Mute Audio Immersion'}
            className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-3 h-3 text-slate-500" />
                <span className="text-slate-500">SFX OFF</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3 h-3 text-cyan-400" />
                <span className="text-cyan-400">SFX ON</span>
              </>
            )}
          </button>
          <span className="text-slate-500 text-[10px]">v7.0</span>
        </div>
      </header>

      {/* Optional Global Announcement Banner */}
      {(
        <div className="w-full max-w-md mx-auto bg-gradient-to-r from-cyan-950 to-blue-950 border-b border-cyan-500/40 px-4 py-1.5 flex items-center gap-2 text-[11px] font-mono text-cyan-300 z-20">
          <Megaphone className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
          <span className="truncate">{globalAnnouncement || (userState.city
            ? `⚡ AR COIN HUNT IS LIVE IN ${userState.city.toUpperCase()}! TAP HUNT TO START!`
            : '⚡ AR COIN HUNT — WAITING FOR YOUR CITY')}</span>
        </div>
      )}

      {/* Main Content Area based on current active tab */}
      <main className="flex-1 w-full max-w-md mx-auto relative">
        {currentTab === 'home' && (
          <HomeTab
            userState={userState}
            onUpdateCity={handleUpdateCity}
            onStatsLoaded={stats => setUserState(previous => ({ ...previous,
              globalHunters: stats.globalHunters, activeHunters: stats.activeHunters,
              elzrInCity: stats.elzrInCity ?? 0 }))}
            onNavigateToHunt={() => {
              triggerHaptic('medium');
              setCurrentTab('hunt');
            }}
            onNavigateToRanks={() => {
              triggerHaptic('light');
              setCurrentTab('ranks');
            }}
            onNavigateToWallet={() => {
              triggerHaptic('light');
              setCurrentTab('wallet');
            }}
            onOpenDailyCheckIn={() => setIsDailyModalOpen(true)}
            onOpenHunterCard={() => setIsHunterCardOpen(true)}
          />
        )}

        {currentTab === 'hunt' && (
          <HuntTab
            onStartHunting={handleStartHuntingWithEnergy}
            elzrInCity={userState.elzrInCity}
            cityName={userState.city}
            energy={energy}
            onNavigateToShop={() => {
              triggerHaptic('medium');
              setCurrentTab('shop');
            }}
          />
        )}

        {currentTab === 'ranks' && (
          <LeaderboardTab
            userElzrCollected={userState.elzrCollected}
            userCity={userState.city}
            userName={telegramUser?.username || telegramUser?.first_name || 'Hunter'}
            onNavigateToHunt={() => {
              triggerHaptic('medium');
              setCurrentTab('hunt');
            }}
            onOpenHunterCard={() => setIsHunterCardOpen(true)}
          />
        )}

        {currentTab === 'shop' && (
          <ShopTab
            userState={userState}
            energy={energy}
            maxEnergy={maxEnergy}
            onRefillEnergy={handleRefillEnergy}
            onBuyBooster={handleBuyBooster}
            onEquipSkin={handleEquipSkin}
            activeBoosters={activeBoosters}
            activeSkin={activeSkin}
            inventory={inventory}
            onNavigateToWallet={() => {
              triggerHaptic('light');
              setCurrentTab('wallet');
            }}
          />
        )}

        {currentTab === 'frens' && (
          <FrensTab
            userState={userState}
            onActivateCode={handleActivateReferralCode}
            onOpenHunterCard={() => setIsHunterCardOpen(true)}
          />
        )}

        {currentTab === 'wallet' && (
          <WalletTab
            userState={userState}
            onUpdateUserState={setUserState}
            onAdminUnlocked={() => setIsAdminVisible(false)}
          />
        )}

        {currentTab === 'admin' && isAdminVisible && (
          <AdminTab
            userState={userState}
            onUpdateUserState={setUserState}
            campaigns={campaigns}
            onAddCampaign={handleAddCampaign}
            telegramUsername={telegramUser?.username || telegramUser?.first_name}
            is2XEventActive={is2XEventActive}
            onToggle2XEvent={setIs2XEventActive}
            globalAnnouncement={globalAnnouncement}
            onSetGlobalAnnouncement={setGlobalAnnouncement}
            onRefillEnergyAll={() => setEnergy(maxEnergy)}
          />
        )}
      </main>

      {/* Real-Time Achievement Milestone Toast Notification */}
      {achievementToast && (
        <div
          onClick={() => {
            triggerHaptic('medium');
            setCurrentTab('wallet');
            setAchievementToast(null);
          }}
          className="fixed top-12 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-300 cursor-pointer"
        >
          <div className="p-3.5 rounded-2xl bg-[#091322]/95 border-2 border-amber-400 text-white shadow-[0_0_30px_rgba(251,191,36,0.6)] flex items-center gap-3 backdrop-blur-md">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-1">
                  <span>🏆 BADGE UNLOCKED!</span>
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  +{achievementToast.pointsReward} PTS
                </span>
              </div>
              <div className="text-xs font-black truncate text-white">
                {achievementToast.title}
              </div>
              <div className="text-[11px] text-slate-300 truncate">
                {achievementToast.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Dock */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isAdminVisible={isAdminVisible}
      />

      {/* Fullscreen AR Camera / 3D Sensor Hunt Mode */}
      {isARActive && (
        <ARView
          onClose={() => {
            setIsARActive(false);
            if (cameraStream) {
              cameraStream.getTracks().forEach((track) => track.stop());
              setCameraStream(null);
            }
          }}
          onCoinCollected={handleCoinCollected}
          cityName={userState.city}
          initialStream={cameraStream}
          campaigns={campaigns}
        />
      )}

      {/* Daily Check-in Streak Modal */}
      <DailyCheckInModal
        isOpen={isDailyModalOpen}
        onClose={() => setIsDailyModalOpen(false)}
        dailyCheckIn={userState.dailyCheckIn}
        onClaimDailyReward={handleClaimDailyReward}
      />

      {/* Social Sharing Hunter Status Card Modal */}
      <HunterCardModal
        isOpen={isHunterCardOpen}
        onClose={() => setIsHunterCardOpen(false)}
        username={telegramUser?.username || telegramUser?.first_name || 'Hunter'}
        elzrCount={userState.elzrCollected}
        city={userState.city}
        points={totalPoints}
        referralCode={userState.referral.code}
        streak={userState.dailyCheckIn.currentStreak}
      />

      {/* Biometric App-Launch Registration Gate */}
      {isBiometricGateOpen && (
        <BiometricAuthGate
          onAuthenticated={(hash: string) => {
            setBiometricHash(hash);
            sessionStorage.setItem('elzr_session_biometric_authenticated', 'true');
            setIsBiometricGateOpen(false);

            if (tonAddress && isWalletAdminAuthorized(tonAddress)) {
              setIsAdminVisible(true);
            }

            if (telegramUser?.id) {
              syncHunterToService({
                telegram_id: telegramUser.id,
                username: telegramUser.username,
                first_name: telegramUser.first_name,
                ton_wallet: tonAddress || undefined,
                biometric_hash_id: hash,
                elzr_balance: userState.elzrCollected,
                energy: energy,
                score: totalPoints,
              });
            }
          }}
          telegramUser={telegramUser}
          elzrCollected={userState.elzrCollected}
          totalPoints={totalPoints}
        />
      )}
    </div>
  );
}
