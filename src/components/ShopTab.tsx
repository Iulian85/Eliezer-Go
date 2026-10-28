import React, { useState } from 'react';
import {
  Zap,
  ShieldAlert,
  Compass,
  Magnet,
  Sparkles,
  ShoppingBag,
  CheckCircle2,
  Wallet,
  Clock,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { UserState } from '../types';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface ShopTabProps {
  userState: UserState;
  energy: number;
  maxEnergy: number;
  onRefillEnergy: (amount: number, costType: 'elzr' | 'ton' | 'gram', costValue: number) => boolean;
  onBuyBooster: (boosterId: string, durationMinutes: number, costType: 'elzr' | 'ton' | 'gram', costValue: number) => boolean;
  onEquipSkin: (skinId: string, costType?: 'elzr' | 'ton', costValue?: number) => boolean;
  activeBoosters: Record<string, number>;
  activeSkin: string;
  inventory: string[];
  onNavigateToWallet: () => void;
}

interface ShopItem {
  id: string;
  category: 'energy' | 'booster' | 'skin';
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  elzrPrice?: number;
  tonPrice?: number;
  gramPrice?: number;
  energyAmount?: number;
  durationMinutes?: number;
  tag?: string;
  color: string;
}

const SHOP_ITEMS: ShopItem[] = [
  // Energy Items
  {
    id: 'cyber_cell_25',
    category: 'energy',
    title: 'Cyber Battery Cell',
    description: 'Instantly recharges +25 Energy for immediate tactical hunting.',
    icon: Zap,
    elzrPrice: 150,
    tonPrice: 0.1,
    gramPrice: 5,
    energyAmount: 25,
    tag: 'POPULAR',
    color: 'from-amber-500 to-yellow-400',
  },
  {
    id: 'quantum_core_full',
    category: 'energy',
    title: 'Quantum Core Refill',
    description: 'Instantly restores 100% of maximum Energy storage.',
    icon: Zap,
    elzrPrice: 450,
    tonPrice: 0.3,
    gramPrice: 15,
    energyAmount: 100,
    tag: 'BEST VALUE',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    id: 'hyper_overdrive',
    category: 'energy',
    title: 'Unlimited Overdrive Matrix',
    description: 'Refills energy to 100% PLUS Unlimited Energy for 30 minutes!',
    icon: Sparkles,
    elzrPrice: 950,
    tonPrice: 0.7,
    gramPrice: 30,
    energyAmount: 100,
    durationMinutes: 30,
    tag: 'EPIC',
    color: 'from-purple-500 to-pink-500',
  },

  // Tactical Boosters
  {
    id: 'elzr_magnet',
    category: 'booster',
    title: 'ELZR Magnetic Pulse',
    description: 'Draws surrounding AR coin spawns toward your location within 50 meters.',
    icon: Magnet,
    elzrPrice: 300,
    tonPrice: 0.2,
    durationMinutes: 45,
    tag: 'MAGNETIC',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'radar_expander',
    category: 'booster',
    title: 'Radar Range Multiplier',
    description: 'Expands radar scanning radius to 10km and highlights rare coin dropzones.',
    icon: Compass,
    elzrPrice: 500,
    tonPrice: 0.35,
    durationMinutes: 60,
    tag: 'RADAR 2X',
    color: 'from-blue-400 to-cyan-400',
  },
  {
    id: 'durability_shield',
    category: 'booster',
    title: 'Durability Shield Matrix',
    description: 'Doubles coin despawn timers in AR mode, keeping rare coins active longer.',
    icon: ShieldAlert,
    elzrPrice: 400,
    tonPrice: 0.25,
    durationMinutes: 60,
    tag: 'SHIELD',
    color: 'from-rose-500 to-red-400',
  },
  {
    id: 'point_multiplier',
    category: 'booster',
    title: '2X Score Multiplier Chip',
    description: 'Doubles all earned ELZR points from coin collecting & landmark scanning.',
    icon: Layers,
    elzrPrice: 750,
    tonPrice: 0.5,
    durationMinutes: 60,
    tag: '2X POINTS',
    color: 'from-amber-400 to-orange-500',
  },

  // 3D Coin Skins
  {
    id: 'skin_emerald',
    category: 'skin',
    title: 'Holographic Emerald',
    description: 'Transforms collected 3D AR coins into glowing holographic emerald crystals.',
    icon: Sparkles,
    elzrPrice: 1200,
    tonPrice: 0.8,
    tag: 'RARE SKIN',
    color: 'from-emerald-400 to-green-600',
  },
  {
    id: 'skin_crimson',
    category: 'skin',
    title: 'Cyberpunk Crimson',
    description: 'A neon red futuristic cyber skin with pulsing laser wireframes.',
    icon: Sparkles,
    elzrPrice: 2000,
    tonPrice: 1.2,
    tag: 'NEON SKIN',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'skin_darkmatter',
    category: 'skin',
    title: 'Dark Matter Void',
    description: 'Ultra-exclusive anti-matter dark coin matrix with swirling event horizon particles.',
    icon: Sparkles,
    elzrPrice: 3500,
    tonPrice: 2.5,
    tag: 'LEGENDARY',
    color: 'from-purple-600 to-indigo-900',
  },
];

export const ShopTab: React.FC<ShopTabProps> = ({
  userState,
  energy,
  maxEnergy,
  onRefillEnergy,
  onBuyBooster,
  onEquipSkin,
  activeBoosters,
  activeSkin,
  inventory,
  onNavigateToWallet,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'energy' | 'booster' | 'skin'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredItems =
    activeCategory === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.category === activeCategory);

  const handlePurchase = (item: ShopItem, paymentMethod: 'elzr' | 'ton' | 'gram') => {
    triggerHaptic('medium');

    const cost =
      paymentMethod === 'elzr'
        ? item.elzrPrice || 0
        : paymentMethod === 'ton'
        ? item.tonPrice || 0
        : item.gramPrice || 0;

    let success = false;

    if (item.category === 'energy') {
      success = onRefillEnergy(item.energyAmount || 100, paymentMethod, cost);
      if (success) {
        playSound.coinCollected();
        triggerHaptic('success');
        showNotification(`⚡ Purchased ${item.title}! Energy Restored.`);
      } else {
        triggerHaptic('error');
        showNotification(`⚠️ Insufficient ${paymentMethod.toUpperCase()} balance!`);
      }
    } else if (item.category === 'booster') {
      success = onBuyBooster(item.id, item.durationMinutes || 30, paymentMethod, cost);
      if (success) {
        playSound.streakMilestone();
        triggerHaptic('success');
        showNotification(`🚀 ${item.title} Activated for ${item.durationMinutes}m!`);
      } else {
        triggerHaptic('error');
        showNotification(`⚠️ Insufficient ${paymentMethod.toUpperCase()} balance!`);
      }
    } else if (item.category === 'skin') {
      success = onEquipSkin(item.id, paymentMethod === 'gram' ? 'elzr' : paymentMethod, cost);
      if (success) {
        playSound.buttonClick();
        triggerHaptic('success');
        showNotification(`🎨 ${item.title} equipped for 3D AR view!`);
      } else {
        triggerHaptic('error');
        showNotification(`⚠️ Insufficient ${paymentMethod.toUpperCase()} balance!`);
      }
    }
  };

  return (
    <div className="flex flex-col px-4 pt-4 pb-28 max-w-md mx-auto space-y-5">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 inset-x-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="p-3.5 rounded-2xl bg-[#091526]/95 border border-cyan-400 text-white shadow-[0_0_25px_rgba(0,229,255,0.4)] flex items-center gap-2.5 backdrop-blur-md text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header Banner & Energy Status */}
      <div className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-wide text-white font-mono uppercase">
                CYBER SHOP
              </h1>
              <p className="text-[10px] text-slate-400 font-mono">
                POWER-UPS, ENERGY REFILLS & 3D SKINS
              </p>
            </div>
          </div>

          <button
            onClick={onNavigateToWallet}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#081220] border border-cyan-500/30 text-cyan-400 hover:text-cyan-300 text-xs font-mono font-bold transition-all active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>WALLET</span>
          </button>
        </div>

        {/* Energy Status Gauge */}
        <div className="bg-[#060c18] border border-[#142640] rounded-2xl p-3.5 mt-2">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
              <Zap className="w-4 h-4 fill-amber-400 animate-pulse" />
              <span>HUNTER ENERGY</span>
            </div>
            <span className="text-xs font-mono font-black text-white">
              {energy} / {maxEnergy} ENERGY
            </span>
          </div>

          {/* Energy Bar */}
          <div className="w-full bg-[#0d1b2e] h-3 rounded-full overflow-hidden p-0.5 border border-[#182e4a]">
            <div
              className="bg-gradient-to-r from-amber-500 via-yellow-400 to-cyan-400 h-full rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
              style={{ width: `${Math.min(100, (energy / maxEnergy) * 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-[10px] font-mono text-slate-400">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> Auto-recharges +1 every 20s
            </span>
            <span className="text-cyan-400 font-bold">1 Hunt Attempt = 10 Energy</span>
          </div>
        </div>

        {/* User Balances Bar */}
        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
          <div className="bg-[#081220] border border-[#162a47] rounded-xl p-2">
            <div className="text-[10px] font-mono text-slate-400">ELZR COINS</div>
            <div className="text-xs font-bold font-mono text-cyan-400 truncate">
              {userState.elzrCollected}
            </div>
          </div>
          <div className="bg-[#081220] border border-[#162a47] rounded-xl p-2">
            <div className="text-[10px] font-mono text-slate-400">TON WALLET</div>
            <div className="text-xs font-bold font-mono text-blue-400 truncate">
              {userState.wallet.connected ? `${userState.wallet.tonBalance} TON` : 'Not Connected'}
            </div>
          </div>
          <div className="bg-[#081220] border border-[#162a47] rounded-xl p-2">
            <div className="text-[10px] font-mono text-slate-400">GRAM CORE</div>
            <div className="text-xs font-bold font-mono text-purple-400 truncate">
              {userState.wallet.connected ? `${userState.wallet.gramBalance} GRAM` : '0 GRAM'}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'ALL ITEMS' },
          { id: 'energy', label: '⚡ ENERGY REFILLS' },
          { id: 'booster', label: '🚀 BOOSTERS' },
          { id: 'skin', label: '🎨 3D SKINS' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              triggerHaptic('light');
              setActiveCategory(cat.id as any);
            }}
            className={`px-3.5 py-2 rounded-2xl text-[11px] font-mono font-bold tracking-wider uppercase whitespace-nowrap transition-all border ${
              activeCategory === cat.id
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                : 'bg-[#081220] border-[#142640] text-slate-400 hover:text-white'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Shop Items List */}
      <div className="space-y-4">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isSkinUnlocked = item.category === 'skin' && inventory.includes(item.id);
          const isSkinActive = activeSkin === item.id;
          const isBoosterActive = Boolean(activeBoosters[item.id] && activeBoosters[item.id] > Date.now());

          return (
            <div
              key={item.id}
              className="bg-[#0a1628] border border-[#142640] hover:border-cyan-500/40 transition-colors rounded-3xl p-4 shadow-xl relative overflow-hidden"
            >
              {/* Item Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} p-0.5 shrink-0 shadow-lg`}
                  >
                    <div className="w-full h-full bg-[#081220] rounded-[14px] flex items-center justify-center text-white">
                      <Icon className="w-6 h-6 stroke-[2]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold font-mono text-white">{item.title}</h3>
                      {item.tag && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          {item.tag}
                        </span>
                      )}
                      {isBoosterActive && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 uppercase animate-pulse">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 leading-snug">{item.description}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Options */}
              <div className="mt-4 pt-3 border-t border-[#142640] flex items-center justify-between gap-2 flex-wrap">
                {item.category === 'skin' && isSkinUnlocked ? (
                  <button
                    onClick={() => onEquipSkin(item.id)}
                    className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                      isSkinActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isSkinActive ? 'EQUIPPED IN 3D HUNT' : 'EQUIP SKIN'}</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 w-full">
                    {item.elzrPrice !== undefined && (
                      <button
                        onClick={() => handlePurchase(item, 'elzr')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-[#081220] border border-cyan-500/30 hover:border-cyan-400 text-cyan-400 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        <span>BUY WITH</span>
                        <span className="text-white font-black">{item.elzrPrice} ELZR</span>
                      </button>
                    )}

                    {item.tonPrice !== undefined && (
                      <button
                        onClick={() => handlePurchase(item, 'ton')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-blue-950/60 border border-blue-500/40 hover:border-blue-400 text-blue-300 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        <Wallet className="w-3.5 h-3.5 text-blue-400" />
                        <span>{item.tonPrice} TON</span>
                      </button>
                    )}

                    {item.gramPrice !== undefined && (
                      <button
                        onClick={() => handlePurchase(item, 'gram')}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-purple-950/60 border border-purple-500/40 hover:border-purple-400 text-purple-300 hover:text-white font-mono text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>{item.gramPrice} GRAM</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
