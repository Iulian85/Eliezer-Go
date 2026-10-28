import { CoinMotion, validCoinMotion, synchronizeGameClock } from '../utils/coinMotion';
import { getTelegramWebApp } from '../utils/telegram';
import { CollectionPosition } from '../utils/collection';

export interface ServiceHunterProfile {
  id?: string;
  telegram_id: number;
  username?: string;
  first_name?: string;
  ton_wallet?: string;
  gram_wallet?: string;
  biometric_hash_id?: string;
  elzr_balance: number;
  energy: number;
  score: number;
  updated_at?: string;
}

export interface ServiceCollectedCoin {
  id?: string;
  telegram_id: number;
  coin_id: string;
  coin_type: string;
  value: number;
  city_name: string;
  latitude?: number;
  longitude?: number;
  collected_at?: string;
}

export interface ServiceCoinDrop {
  calibration?: boolean;
  motion?: CoinMotion;
  id: string;
  name: string;
  city_name: string;
  street: string;
  latitude: number;
  longitude: number;
  value: number;
  coin_type: 'standard' | 'rare' | 'merchant';
  sponsor_name?: string;
  status: 'active' | 'collected' | 'expired';
  created_at?: string;
}

let configured = false;
export function getIsServiceConfigured() { return configured; }
export async function initApiConfig() {
  try { const r = await fetch('/api/config'); configured = r.ok && (await r.json()).isConfigured === true; }
  catch { configured = false; }
  return configured;
}
// Personal data and account mutations require a verified server session.
export async function syncHunterToService(_profile: ServiceHunterProfile) { return null; }
export async function recordCollectedCoinToService(_record: ServiceCollectedCoin) { return null; }
export async function fetchActiveCoinsFromService(_city: string) { return []; }
export async function fetchLeaderboardFromService(_limit = 20) { return []; }
export async function fetchAllHuntersFromService(): Promise<ServiceHunterProfile[]> { return []; }
export async function updateHunterBalanceInService(_id: number, _balance: number, _score: number) { return false; }
export async function fetchAdminMetricsFromService() {
  return { totalHunters: 0, totalCoinsCollected: 0, totalElzrBalance: 0, isConnected: false };
}
export async function fetchCoinDropsFromService(_city = ''): Promise<ServiceCoinDrop[]> {
  const requested = Date.now();
  const response = await fetch('/api/coins', { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('Coins are temporarily unavailable');
  const serverTime = response.headers.get('X-Game-Time');
  if (serverTime) synchronizeGameClock(Number(serverTime), requested, Date.now());
  const drops = await response.json();
  if (!Array.isArray(drops)) throw new Error('Invalid response');
  return drops.filter(d => typeof d.id === 'string' && typeof d.name === 'string' &&
    Number.isFinite(d.latitude) && Math.abs(d.latitude) <= 90 &&
    Number.isFinite(d.longitude) && Math.abs(d.longitude) <= 180 && d.status === 'active' &&
    (!d.motion || validCoinMotion(d.motion)));
}
export async function saveAdminCoinDropToService(_drop: Omit<ServiceCoinDrop, 'id' | 'created_at'>): Promise<ServiceCoinDrop> {
  throw new Error('Administrator authorization required');
}
export interface CreditReceipt { success: true; credited: boolean; value: number; balance: number; score: number }
const accountHeaders = () => ({ 'Content-Type': 'application/json', 'X-Telegram-Init-Data': getTelegramWebApp()?.initData || '' });
export async function fetchAccountBalance(): Promise<{ balance: number; score: number } | null> {
  try {
    const response = await fetch('/api/account', { headers: accountHeaders(), signal: AbortSignal.timeout(10000) });
    if (!response.ok) return null;
    const data = await response.json();
    return Number.isFinite(data.balance) && Number.isFinite(data.score) ? data : null;
  } catch { return null; }
}
export async function markCoinCollectedInService(coinId: string, position: CollectionPosition, measuredAt: number): Promise<CreditReceipt> {
  const response = await fetch('/api/coins/collect', { method: 'POST', headers: accountHeaders(),
    body: JSON.stringify({ coinId, position, measuredAt }), signal: AbortSignal.timeout(15000) });
  const data = await response.json();
  if (!response.ok || data.success !== true || ![data.value, data.balance, data.score].every(Number.isFinite)) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Creditarea nu a fost confirmată.');
  }
  return data;
}
