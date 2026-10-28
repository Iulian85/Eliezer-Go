import React from 'react';
import { Home, Crosshair, Trophy, ShoppingBag, Users, Wallet, ShieldAlert } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

export type NavTab = 'home' | 'hunt' | 'ranks' | 'shop' | 'frens' | 'wallet' | 'admin';

interface NavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isAdminVisible?: boolean;
}

interface TabItem {
  id: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TABS: TabItem[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'hunt', label: 'Hunt', icon: Crosshair },
  { id: 'ranks', label: 'Ranks', icon: Trophy },
  { id: 'shop', label: 'Shop', icon: ShoppingBag },
  { id: 'frens', label: 'Frens', icon: Users },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'admin', label: 'Admin', icon: ShieldAlert },
];

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, isAdminVisible = false }) => {
  const visibleTabs = TABS.filter((t) => t.id !== 'admin' || isAdminVisible);
  const activeIndex = visibleTabs.findIndex((t) => t.id === currentTab);

  const handleSelect = (tab: NavTab) => {
    if (tab !== currentTab) {
      triggerHaptic('light');
      playSound.buttonClick();
      onTabChange(tab);
    }
  };

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 max-w-md mx-auto pointer-events-auto">
      {/* Container with rounded top and curved contour */}
      <div className="relative bg-[#071322] border-t border-[#132742] pt-2 pb-[max(1.5rem,calc(var(--sab)+0.5rem))] px-3 shadow-[0_-8px_30px_rgba(0,0,0,0.7)]">
        {/* Curved cutout effect for the active elevated icon */}
        <div className="flex items-center justify-around relative">
          {visibleTabs.map((tab, index) => {
            const isActive = tab.id === currentTab;
            const Icon = tab.icon;

            return (
              <div key={tab.id} className="flex-1 flex flex-col items-center justify-end relative h-14">
                {isActive ? (
                  /* Elevated Circular Button with subtle curved cradle */
                  <div className="absolute -top-7 flex flex-col items-center">
                    {/* Glow behind the active bubble */}
                    <div className="absolute -inset-1.5 bg-cyan-400/20 rounded-full blur-md" />
                    
                    <button
                      onClick={() => handleSelect(tab.id)}
                      className="relative w-14 h-14 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.6)] active:scale-95 transition-transform border-[3px] border-[#071322]"
                      aria-label={tab.label}
                    >
                      <Icon className="w-6 h-6 stroke-[2.4]" />
                    </button>
                    {/* Optional miniature label */}
                    <span className="text-[10px] font-bold text-white tracking-wide mt-1">
                      {tab.label}
                    </span>
                  </div>
                ) : (
                  /* Inactive Tab with Icon & Label */
                  <button
                    onClick={() => handleSelect(tab.id)}
                    className="flex flex-col items-center justify-center gap-1 w-full text-slate-400 hover:text-slate-200 transition-colors py-1"
                  >
                    <Icon className="w-5 h-5 opacity-80" />
                    <span className="text-[10px] font-medium tracking-tight">
                      {tab.label}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
