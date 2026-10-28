/**
 * Procedural High-Definition Hunter Status Card Generator (Canvas 2D)
 * Generates ready-to-share social cards for Telegram Stories and private chats.
 */

export type CardTheme = 'cyan' | 'gold' | 'ruby' | 'emerald';
export type CardRatio = 'story' | 'post'; // story = 1080x1920 (9:16), post = 1080x1350 (4:5)

export interface CardConfig {
  username: string;
  elzrCount: number;
  city: string;
  points: number;
  referralCode: string;
  streak: number;
  theme: CardTheme;
  ratio: CardRatio;
  walletConnected?: boolean;
}

const THEME_PALETTES = {
  cyan: {
    primary: '#00f0ff',
    secondary: '#0ea5e9',
    accent: '#38bdf8',
    glow: 'rgba(0, 240, 255, 0.5)',
    bg1: '#040914',
    bg2: '#08172b',
    border: '#00e5ff',
    badge: 'CYBER AR SCOUT',
  },
  gold: {
    primary: '#fbbf24',
    secondary: '#d97706',
    accent: '#fef08a',
    glow: 'rgba(251, 191, 36, 0.5)',
    bg1: '#120f04',
    bg2: '#241b06',
    border: '#fbbf24',
    badge: 'TON BULLION MASTER',
  },
  ruby: {
    primary: '#f43f5e',
    secondary: '#be123c',
    accent: '#fda4af',
    glow: 'rgba(244, 63, 94, 0.5)',
    bg1: '#140408',
    bg2: '#2b0813',
    border: '#f43f5e',
    badge: 'INFERNO DRAGON',
  },
  emerald: {
    primary: '#10b981',
    secondary: '#047857',
    accent: '#6ee7b7',
    glow: 'rgba(16, 185, 129, 0.5)',
    bg1: '#04140c',
    bg2: '#082b1b',
    border: '#10b981',
    badge: 'GRAM PROTOCOL OPERATIVE',
  },
};

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}

export async function generateHunterStatusCard(config: CardConfig): Promise<{ dataUrl: string; blob: Blob | null }> {
  const width = 1080;
  const height = config.ratio === 'story' ? 1920 : 1350;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  const p = THEME_PALETTES[config.theme] || THEME_PALETTES.cyan;

  // 1. Background Gradient
  const bgGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.42,
    80,
    width / 2,
    height / 2,
    height * 0.75
  );
  bgGrad.addColorStop(0, p.bg2);
  bgGrad.addColorStop(0.65, p.bg1);
  bgGrad.addColorStop(1, '#020408');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Cyber Grid Pattern
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSize = 48;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Glowing Ambient Nebulas
  const auraGrad = ctx.createRadialGradient(
    width / 2,
    height * 0.4,
    40,
    width / 2,
    height * 0.4,
    380
  );
  auraGrad.addColorStop(0, p.glow);
  auraGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = auraGrad;
  ctx.beginPath();
  ctx.arc(width / 2, height * 0.4, 380, 0, Math.PI * 2);
  ctx.fill();

  // 4. Outer Cyber Border Frame
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 4;
  const margin = 50;
  ctx.strokeRect(margin, margin, width - margin * 2, height - margin * 2);

  // Corner brackets
  ctx.lineWidth = 8;
  const bracketLen = 40;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(margin, margin + bracketLen);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + bracketLen, margin);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(width - margin - bracketLen, margin);
  ctx.lineTo(width - margin, margin);
  ctx.lineTo(width - margin, margin + bracketLen);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(margin, height - margin - bracketLen);
  ctx.lineTo(margin, height - margin);
  ctx.lineTo(margin + bracketLen, height - margin);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(width - margin - bracketLen, height - margin);
  ctx.lineTo(width - margin, height - margin);
  ctx.lineTo(width - margin, height - margin - bracketLen);
  ctx.stroke();

  // 5. Header Branding
  ctx.textAlign = 'center';
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '4px';
  ctx.font = '700 24px "JetBrains Mono", monospace';
  ctx.fillStyle = p.accent;
  ctx.fillText('⚡ ELIEZER GO · AR CAMERA SCOUT', width / 2, margin + 65);

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
  ctx.font = '800 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText('TELEGRAM MINI APP · TON & GRAM ECOSYSTEM', width / 2, margin + 105);

  // Top Title Badge Pill
  const pillY = margin + 155;
  ctx.fillStyle = '#0a1728';
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  const pillW = 340;
  const pillH = 46;
  drawRoundRect(ctx, width / 2 - pillW / 2, pillY - pillH / 2, pillW, pillH, 23);
  ctx.fill();
  ctx.stroke();

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '2px';
  ctx.font = '800 20px "JetBrains Mono", monospace';
  ctx.fillStyle = p.primary;
  ctx.fillText(`★ ${p.badge} ★`, width / 2, pillY + 7);

  // 6. User Info Header
  const userY = pillY + 70;
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0px';
  ctx.font = '800 38px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`@${config.username}`, width / 2, userY);

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
  ctx.font = '600 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`LOCATION: ${config.city.toUpperCase()}`, width / 2, userY + 35);

  // 7. CENTER HERO: Procedural 3D Coin Graphic
  const coinCenterY = config.ratio === 'story' ? height * 0.44 : height * 0.48;
  const coinRadius = config.ratio === 'story' ? 170 : 135;

  // Outer orbital rings
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.beginPath();
  ctx.arc(width / 2, coinCenterY, coinRadius + 50, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 2;
  ctx.strokeStyle = p.glow;
  ctx.beginPath();
  ctx.arc(width / 2, coinCenterY, coinRadius + 25, 0, Math.PI * 2);
  ctx.stroke();

  // Coin body gradient
  const coinGrad = ctx.createRadialGradient(
    width / 2 - coinRadius * 0.35,
    coinCenterY - coinRadius * 0.35,
    15,
    width / 2,
    coinCenterY,
    coinRadius
  );
  coinGrad.addColorStop(0, p.accent);
  coinGrad.addColorStop(0.4, p.primary);
  coinGrad.addColorStop(0.8, p.secondary);
  coinGrad.addColorStop(1, '#061a33');
  ctx.fillStyle = coinGrad;
  ctx.beginPath();
  ctx.arc(width / 2, coinCenterY, coinRadius, 0, Math.PI * 2);
  ctx.fill();

  // Milled Coin Border
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // Draw 32 tech teeth notches
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 32; i++) {
    const angle = (i * Math.PI * 2) / 32;
    const nx = width / 2 + Math.cos(angle) * (coinRadius - 16);
    const ny = coinCenterY + Math.sin(angle) * (coinRadius - 16);
    ctx.beginPath();
    ctx.arc(nx, ny, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Coin Logo Face
  ctx.font = '900 68px "Space Grotesk", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = p.glow;
  ctx.shadowBlur = 30;
  ctx.fillStyle = '#ffffff';
  ctx.fillText('ELZR', width / 2, coinCenterY - 10);
  ctx.shadowBlur = 0;

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
  ctx.font = '700 20px "JetBrains Mono", monospace';
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('TON · GRAM', width / 2, coinCenterY + 45);

  // 8. BIG METRIC: Total ELZR Coins Collected
  const metricY = coinCenterY + coinRadius + 80;
  ctx.textBaseline = 'alphabetic';

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '2px';
  ctx.font = '800 24px "JetBrains Mono", monospace';
  ctx.fillStyle = p.accent;
  ctx.fillText('TOTAL AR COINS COLLECTED', width / 2, metricY);

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0px';
  ctx.font = '900 100px "Space Grotesk", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = p.glow;
  ctx.shadowBlur = 25;
  ctx.fillText(`${config.elzrCount}`, width / 2, metricY + 95);
  ctx.shadowBlur = 0;

  // 9. Stats Grid Row
  const statsY = metricY + 155;
  const statBoxW = 280;
  const statBoxH = 110;
  const statSpacing = 20;

  const statItems = [
    { label: 'POINTS', value: `${config.points} PTS`, color: p.primary },
    { label: 'DAILY STREAK', value: `${config.streak} DAYS`, color: '#fbbf24' },
    { label: 'NETWORK', value: 'TON / GRAM', color: '#38bdf8' },
  ];

  const totalStatsW = statItems.length * statBoxW + (statItems.length - 1) * statSpacing;
  const startStatX = (width - totalStatsW) / 2;

  statItems.forEach((item, idx) => {
    const x = startStatX + idx * (statBoxW + statSpacing);
    ctx.fillStyle = '#0a1628';
    ctx.strokeStyle = '#182b45';
    ctx.lineWidth = 2;
    drawRoundRect(ctx, x, statsY, statBoxW, statBoxH, 20);
    ctx.fill();
    ctx.stroke();

    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
    ctx.font = '700 16px "JetBrains Mono", monospace';
    ctx.fillStyle = '#64748b';
    ctx.fillText(item.label, x + statBoxW / 2, statsY + 38);

    if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0px';
    ctx.font = '800 26px "Space Grotesk", sans-serif';
    ctx.fillStyle = item.color;
    ctx.fillText(item.value, x + statBoxW / 2, statsY + 82);
  });

  // 10. Referral & Join Section Card
  const refCardY = statsY + statBoxH + (config.ratio === 'story' ? 40 : 25);
  const refCardW = width - margin * 2 - 40; // 940px wide for generous margin
  const refCardH = config.ratio === 'story' ? 220 : 175;
  const refCardX = (width - refCardW) / 2;

  ctx.fillStyle = '#081324';
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 2;
  drawRoundRect(ctx, refCardX, refCardY, refCardW, refCardH, 24);
  ctx.fill();
  ctx.stroke();

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('INVITE FRIENDS & GET +500 PTS BONUS', width / 2, refCardY + 42);

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '2px';
  ctx.font = '900 44px "Space Grotesk", sans-serif';
  ctx.fillStyle = p.primary;
  ctx.fillText(config.referralCode, width / 2, refCardY + 98);

  // Sleek Cyber Pill Badge for Telegram Bot URL
  const linkPillW = 580;
  const linkPillH = 44;
  const linkPillX = (width - linkPillW) / 2;
  const linkPillY = refCardY + refCardH - 62;

  ctx.fillStyle = 'rgba(6, 18, 36, 0.95)';
  ctx.strokeStyle = p.border;
  ctx.lineWidth = 1.5;
  drawRoundRect(ctx, linkPillX, linkPillY, linkPillW, linkPillH, 22);
  ctx.fill();
  ctx.stroke();

  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '0px';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillStyle = p.accent;
  ctx.fillText('t.me/ELZR_Hunt_bot/eliezergo', width / 2, linkPillY + 28);

  // 11. Footer Watermark
  const footerY = height - margin - 25;
  if ('letterSpacing' in ctx) (ctx as any).letterSpacing = '1px';
  ctx.font = '700 18px "JetBrains Mono", monospace';
  ctx.fillStyle = '#475569';
  ctx.fillText('VERIFIED PROOF OF AR HUNT · POWERED BY TON CONNECT 2.0', width / 2, footerY);

  // Return PNG dataURL and Blob
  const dataUrl = canvas.toDataURL('image/png', 0.95);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png', 0.95);
  });

  return { dataUrl, blob };
}
