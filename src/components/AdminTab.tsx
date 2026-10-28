import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Database,
  Users,
  MapPin,
  Sparkles,
  Zap,
  PlusCircle,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Settings,
  Megaphone,
  Gift,
  Search,
  CheckCircle2,
  XCircle,
  Lock,
  Key,
} from 'lucide-react';
import { UserState, AdCampaign } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import {
  fetchAdminMetricsFromService,
  fetchAllHuntersFromService,
  updateHunterBalanceInService,
  saveAdminCoinDropToService,
  ServiceHunterProfile,
  getIsServiceConfigured,
} from '../lib/api';

interface AdminTabProps {
  userState: UserState;
  onUpdateUserState: React.Dispatch<React.SetStateAction<UserState>>;
  campaigns: AdCampaign[];
  onAddCampaign: (newCampaign: Omit<AdCampaign, 'id' | 'createdAt' | 'collectedCount'>) => void;
  telegramUsername?: string;
  is2XEventActive: boolean;
  onToggle2XEvent: (active: boolean) => void;
  globalAnnouncement: string;
  onSetGlobalAnnouncement: (text: string) => void;
  onRefillEnergyAll: () => void;
}

export const AdminTab: React.FC<AdminTabProps> = ({
  userState,
  onUpdateUserState,
  campaigns,
  onAddCampaign,
  telegramUsername,
  is2XEventActive,
  onToggle2XEvent,
  globalAnnouncement,
  onSetGlobalAnnouncement,
  onRefillEnergyAll,
}) => {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('elzr_admin_unlocked') === 'true';
  });
  const [passcode, setPasscode] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'metrics' | 'drops' | 'hunters' | 'events'>('metrics');

  // Service Metrics state
  const [dbMetrics, setDbMetrics] = useState<{
    totalHunters: number;
    totalCoinsCollected: number;
    totalElzrBalance: number;
    isConnected: boolean;
  }>({ totalHunters: 1, totalCoinsCollected: userState.elzrCollected, totalElzrBalance: userState.elzrCollected, isConnected: getIsServiceConfigured() });
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [huntersList, setHuntersList] = useState<ServiceHunterProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Dropzone Form State
  const [brandName, setBrandName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(userState.city || 'Gersthofen');
  const [coinsToDrop, setCoinsToDrop] = useState<number>(50);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  // Quick Grant state
  const [grantAmount, setGrantAmount] = useState<number>(100);
  const [grantSuccessMsg, setGrantSuccessMsg] = useState<string>('');
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Announcement input state
  const [announcementText, setAnnouncementText] = useState<string>(globalAnnouncement);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    const metrics = await fetchAdminMetricsFromService();
    setDbMetrics(metrics);
    const hunters = await fetchAllHuntersFromService();
    setHuntersList(hunters);
    setIsLoadingMetrics(false);
  };

  const handleGrantCoinsToSelf = (amount: number) => {
    triggerHaptic('heavy');
    playSound.coinCollected();
    onUpdateUserState((prev) => ({
      ...prev,
      elzrCollected: prev.elzrCollected + amount,
      points: {
        ...prev.points,
        gameplay: prev.points.gameplay + amount * 10,
      },
    }));
    setGrantSuccessMsg(`+${amount} ELZR granted successfully!`);
    setTimeout(() => setGrantSuccessMsg(''), 3000);
  };

  const handleQuickDropzoneLaunch = async () => {
    triggerHaptic('success');
    playSound.coinCollected();

    const targetStreet = street || 'Feldstr. 17';
    const targetCity = city || userState.city || 'Gersthofen';
    const targetCountry = 'Germany';

    // Do not place a coin at an unrelated fallback address if geocoding fails.
    let resolvedLat = NaN;
    let resolvedLon = NaN;

    try {
      const q = encodeURIComponent(`${targetStreet}, ${targetCity}, ${targetCountry}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`);
      if (res.ok) {
        const data = await res.json();
        if (data && data[0]) {
          resolvedLat = parseFloat(data[0].lat);
          resolvedLon = parseFloat(data[0].lon);
        }
      }
    } catch (e) {
      console.warn('Geocoding failed:', e);
    }

    if (!Number.isFinite(resolvedLat) || !Number.isFinite(resolvedLon)) {
      alert('Address could not be located. Check the street and city and try again.');
      return;
    }
    try {
      await saveAdminCoinDropToService({
        name: `${brandName || 'ELZR Coin'} (${targetStreet})`,
        city_name: targetCity,
        street: targetStreet,
        latitude: resolvedLat,
        longitude: resolvedLon,
        value: 100,
        coin_type: 'merchant',
        sponsor_name: brandName || 'Eliezer Go Official Merchant',
        status: 'active',
      });
    } catch {
      alert('Service could not save the coin. Check your connection and database permissions.');
      return;
    }

    onAddCampaign({
      brandName: brandName || 'Eliezer Go Official Merchant',
      website: 't.me/ELZR_Hunt_bot/eliezergo',
      email: 'admin@eliezergo.com',
      street: targetStreet,
      city: targetCity,
      country: targetCountry,
      latitude: resolvedLat,
      longitude: resolvedLon,
      coinsDropped: coinsToDrop,
      status: 'active',
      rewardPerCoin: 100,
    });
    setDeploySuccess(true);
    setTimeout(() => setDeploySuccess(false), 3000);
  };

  const handleSaveAnnouncement = () => {
    triggerHaptic('medium');
    playSound.buttonClick();
    onSetGlobalAnnouncement(announcementText);
  };

  return (
    <div className="flex flex-col px-4 pt-3 pb-28 max-w-md mx-auto select-none">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0c1e36] to-[#081424] border border-[#142640] rounded-3xl p-4 shadow-xl mb-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 shadow-md">
              <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white font-sans">
                  ADMIN DASHBOARD
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] font-mono text-cyan-400">
                Logged in: @{telegramUsername || 'eliezergofounder'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setIsAdminUnlocked(false);
              localStorage.removeItem('elzr_admin_unlocked');
            }}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700/80 text-slate-400 hover:text-white"
            title="Lock Admin Panel"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-[#071322] border border-[#142640] rounded-2xl mb-4 overflow-x-auto no-scrollbar">
        {(
          [
            { id: 'metrics', label: 'Metrics', icon: TrendingUp },
            { id: 'drops', label: 'AR Drops', icon: MapPin },
            { id: 'hunters', label: 'Hunters', icon: Users },
            { id: 'events', label: 'Events', icon: Zap },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                triggerHaptic('light');
                setActiveTab(t.id);
              }}
              className={`flex-1 min-w-[65px] py-2 px-1.5 rounded-xl text-[10px] font-mono font-bold uppercase flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUB-TAB 1: METRICS & DATABASE */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          {/* Status Row */}
          <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640] shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database className={`w-5 h-5 ${dbMetrics.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <div>
                <div className="text-xs font-mono font-bold text-white uppercase">
                  SERVICE STATUS
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {dbMetrics.isConnected ? 'Connected' : 'Local Persistence Mode'}
                </div>
              </div>
            </div>

            <button
              onClick={loadMetrics}
              disabled={isLoadingMetrics}
              className="p-2 rounded-xl bg-[#081220] border border-[#162a47] text-cyan-400 hover:text-white"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingMetrics ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">REGISTERED HUNTERS</div>
              <div className="text-2xl font-black text-white font-mono mt-1">
                {dbMetrics.totalHunters || 1}
              </div>
              <div className="text-[10px] font-mono text-cyan-400 mt-1">Active in Economy</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">COINS COLLECTED</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {dbMetrics.totalCoinsCollected || userState.elzrCollected}
              </div>
              <div className="text-[10px] font-mono text-amber-400/80 mt-1">Global AR Hunts</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">ACTIVE MERCHANT DROPS</div>
              <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
                {campaigns.length}
              </div>
              <div className="text-[10px] font-mono text-cyan-400 mt-1">Dropzones in {userState.city}</div>
            </div>

            <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640]">
              <div className="text-[10px] font-mono text-slate-400 uppercase">2X EVENT MULTIPLIER</div>
              <div className="text-xl font-black font-mono mt-1 flex items-center gap-1.5">
                {is2XEventActive ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> ACTIVE
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> OFF
                  </span>
                )}
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-1">Global coin bonus</div>
            </div>
          </div>

          {/* Quick Grant Panel for Admin */}
          <div className="p-5 rounded-3xl bg-[#0a1628] border border-[#142640] space-y-3">
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white font-mono uppercase">
                ADMIN QUICK ELZR REWARD
              </span>
            </div>

            <p className="text-[11px] text-slate-400 font-mono">
              Instantly grant ELZR coins to your account for testing or rewards:
            </p>

            <div className="flex items-center gap-2">
              {[50, 250, 1000].map((num) => (
                <button
                  key={num}
                  onClick={() => handleGrantCoinsToSelf(num)}
                  className="flex-1 py-2.5 rounded-2xl bg-[#081220] border border-cyan-500/30 text-cyan-300 font-mono font-bold text-xs hover:bg-[#0d223c] active:scale-95 transition-all"
                >
                  +{num} ELZR
                </button>
              ))}
            </div>

            {grantSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold text-center animate-bounce">
                {grantSuccessMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: AR DROPS & MERCHANT CAMPAIGNS */}
      {activeTab === 'drops' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-[#0a1628] border border-[#142640] space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white font-mono uppercase">
                CREATE AR MERCHANT DROPZONE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  BRAND / MERCHANT NAME
                </label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ex: Eliezer Crypto Cafe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    STREET & NR
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Marktplatz 1"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                    CITY
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Gersthofen"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  AR COINS TO DROP ({coinsToDrop} ELZR)
                </label>
                <div className="flex items-center gap-2">
                  {[25, 50, 100, 250].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setCoinsToDrop(num)}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-mono font-bold ${
                        coinsToDrop === num
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-[#081220] border border-[#162a47] text-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleQuickDropzoneLaunch}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                {deploySuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                <span>{deploySuccess ? 'DROPZONE CREATED!' : 'LAUNCH AR DROPZONE'}</span>
              </button>
            </div>
          </div>

          {/* Active Campaigns List */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">
              ACTIVE MERCHANT DROPS ({campaigns.length})
            </span>
            {campaigns.map((c) => (
              <div key={c.id} className="p-3.5 rounded-2xl bg-[#0a1628] border border-[#142640] flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{c.brandName}</div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-rose-400" />
                    <span>{c.street}, {c.city}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-cyan-400">
                    {c.coinsDropped} ELZR
                  </div>
                  <div className="text-[9px] font-mono text-emerald-400 uppercase">{c.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: HUNTERS & PLAYERS */}
      {activeTab === 'hunters' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hunter by username or ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {huntersList.length > 0 ? (
              huntersList
                .filter((h) =>
                  !searchTerm
                    ? true
                    : (h.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                      h.telegram_id.toString().includes(searchTerm)
                )
                .map((h) => (
                  <div
                    key={h.telegram_id}
                    className="p-3.5 rounded-2xl bg-[#0a1628] border border-[#142640] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white font-mono">
                        @{h.username || h.first_name || 'Hunter'}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">
                        ID: {h.telegram_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-amber-400">
                        {h.elzr_balance || 0} ELZR
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400">
                        {h.score || 0} PTS
                      </div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="p-6 rounded-2xl bg-[#0a1628] border border-[#142640] text-center text-xs font-mono text-slate-400">
                <p>No hunters found in the global database.</p>
                <p className="text-[10px] text-cyan-400 mt-1">
                  Current hunter (@{telegramUsername || 'you'}) syncs automatically upon collecting coins.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: GLOBAL EVENTS & SYSTEM */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          {/* 2X Multiplier Event Toggle */}
          <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640] flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>2X DOUBLE ELZR EVENT</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Doubles coin collection rewards for all hunters globally
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('medium');
                playSound.buttonClick();
                onToggle2XEvent(!is2XEventActive);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-all ${
                is2XEventActive
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                  : 'bg-slate-900 border border-slate-700 text-slate-400'
              }`}
            >
              {is2XEventActive ? 'ACTIVE' : 'OFF'}
            </button>
          </div>

          {/* Energy Refill Button */}
          <div className="p-4 rounded-3xl bg-[#0a1628] border border-[#142640] flex items-center justify-between">
            <div>
              <div className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>REFILL HUNTER ENERGY</span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                Instantly refills hunter energy to 100%
              </div>
            </div>

            <button
              onClick={() => {
                triggerHaptic('success');
                playSound.streakMilestone();
                onRefillEnergyAll();
              }}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-mono font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all"
            >
              REFILL NOW
            </button>
          </div>

          {/* Global Announcement Banner Editor */}
          <div className="p-5 rounded-3xl bg-[#0a1628] border border-[#142640] space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white font-mono uppercase">
                GLOBAL ANNOUNCEMENT BANNER
              </span>
            </div>

            <textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              placeholder="Ex: 🔥 2X DOUBLE ELZR EVENT IS LIVE IN GERSTHOFEN! HUNT NOW!"
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-xs placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  setAnnouncementText('');
                  onSetGlobalAnnouncement('');
                }}
                className="text-[11px] font-mono text-slate-500 hover:text-slate-300"
              >
                Clear Banner
              </button>

              <button
                onClick={handleSaveAnnouncement}
                className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase hover:brightness-110 active:scale-95 transition-all"
              >
                UPDATE BANNER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
