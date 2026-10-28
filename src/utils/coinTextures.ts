import * as THREE from 'three';

/**
 * Creates high-fidelity, photorealistic procedural textures for the ELZR Golden AR Coin:
 * 1. Front face: 24K Gold cybernetic bezel, circuit traces, and prominent embossed "ELZR" lettering.
 * 2. Back face: 24K Gold bezel, cybernetic traces, and faceted crystal glowing lightning bolt ("fulger").
 * 3. Lateral rim: 24K Gold milled rim with electric-blue / cyan neon energy channels.
 */

// Helper to draw beveled circle
function drawBeveledCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  strokeWidth: number,
  colorLight: string,
  colorDark: string
) {
  const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  grad.addColorStop(0, colorLight);
  grad.addColorStop(0.5, colorDark);
  grad.addColorStop(1, colorLight);

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = grad;
  ctx.lineWidth = strokeWidth;
  ctx.stroke();
}

// Generate the Front Texture (ELZR text on face)
export function createCoinFrontTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  // 1. Base dark cybernetic background
  const bgGrad = ctx.createRadialGradient(center, center, 40, center, center, center * 0.95);
  bgGrad.addColorStop(0, '#0a1324');
  bgGrad.addColorStop(0.65, '#070b16');
  bgGrad.addColorStop(1, '#03060c');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(center, center, center - 12, 0, Math.PI * 2);
  ctx.fill();

  // 2. Cybernetic circuit board traces with blue/cyan glow
  ctx.save();
  ctx.strokeStyle = '#00d4ff';
  ctx.fillStyle = '#00f0ff';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 10;

  const traceAngles = [
    0.15, 0.35, 0.65, 0.85, 1.15, 1.35, 1.65, 1.85,
  ];

  traceAngles.forEach((ang) => {
    const rad = ang * Math.PI;
    const rStart = center * 0.42;
    const rMid = center * 0.62;
    const rEnd = center * 0.78;

    const x1 = center + Math.cos(rad) * rStart;
    const y1 = center + Math.sin(rad) * rStart;
    const x2 = center + Math.cos(rad + 0.1) * rMid;
    const y2 = center + Math.sin(rad + 0.1) * rMid;
    const x3 = center + Math.cos(rad + 0.1) * rEnd;
    const y3 = center + Math.sin(rad + 0.1) * rEnd;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    // Circuit terminal dot
    ctx.beginPath();
    ctx.arc(x3, y3, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 3. Concentric golden engraved tech rings
  drawBeveledCircle(ctx, center, center, center * 0.82, 6, '#fef08a', '#b45309');
  drawBeveledCircle(ctx, center, center, center * 0.79, 2.5, '#fde047', '#78350f');
  drawBeveledCircle(ctx, center, center, center * 0.42, 4, '#fbbf24', '#92400e');

  // Glowing cyan inner halo ring
  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4. Gold outer bezel (thick 24K gold border with technical notches)
  const outerR = center - 8;
  const innerR = center * 0.88;

  // Radial metallic gold gradient
  const goldBezel = ctx.createRadialGradient(center, center, innerR, center, center, outerR);
  goldBezel.addColorStop(0, '#d97706');
  goldBezel.addColorStop(0.2, '#fde047');
  goldBezel.addColorStop(0.5, '#fef08a');
  goldBezel.addColorStop(0.8, '#d97706');
  goldBezel.addColorStop(1, '#92400e');

  ctx.beginPath();
  ctx.arc(center, center, outerR, 0, Math.PI * 2);
  ctx.arc(center, center, innerR, 0, Math.PI * 2, true);
  ctx.fillStyle = goldBezel;
  ctx.fill();

  // Technical edge notches along the outer bezel
  const notchCount = 36;
  ctx.fillStyle = '#060d1b';
  for (let i = 0; i < notchCount; i++) {
    const a = (i / notchCount) * Math.PI * 2;
    const nx = center + Math.cos(a) * (outerR - 10);
    const ny = center + Math.sin(a) * (outerR - 10);
    ctx.beginPath();
    ctx.arc(nx, ny, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cyan luminous inserts along the outer gold bezel
  ctx.save();
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  const blueNotchCount = 12;
  for (let i = 0; i < blueNotchCount; i++) {
    const a = (i / blueNotchCount) * Math.PI * 2;
    const bx = center + Math.cos(a) * (innerR + (outerR - innerR) / 2);
    const by = center + Math.sin(a) * (innerR + (outerR - innerR) / 2);
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. Center Gold Tech Plaque & "ELZR" Typography
  // Background plaque for ELZR
  const plaqueWidth = size * 0.68;
  const plaqueHeight = size * 0.28;
  const plaqueX = center - plaqueWidth / 2;
  const plaqueY = center - plaqueHeight / 2;

  // Beveled cyber-plaque backing
  ctx.save();
  ctx.fillStyle = '#050b18';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  ctx.beginPath();
  const corner = 24;
  ctx.moveTo(plaqueX + corner, plaqueY);
  ctx.lineTo(plaqueX + plaqueWidth - corner, plaqueY);
  ctx.lineTo(plaqueX + plaqueWidth, plaqueY + corner);
  ctx.lineTo(plaqueX + plaqueWidth, plaqueY + plaqueHeight - corner);
  ctx.lineTo(plaqueX + plaqueWidth - corner, plaqueY + plaqueHeight);
  ctx.lineTo(plaqueX + corner, plaqueY + plaqueHeight);
  ctx.lineTo(plaqueX, plaqueY + plaqueHeight - corner);
  ctx.lineTo(plaqueX, plaqueY + corner);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Cyan neon frame around plaque
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 10;
  ctx.stroke();
  ctx.restore();

  // 6. Prominent Embossed 24K Gold "ELZR" Letters
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 138px "Montserrat", "Arial Black", "Trebuchet MS", sans-serif';

  // Deep 3D drop shadow
  ctx.fillStyle = '#1e1100';
  ctx.fillText('ELZR', center + 5, center + 6);
  ctx.fillStyle = '#451a03';
  ctx.fillText('ELZR', center + 3, center + 4);

  // Rich metallic gold gradient fill
  const textGrad = ctx.createLinearGradient(center, center - 60, center, center + 60);
  textGrad.addColorStop(0, '#ffffff');
  textGrad.addColorStop(0.15, '#fef08a');
  textGrad.addColorStop(0.45, '#f59e0b');
  textGrad.addColorStop(0.75, '#b45309');
  textGrad.addColorStop(1, '#fde047');

  ctx.fillStyle = textGrad;
  ctx.fillText('ELZR', center, center);

  // Crisp golden bevel outline
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 4;
  ctx.strokeText('ELZR', center, center);

  // Subtle cyan neon line under ELZR
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(center - 160, center + 82);
  ctx.lineTo(center + 160, center + 82);
  ctx.stroke();
  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI / 2;
  return texture;
}

// Generate the Back Texture (Crystalline Lightning Bolt / "Fulger")
export function createCoinBackTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const center = size / 2;

  // 1. Dark cybernetic navy background
  const bgGrad = ctx.createRadialGradient(center, center, 40, center, center, center * 0.95);
  bgGrad.addColorStop(0, '#081122');
  bgGrad.addColorStop(0.65, '#050914');
  bgGrad.addColorStop(1, '#02040a');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(center, center, center - 12, 0, Math.PI * 2);
  ctx.fill();

  // 2. High-tech cybernetic traces
  ctx.save();
  ctx.strokeStyle = '#00d4ff';
  ctx.fillStyle = '#00f0ff';
  ctx.lineWidth = 3.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 12;

  const traceAngles = [
    0.05, 0.25, 0.45, 0.75, 0.95, 1.25, 1.45, 1.75,
  ];

  traceAngles.forEach((ang) => {
    const rad = ang * Math.PI;
    const rStart = center * 0.48;
    const rMid = center * 0.68;
    const rEnd = center * 0.82;

    const x1 = center + Math.cos(rad) * rStart;
    const y1 = center + Math.sin(rad) * rStart;
    const x2 = center + Math.cos(rad + 0.08) * rMid;
    const y2 = center + Math.sin(rad + 0.08) * rMid;
    const x3 = center + Math.cos(rad + 0.08) * rEnd;
    const y3 = center + Math.sin(rad + 0.08) * rEnd;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x3, y3, 6, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();

  // 3. Concentric engraved rings
  drawBeveledCircle(ctx, center, center, center * 0.82, 6, '#fef08a', '#b45309');
  drawBeveledCircle(ctx, center, center, center * 0.79, 2.5, '#fde047', '#78350f');

  // Glowing cyan inner halo ring
  ctx.save();
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 4.5;
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 16;
  ctx.beginPath();
  ctx.arc(center, center, center * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // 4. Gold outer bezel
  const outerR = center - 8;
  const innerR = center * 0.88;
  const goldBezel = ctx.createRadialGradient(center, center, innerR, center, center, outerR);
  goldBezel.addColorStop(0, '#d97706');
  goldBezel.addColorStop(0.2, '#fde047');
  goldBezel.addColorStop(0.5, '#fef08a');
  goldBezel.addColorStop(0.8, '#d97706');
  goldBezel.addColorStop(1, '#92400e');

  ctx.beginPath();
  ctx.arc(center, center, outerR, 0, Math.PI * 2);
  ctx.arc(center, center, innerR, 0, Math.PI * 2, true);
  ctx.fillStyle = goldBezel;
  ctx.fill();

  // Cyan luminous inserts along the outer gold bezel
  ctx.save();
  ctx.fillStyle = '#00f0ff';
  ctx.shadowColor = '#00e5ff';
  ctx.shadowBlur = 12;
  const blueNotchCount = 12;
  for (let i = 0; i < blueNotchCount; i++) {
    const a = (i / blueNotchCount) * Math.PI * 2;
    const bx = center + Math.cos(a) * (innerR + (outerR - innerR) / 2);
    const by = center + Math.sin(a) * (innerR + (outerR - innerR) / 2);
    ctx.beginPath();
    ctx.arc(bx, by, 5.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 5. THE CRYSTAL LIGHTNING BOLT ("FULGER")
  // Modeled precisely after the reference image:
  // Sharp crystal faceted lightning bolt pointing top-to-bottom with electric neon cyan facets and 24K gold border
  ctx.save();

  // Subtle circular backing glow for the lightning bolt
  const glowGrad = ctx.createRadialGradient(center, center, 20, center, center, 240);
  glowGrad.addColorStop(0, 'rgba(0, 229, 255, 0.45)');
  glowGrad.addColorStop(0.5, 'rgba(0, 140, 255, 0.2)');
  glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(center, center, 240, 0, Math.PI * 2);
  ctx.fill();

  // Scaled coordinates for the faceted crystal lightning bolt
  // Top tip: (center, center - 270)
  // Right zigzag top: (center + 130, center - 20)
  // Inner elbow right: (center + 45, center - 15)
  // Far right hook: (center + 155, center + 45)
  // Bottom tip: (center, center + 270)
  // Left zigzag lower: (center - 130, center + 20)
  // Inner elbow left: (center - 45, center + 15)
  // Far left hook: (center - 155, center - 45)

  const pTop = { x: center, y: center - 270 };
  const pRightUpper = { x: center + 130, y: center - 25 };
  const pRightInner = { x: center + 40, y: center - 20 };
  const pRightOuter = { x: center + 150, y: center + 55 };
  const pBottom = { x: center, y: center + 270 };
  const pLeftLower = { x: center - 130, y: center + 25 };
  const pLeftInner = { x: center - 40, y: center + 20 };
  const pLeftOuter = { x: center - 150, y: center - 55 };
  const pCenterCore = { x: center, y: center };

  // A. Outer heavy 24K Gold Bevel Rim of the Lightning Bolt
  ctx.save();
  ctx.lineWidth = 18;
  ctx.lineJoin = 'miter';
  ctx.miterLimit = 4;
  ctx.strokeStyle = '#d97706';
  ctx.shadowColor = '#000000';
  ctx.shadowBlur = 18;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pRightUpper.x, pRightUpper.y);
  ctx.lineTo(pRightInner.x, pRightInner.y);
  ctx.lineTo(pRightOuter.x, pRightOuter.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.lineTo(pLeftLower.x, pLeftLower.y);
  ctx.lineTo(pLeftInner.x, pLeftInner.y);
  ctx.lineTo(pLeftOuter.x, pLeftOuter.y);
  ctx.closePath();
  ctx.stroke();

  // Golden inner highlight stroke
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#fef08a';
  ctx.shadowColor = '#fbbf24';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.restore();

  // B. Faceted Crystal Interior - Left facets (lighter cyan) & Right facets (deep rich royal cyan)
  // Facet 1: Top-Left (pTop -> pCenterCore -> pLeftOuter)
  const f1Grad = ctx.createLinearGradient(pLeftOuter.x, pLeftOuter.y, pTop.x, pTop.y);
  f1Grad.addColorStop(0, '#0099ff');
  f1Grad.addColorStop(0.5, '#00f0ff');
  f1Grad.addColorStop(1, '#e0f7ff');
  ctx.fillStyle = f1Grad;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.lineTo(pLeftOuter.x, pLeftOuter.y);
  ctx.closePath();
  ctx.fill();

  // Facet 2: Top-Right (pTop -> pRightUpper -> pCenterCore)
  const f2Grad = ctx.createLinearGradient(pTop.x, pTop.y, pRightUpper.x, pRightUpper.y);
  f2Grad.addColorStop(0, '#ffffff');
  f2Grad.addColorStop(0.4, '#38bdf8');
  f2Grad.addColorStop(1, '#0284c7');
  ctx.fillStyle = f2Grad;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pRightUpper.x, pRightUpper.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // Facet 3: Mid-Right notch (pRightUpper -> pRightInner -> pCenterCore)
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.moveTo(pRightUpper.x, pRightUpper.y);
  ctx.lineTo(pRightInner.x, pRightInner.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // Facet 4: Lower-Right wing (pRightInner -> pRightOuter -> pCenterCore)
  const f4Grad = ctx.createLinearGradient(pRightInner.x, pRightInner.y, pRightOuter.x, pRightOuter.y);
  f4Grad.addColorStop(0, '#0284c7');
  f4Grad.addColorStop(1, '#00e5ff');
  ctx.fillStyle = f4Grad;
  ctx.beginPath();
  ctx.moveTo(pRightInner.x, pRightInner.y);
  ctx.lineTo(pRightOuter.x, pRightOuter.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // Facet 5: Bottom-Right (pCenterCore -> pRightOuter -> pBottom)
  const f5Grad = ctx.createLinearGradient(pCenterCore.x, pCenterCore.y, pBottom.x, pBottom.y);
  f5Grad.addColorStop(0, '#0284c7');
  f5Grad.addColorStop(0.6, '#0369a1');
  f5Grad.addColorStop(1, '#0c4a6e');
  ctx.fillStyle = f5Grad;
  ctx.beginPath();
  ctx.moveTo(pCenterCore.x, pCenterCore.y);
  ctx.lineTo(pRightOuter.x, pRightOuter.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.closePath();
  ctx.fill();

  // Facet 6: Bottom-Left (pBottom -> pLeftLower -> pCenterCore)
  const f6Grad = ctx.createLinearGradient(pLeftLower.x, pLeftLower.y, pBottom.x, pBottom.y);
  f6Grad.addColorStop(0, '#00e5ff');
  f6Grad.addColorStop(0.7, '#38bdf8');
  f6Grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = f6Grad;
  ctx.beginPath();
  ctx.moveTo(pBottom.x, pBottom.y);
  ctx.lineTo(pLeftLower.x, pLeftLower.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // Facet 7: Mid-Left notch (pLeftLower -> pLeftInner -> pCenterCore)
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.moveTo(pLeftLower.x, pLeftLower.y);
  ctx.lineTo(pLeftInner.x, pLeftInner.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // Facet 8: Upper-Left wing (pLeftInner -> pLeftOuter -> pCenterCore)
  const f8Grad = ctx.createLinearGradient(pLeftInner.x, pLeftInner.y, pLeftOuter.x, pLeftOuter.y);
  f8Grad.addColorStop(0, '#00f0ff');
  f8Grad.addColorStop(1, '#7dd3fc');
  ctx.fillStyle = f8Grad;
  ctx.beginPath();
  ctx.moveTo(pLeftInner.x, pLeftInner.y);
  ctx.lineTo(pLeftOuter.x, pLeftOuter.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.closePath();
  ctx.fill();

  // C. Central Crystalline Ridge (spine line) with diamond flare
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 14;
  ctx.beginPath();
  ctx.moveTo(pTop.x, pTop.y);
  ctx.lineTo(pCenterCore.x, pCenterCore.y);
  ctx.lineTo(pBottom.x, pBottom.y);
  ctx.stroke();

  // Central starburst highlight
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(pCenterCore.x, pCenterCore.y, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.center.set(0.5, 0.5);
  texture.rotation = Math.PI / 2;
  return texture;
}

// Generate the Lateral Edge / Rim Texture (24K Gold with glowing Electric Blue power bars)
export function createCoinRimTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Brushed 24K Gold base
  const goldGrad = ctx.createLinearGradient(0, 0, 0, height);
  goldGrad.addColorStop(0, '#fef08a');
  goldGrad.addColorStop(0.2, '#f59e0b');
  goldGrad.addColorStop(0.5, '#d97706');
  goldGrad.addColorStop(0.8, '#b45309');
  goldGrad.addColorStop(1, '#fde047');
  ctx.fillStyle = goldGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Regular milled gold ridges alternating with glowing electric-blue channels
  const segmentCount = 32;
  const segWidth = width / segmentCount;

  for (let i = 0; i < segmentCount; i++) {
    const x = i * segWidth;

    // Gold milled bevel indentations
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x, 0, 3, height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 3, 0, 3, height);

    // Glowing electric blue / cyan recessed power bar in the center of each segment
    const barW = segWidth * 0.52;
    const barX = x + (segWidth - barW) / 2;
    const barH = height * 0.56;
    const barY = (height - barH) / 2;

    // Dark housing for the LED bar
    ctx.fillStyle = '#040914';
    ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);

    // Neon cyan / blue LED energy bar
    const blueGrad = ctx.createLinearGradient(0, barY, 0, barY + barH);
    blueGrad.addColorStop(0, '#00f0ff');
    blueGrad.addColorStop(0.5, '#38bdf8');
    blueGrad.addColorStop(1, '#0099ff');
    ctx.fillStyle = blueGrad;
    ctx.fillRect(barX, barY, barW, barH);

    // Center bright white-hot core
    ctx.fillStyle = '#e0f7ff';
    ctx.fillRect(barX + 2, barY + 3, barW - 4, barH - 6);
  }

  // Horizontal gold edge borders top and bottom
  ctx.fillStyle = '#78350f';
  ctx.fillRect(0, 0, width, 5);
  ctx.fillRect(0, height - 5, width, 5);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Generate the Lateral Edge Emissive Map (Black for gold, bright Cyan/Blue for the slots)
export function createCoinRimEmissiveTexture(): THREE.CanvasTexture {
  const width = 1024;
  const height = 128;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Black background (no emissive light on the gold metal)
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, width, height);

  // 2. Bright glowing electric blue on the power bar slots
  const segmentCount = 32;
  const segWidth = width / segmentCount;

  for (let i = 0; i < segmentCount; i++) {
    const x = i * segWidth;
    const barW = segWidth * 0.52;
    const barX = x + (segWidth - barW) / 2;
    const barH = height * 0.56;
    const barY = (height - barH) / 2;

    ctx.fillStyle = '#00e5ff';
    ctx.fillRect(barX, barY, barW, barH);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(barX + 2, barY + 3, barW - 4, barH - 6);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  return texture;
}
