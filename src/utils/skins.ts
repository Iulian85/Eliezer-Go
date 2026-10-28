export type CoinSkinId = 'cyber-cyan' | 'gold-ton' | 'ruby-crimson' | 'emerald-gram' | 'amethyst-void' | 'stealth-phantom';

export type CameraFilterId = 'normal' | 'night-vision' | 'thermal' | 'matrix';

export interface CoinSkin {
  id: CoinSkinId;
  name: string;
  tagline: string;
  badge: string;
  iconColor: string;
  primaryColor: string;
  secondaryColor: string;
  glowColor: string;
  edgeColor: string;
  metalness: number;
  roughness: number;
  emissiveIntensity: number;
  particlesColor: string;
  gradient: [string, string, string, string]; // 4 stops for canvas texture
  textColor: string;
}

export interface CameraFilter {
  id: CameraFilterId;
  name: string;
  description: string;
  cssFilter: string;
  tintClass?: string;
  overlayClass?: string;
}

export const COIN_SKINS: CoinSkin[] = [
  {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    tagline: 'Standard issue holographic hunter alloy',
    badge: 'DEFAULT',
    iconColor: '#00e5ff',
    primaryColor: '#00f0ff',
    secondaryColor: '#0369a1',
    glowColor: '#00f0ff',
    edgeColor: '#0284c7',
    metalness: 0.92,
    roughness: 0.18,
    emissiveIntensity: 1.2,
    particlesColor: '#38bdf8',
    gradient: ['#00f0ff', '#0ea5e9', '#0369a1', '#082f49'],
    textColor: '#ffffff',
  },
  {
    id: 'gold-ton',
    name: '24K TON Bullion',
    tagline: 'Polished mirror gold with luxury specular finish',
    badge: 'LEGENDARY',
    iconColor: '#fbbf24',
    primaryColor: '#fef08a',
    secondaryColor: '#b45309',
    glowColor: '#f59e0b',
    edgeColor: '#d97706',
    metalness: 0.98,
    roughness: 0.12,
    emissiveIntensity: 1.5,
    particlesColor: '#fde047',
    gradient: ['#fffbeb', '#fde047', '#d97706', '#78350f'],
    textColor: '#ffffff',
  },
  {
    id: 'ruby-crimson',
    name: 'Inferno Ruby',
    tagline: 'Hyper-charged volcanic crystal core',
    badge: 'RARE',
    iconColor: '#f43f5e',
    primaryColor: '#fda4af',
    secondaryColor: '#be123c',
    glowColor: '#ff2d55',
    edgeColor: '#881337',
    metalness: 0.88,
    roughness: 0.22,
    emissiveIntensity: 1.6,
    particlesColor: '#fb7185',
    gradient: ['#ffe4e6', '#f43f5e', '#9f1239', '#4c0519'],
    textColor: '#ffffff',
  },
  {
    id: 'emerald-gram',
    name: 'GRAM Matrix Emerald',
    tagline: 'High-speed green crypto phosphor circuit',
    badge: 'GRAM EDITION',
    iconColor: '#10b981',
    primaryColor: '#6ee7b7',
    secondaryColor: '#047857',
    glowColor: '#10b981',
    edgeColor: '#065f46',
    metalness: 0.9,
    roughness: 0.15,
    emissiveIntensity: 1.4,
    particlesColor: '#34d399',
    gradient: ['#ecfdf5', '#10b981', '#065f46', '#022c22'],
    textColor: '#ffffff',
  },
  {
    id: 'amethyst-void',
    name: 'Quantum Amethyst',
    tagline: 'Stellar cosmic plasma from the deep void',
    badge: 'EPIC',
    iconColor: '#a855f7',
    primaryColor: '#d8b4fe',
    secondaryColor: '#7e22ce',
    glowColor: '#c084fc',
    edgeColor: '#581c87',
    metalness: 0.94,
    roughness: 0.16,
    emissiveIntensity: 1.5,
    particlesColor: '#e9d5ff',
    gradient: ['#faf5ff', '#a855f7', '#6b21a8', '#3b0764'],
    textColor: '#ffffff',
  },
  {
    id: 'stealth-phantom',
    name: 'Phantom Carbon',
    tagline: 'Stealth matte titanium with white cold neon',
    badge: 'SPECIAL',
    iconColor: '#e2e8f0',
    primaryColor: '#f8fafc',
    secondaryColor: '#1e293b',
    glowColor: '#ffffff',
    edgeColor: '#0f172a',
    metalness: 0.85,
    roughness: 0.35,
    emissiveIntensity: 1.8,
    particlesColor: '#cbd5e1',
    gradient: ['#f1f5f9', '#475569', '#1e293b', '#020617'],
    textColor: '#38bdf8',
  },
];

export const CAMERA_FILTERS: CameraFilter[] = [
  {
    id: 'normal',
    name: 'Standard Lens',
    description: 'Clean natural camera feed with holographic AR',
    cssFilter: 'none',
  },
  {
    id: 'night-vision',
    name: 'Night Vision NVG',
    description: 'Military green phosphorescent low-light scan',
    cssFilter: 'brightness(1.25) contrast(1.4) saturate(0) sepia(100%) hue-rotate(85deg)',
    tintClass: 'bg-emerald-950/20 mix-blend-color',
    overlayClass: 'bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] opacity-15',
  },
  {
    id: 'thermal',
    name: 'Thermal Heat-Seeker',
    description: 'Infrared heat sensor mode highlighting crypto energy',
    cssFilter: 'contrast(1.6) invert(1) hue-rotate(180deg) saturate(2.5)',
    tintClass: 'bg-indigo-950/30 mix-blend-screen',
  },
  {
    id: 'matrix',
    name: 'Matrix Datafeed',
    description: 'Retro phosphor CRT terminal and digital cyber-grid',
    cssFilter: 'brightness(0.9) contrast(1.5) hue-rotate(60deg)',
    overlayClass: 'bg-[linear-gradient(rgba(16,185,129,0.15)_50%,transparent_50%)] [background-size:100%_4px]',
  },
];
