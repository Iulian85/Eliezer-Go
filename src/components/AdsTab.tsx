import React, { useState } from 'react';
import { Building2, MapPin, Check, Send, Sparkles, PlusCircle, CheckCircle, BarChart3 } from 'lucide-react';
import { AdCampaign } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface AdsTabProps {
  campaigns: AdCampaign[];
  onAddCampaign: (newCampaign: Omit<AdCampaign, 'id' | 'createdAt' | 'collectedCount'>) => void;
  cityName: string;
}

export const AdsTab: React.FC<AdsTabProps> = ({ campaigns, onAddCampaign, cityName }) => {
  const [activeSubTab, setActiveSubTab] = useState<'new' | 'management'>('new');

  // Form State
  const [brandName, setBrandName] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState(cityName || 'Gersthofen');
  const [country, setCountry] = useState('Germany');
  const [coinsToDrop, setCoinsToDrop] = useState<number>(25);

  // Address check status
  const [addressVerified, setAddressVerified] = useState<boolean>(false);
  const [deploySuccess, setDeploySuccess] = useState<boolean>(false);

  const handleCheckAddress = () => {
    triggerHaptic('medium');
    playSound.buttonClick();
    if (!street || !city) {
      alert('Please enter a street address and city to verify dropzone.');
      return;
    }
    setAddressVerified(true);
  };

  const handleDeployCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      alert('Please enter your Brand Name.');
      return;
    }
    triggerHaptic('success');
    playSound.coinCollected();

    onAddCampaign({
      brandName,
      website: website || 'company.com',
      email: email || 'office@company.com',
      street: street || 'Central Plaza 1',
      city: city || cityName,
      country: country || 'Germany',
      coinsDropped: coinsToDrop,
      status: 'active',
      rewardPerCoin: 100,
    });

    setDeploySuccess(true);
    setTimeout(() => {
      setDeploySuccess(false);
      setActiveSubTab('management');
      // Reset
      setBrandName('');
      setStreet('');
      setAddressVerified(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-28 max-w-md mx-auto">
      {/* Top Navigation Tabs */}
      <div className="flex border-b border-[#142640] mb-5">
        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('new');
          }}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase transition-colors relative ${
            activeSubTab === 'new' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          NEW CAMPAIGN
          {activeSubTab === 'new' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
          )}
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setActiveSubTab('management');
          }}
          className={`flex-1 py-3 text-xs font-mono font-bold tracking-wider uppercase transition-colors relative ${
            activeSubTab === 'management' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          MANAGEMENT
          {activeSubTab === 'management' && (
            <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
          )}
        </button>
      </div>

      {activeSubTab === 'new' ? (
        /* NEW CAMPAIGN VIEW */
        <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-2xl relative">
          {/* SECTION 1: BUSINESS PROFILE */}
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
              BUSINESS PROFILE
            </span>
          </div>

          <form onSubmit={handleDeployCampaign} className="space-y-4">
            {/* BRAND NAME */}
            <div>
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-1.5">
                BRAND NAME *
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Your Company"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* WEBSITE & EMAIL */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-1.5">
                  WEBSITE
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="site.com"
                  className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-1.5">
                  EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="office@..."
                  className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div className="h-[1px] bg-[#142640] my-4" />

            {/* SECTION 2: DROPZONE LOCATION */}
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-slate-300 tracking-wider uppercase font-mono">
                DROPZONE LOCATION
              </span>
            </div>

            {/* STREET, NR */}
            <div>
              <input
                type="text"
                value={street}
                onChange={(e) => {
                  setStreet(e.target.value);
                  setAddressVerified(false);
                }}
                placeholder="Street, Nr."
                className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* CITY & COUNTRY */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>

              <div>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country"
                  className="w-full px-4 py-3 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* BUTTON ROW: CHECK ADDRESS & SEND */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleCheckAddress}
                className={`flex-1 py-3.5 px-4 rounded-2xl font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  addressVerified
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-[#ff3b5c] hover:bg-[#e0314f] text-white shadow-[0_4px_20px_rgba(255,59,92,0.35)]'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span className="font-mono">{addressVerified ? 'ADDRESS VERIFIED' : 'CHECK ADDRESS'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  setStreet('Marktplatz 1');
                  setCity(cityName);
                  setCountry('Germany');
                  setAddressVerified(true);
                }}
                title="Auto-fill city center location"
                className="w-14 h-12 rounded-2xl bg-[#0c213d] border border-cyan-500/30 flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors active:scale-95"
              >
                <Send className="w-5 h-5 -rotate-45" />
              </button>
            </div>

            {/* DROP COIN BUDGET SELECTION */}
            <div className="pt-2">
              <label className="block text-[11px] font-mono tracking-wider text-slate-400 uppercase mb-1.5 flex items-center justify-between">
                <span>AR COINS TO DROP</span>
                <span className="text-cyan-400 font-bold">{coinsToDrop} ELZR</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[10, 25, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setCoinsToDrop(num);
                    }}
                    className={`py-2 rounded-xl text-xs font-mono font-bold transition-all ${
                      coinsToDrop === num
                        ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                        : 'bg-[#081220] border border-[#162a47] text-slate-300'
                    }`}
                  >
                    {num} COINS
                  </button>
                ))}
              </div>
            </div>

            {/* DEPLOY BUTTON */}
            <button
              type="submit"
              className="w-full py-4 mt-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs font-mono tracking-widest uppercase flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(6,182,212,0.4)] hover:brightness-110 active:scale-95 transition-all cursor-pointer"
            >
              {deploySuccess ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>CAMPAIGN DEPLOYED!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>LAUNCH AR DROPZONE</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* MANAGEMENT VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase text-slate-400">
              ACTIVE MERCHANT DROPS ({campaigns.length})
            </span>
            <button
              onClick={() => setActiveSubTab('new')}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Drop</span>
            </button>
          </div>

          {campaigns.map((camp) => (
            <div
              key={camp.id}
              className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">{camp.brandName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase">
                      {camp.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>
                      {camp.street}, {camp.city}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-cyan-400">
                    {camp.collectedCount}/{camp.coinsDropped}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">COLLECTED</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#081220] h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-400 to-emerald-400 h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (camp.collectedCount / camp.coinsDropped) * 100)}%` }}
                />
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px] font-mono text-slate-400">
                <span>Reward: +{camp.rewardPerCoin} PTS / coin</span>
                <span className="text-slate-500">Live since {camp.createdAt}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
