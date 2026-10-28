import React, { useState } from 'react';
import { X, Sparkles, Eye, Check, Palette, Sliders, Shield } from 'lucide-react';
import { CoinSkinId, CameraFilterId, COIN_SKINS, CAMERA_FILTERS } from '../utils/skins';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface CoinSkinsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeSkinId: CoinSkinId;
  onSelectSkin: (skinId: CoinSkinId) => void;
  activeFilterId: CameraFilterId;
  onSelectFilter: (filterId: CameraFilterId) => void;
}

export const CoinSkinsMenu: React.FC<CoinSkinsMenuProps> = ({
  isOpen,
  onClose,
  activeSkinId,
  onSelectSkin,
  activeFilterId,
  onSelectFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'skins' | 'filters'>('skins');

  if (!isOpen) return null;

  const handleSkinClick = (id: CoinSkinId) => {
    triggerHaptic('medium');
    playSound.buttonClick();
    onSelectSkin(id);
  };

  const handleFilterClick = (id: CameraFilterId) => {
    triggerHaptic('medium');
    playSound.buttonClick();
    onSelectFilter(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#0a1628] border-t sm:border border-[#142640] rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl relative overflow-hidden max-h-[88vh] flex flex-col">
        {/* Glow behind */}
        <div className="absolute top-0 right-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#142640]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Visual Customization
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                3D Coin Skins & AR Camera Filters
              </p>
            </div>
          </div>

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

        {/* Sub-tabs: 3D SKINS vs CAMERA FILTERS */}
        <div className="flex border-b border-[#142640] my-3">
          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('skins');
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors relative flex items-center justify-center gap-1.5 ${
              activeTab === 'skins' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>3D Skins ({COIN_SKINS.length})</span>
            {activeTab === 'skins' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
            )}
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setActiveTab('filters');
            }}
            className={`flex-1 py-2.5 text-xs font-mono font-bold tracking-wider uppercase transition-colors relative flex items-center justify-center gap-1.5 ${
              activeTab === 'filters' ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>AR Lens Filters ({CAMERA_FILTERS.length})</span>
            {activeTab === 'filters' && (
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400 shadow-[0_0_8px_#00e5ff]" />
            )}
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {activeTab === 'skins' ? (
            /* 3D COIN SKINS LIST */
            <div className="space-y-2.5">
              {COIN_SKINS.map((skin) => {
                const isEquipped = activeSkinId === skin.id;

                return (
                  <div
                    key={skin.id}
                    onClick={() => handleSkinClick(skin.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isEquipped
                        ? 'bg-gradient-to-r from-[#0d2a47] to-[#08182b] border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                        : 'bg-[#081220] border-[#162a47] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview Swatch */}
                      <div
                        className="w-12 h-12 rounded-xl border border-white/20 flex items-center justify-center relative shadow-lg overflow-hidden shrink-0"
                        style={{
                          background: `radial-gradient(circle at 35% 35%, ${skin.gradient[0]}, ${skin.gradient[1]} 45%, ${skin.gradient[3]} 100%)`,
                          boxShadow: `0 0 12px ${skin.glowColor}40`,
                        }}
                      >
                        {/* Outer Glow Ring representation */}
                        <div
                          className="w-8 h-8 rounded-full border-2"
                          style={{ borderColor: skin.glowColor }}
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white">
                            {skin.name}
                          </span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.2 rounded-full font-bold uppercase"
                            style={{
                              backgroundColor: `${skin.glowColor}25`,
                              color: skin.glowColor,
                              border: `1px solid ${skin.glowColor}50`,
                            }}
                          >
                            {skin.badge}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                          {skin.tagline}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 pl-2">
                      {isEquipped ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_10px_#00e5ff]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono uppercase text-slate-500 group-hover:text-slate-300">
                          EQUIP
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CAMERA FILTERS LIST */
            <div className="space-y-2.5">
              {CAMERA_FILTERS.map((filter) => {
                const isSelected = activeFilterId === filter.id;

                return (
                  <div
                    key={filter.id}
                    onClick={() => handleFilterClick(filter.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#0d2a47] to-[#08182b] border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                        : 'bg-[#081220] border-[#162a47] hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">
                          {filter.name}
                        </span>
                        {filter.id === 'normal' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300">
                            STANDARD
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {filter.description}
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      {isSelected ? (
                        <div className="w-7 h-7 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-[0_0_10px_#00e5ff]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono uppercase text-slate-500 group-hover:text-slate-300">
                          APPLY
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Apply Button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onClose();
          }}
          className="mt-3 w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-bold font-mono text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer hover:brightness-110"
        >
          APPLY & RESUME AR HUNT
        </button>
      </div>
    </div>
  );
};
