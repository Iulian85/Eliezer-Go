import React from 'react';
import { WeatherCondition, WeatherData } from '../types';
import { WEATHER_PRESETS } from '../utils/weather';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import {
  X,
  CloudSun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudFog,
  CloudLightning,
  Radio,
  Wind,
  Thermometer,
  RotateCcw,
  Check,
} from 'lucide-react';

interface WeatherSelectorModalProps {
  currentWeather: WeatherData;
  isSimulated: boolean;
  onSelectPreset: (condition: WeatherCondition) => void;
  onResetLive: () => void;
  onClose: () => void;
}

export const WeatherSelectorModal: React.FC<WeatherSelectorModalProps> = ({
  currentWeather,
  isSimulated,
  onSelectPreset,
  onResetLive,
  onClose,
}) => {
  const getWeatherIcon = (cond: WeatherCondition, className = 'w-5 h-5') => {
    switch (cond) {
      case 'clear':
        return <CloudSun className={className} />;
      case 'cloudy':
        return <Cloud className={className} />;
      case 'rain':
        return <CloudRain className={className} />;
      case 'snow':
        return <Snowflake className={className} />;
      case 'fog':
        return <CloudFog className={className} />;
      case 'thunder':
        return <CloudLightning className={className} />;
      default:
        return <CloudSun className={className} />;
    }
  };

  const presetList = Object.values(WEATHER_PRESETS);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#091322] border border-[#1a3356] rounded-3xl p-5 shadow-[0_0_50px_rgba(0,229,255,0.15)] flex flex-col space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              {getWeatherIcon(currentWeather.condition, 'w-5 h-5')}
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white tracking-wide uppercase">
                AR Atmospheric Weather
              </h3>
              <p className="text-[11px] font-mono text-cyan-400/80">
                {isSimulated ? 'Simulation Override Active' : 'Real-World GPS Telemetry'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Weather Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-black font-mono text-white flex items-center gap-1">
              <span>{currentWeather.temperature}°C</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-200">{currentWeather.label}</span>
              <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Wind className="w-3 h-3 text-cyan-400" />
                  {currentWeather.windSpeed} km/h
                </span>
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  WMO {currentWeather.weatherCode}
                </span>
              </div>
            </div>
          </div>

          {isSimulated && (
            <button
              onClick={() => {
                triggerHaptic('medium');
                playSound.buttonClick();
                onResetLive();
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[10px] font-bold hover:bg-cyan-500/30 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>SYNC GPS</span>
            </button>
          )}
        </div>

        {/* Preset Selector */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Override Particle Atmosphere
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Indoor & Visual Testing
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {presetList.map((preset) => {
              const isSelected = currentWeather.condition === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => {
                    triggerHaptic('light');
                    playSound.buttonClick();
                    onSelectPreset(preset.id);
                  }}
                  className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}
                    >
                      {getWeatherIcon(preset.id, 'w-5 h-5')}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${isSelected ? 'text-cyan-200' : 'text-white'}`}>
                          {preset.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {preset.temperature}°C
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live GPS Sync Banner button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            playSound.buttonClick();
            onResetLive();
            onClose();
          }}
          className={`w-full py-2.5 px-4 rounded-xl border font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
            !isSimulated
              ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
              : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${!isSimulated ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{!isSimulated ? 'Live Real-World GPS Active' : 'Revert to Real-World GPS Weather'}</span>
        </button>
      </div>
    </div>
  );
};
