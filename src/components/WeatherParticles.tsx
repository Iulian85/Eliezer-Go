import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { WeatherCondition } from '../types';

interface WeatherParticlesProps {
  weatherType: WeatherCondition;
  windSpeed?: number;
  onLightningFlash?: (flash: boolean) => void;
}

// Procedural soft glowing disc particle texture
function createParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

export const WeatherParticles: React.FC<WeatherParticlesProps> = ({
  weatherType,
  windSpeed = 10,
  onLightningFlash,
}) => {
  const pointsRef = useRef<THREE.Points>(null);
  const flashTimerRef = useRef<number>(0);
  const isFlashingRef = useRef<boolean>(false);

  const texture = useMemo(() => createParticleTexture(), []);

  // Determine particle count based on weather condition
  const particleCount = useMemo(() => {
    switch (weatherType) {
      case 'rain':
      case 'thunder':
        return 360;
      case 'snow':
        return 280;
      case 'fog':
        return 140;
      case 'cloudy':
        return 120;
      case 'clear':
      default:
        return 90;
    }
  }, [weatherType]);

  // Particle colors and sizes based on weather
  const { particleColor, particleSize, opacity } = useMemo(() => {
    switch (weatherType) {
      case 'rain':
        return { particleColor: '#38bdf8', particleSize: 0.16, opacity: 0.75 };
      case 'thunder':
        return { particleColor: '#67e8f9', particleSize: 0.2, opacity: 0.85 };
      case 'snow':
        return { particleColor: '#f8fafc', particleSize: 0.24, opacity: 0.9 };
      case 'fog':
        return { particleColor: '#c084fc', particleSize: 0.42, opacity: 0.35 };
      case 'cloudy':
        return { particleColor: '#94a3b8', particleSize: 0.32, opacity: 0.45 };
      case 'clear':
      default:
        return { particleColor: '#00e5ff', particleSize: 0.14, opacity: 0.65 };
    }
  }, [weatherType]);

  // Initial random positions, velocities, and phase offsets
  const { positions, velocities, phases } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const ph = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Spread across a 24x20x24 cube around camera origin
      pos[i3] = (Math.random() - 0.5) * 24;
      pos[i3 + 1] = (Math.random() - 0.5) * 18;
      pos[i3 + 2] = (Math.random() - 0.5) * 24;

      // Velocities
      switch (weatherType) {
        case 'rain':
        case 'thunder':
          vel[i3] = (windSpeed / 15) * 0.4;
          vel[i3 + 1] = -(12 + Math.random() * 8); // Fast drop
          vel[i3 + 2] = (Math.random() - 0.5) * 0.5;
          break;
        case 'snow':
          vel[i3] = (windSpeed / 20) * 0.3;
          vel[i3 + 1] = -(1.2 + Math.random() * 1.5); // Gentle drift
          vel[i3 + 2] = (Math.random() - 0.5) * 0.2;
          break;
        case 'fog':
          vel[i3] = (Math.random() - 0.5) * 0.2;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.15;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.2;
          break;
        case 'cloudy':
          vel[i3] = 0.4 + Math.random() * 0.3;
          vel[i3 + 1] = (Math.random() - 0.5) * 0.1;
          vel[i3 + 2] = (Math.random() - 0.5) * 0.15;
          break;
        case 'clear':
        default:
          vel[i3] = (Math.random() - 0.5) * 0.25;
          vel[i3 + 1] = 0.2 + Math.random() * 0.3; // Floating up cyber-dust
          vel[i3 + 2] = (Math.random() - 0.5) * 0.25;
          break;
      }

      ph[i] = Math.random() * Math.PI * 2;
    }

    return { positions: pos, velocities: vel, phases: ph };
  }, [particleCount, weatherType, windSpeed]);

  // Three.js geometry setup
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  // Frame physics loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const array = posAttr.array as Float32Array;
    const time = state.clock.getElapsedTime();

    // Thunder lightning random flash triggers
    if (weatherType === 'thunder') {
      flashTimerRef.current += delta;
      if (flashTimerRef.current > 4.5 && Math.random() < 0.03 && !isFlashingRef.current) {
        isFlashingRef.current = true;
        flashTimerRef.current = 0;
        if (onLightningFlash) onLightningFlash(true);
        setTimeout(() => {
          if (onLightningFlash) onLightningFlash(false);
          isFlashingRef.current = false;
        }, 140);
      }
    }

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      if (weatherType === 'rain' || weatherType === 'thunder') {
        array[i3] += velocities[i3] * delta;
        array[i3 + 1] += velocities[i3 + 1] * delta;
        array[i3 + 2] += velocities[i3 + 2] * delta;

        // Reset if fell below ground
        if (array[i3 + 1] < -8) {
          array[i3 + 1] = 10;
          array[i3] = (Math.random() - 0.5) * 24;
          array[i3 + 2] = (Math.random() - 0.5) * 24;
        }
      } else if (weatherType === 'snow') {
        // Flutter side to side with sine wave
        const sway = Math.sin(time * 2 + phases[i]) * 0.6 * delta;
        array[i3] += velocities[i3] * delta + sway;
        array[i3 + 1] += velocities[i3 + 1] * delta;
        array[i3 + 2] += Math.cos(time * 1.5 + phases[i]) * 0.4 * delta;

        if (array[i3 + 1] < -8) {
          array[i3 + 1] = 10;
          array[i3] = (Math.random() - 0.5) * 24;
          array[i3 + 2] = (Math.random() - 0.5) * 24;
        }
      } else if (weatherType === 'fog' || weatherType === 'cloudy') {
        array[i3] += velocities[i3] * delta;
        array[i3 + 1] += Math.sin(time * 0.5 + phases[i]) * 0.1 * delta;
        array[i3 + 2] += velocities[i3 + 2] * delta;

        // Boundary wrap
        if (array[i3] > 12) array[i3] = -12;
        if (array[i3] < -12) array[i3] = 12;
        if (array[i3 + 2] > 12) array[i3 + 2] = -12;
        if (array[i3 + 2] < -12) array[i3 + 2] = 12;
      } else {
        // Clear sky / solar cyber motes drifting upward
        array[i3] += Math.sin(time * 0.8 + phases[i]) * 0.15 * delta;
        array[i3 + 1] += velocities[i3 + 1] * delta;
        array[i3 + 2] += Math.cos(time * 0.8 + phases[i]) * 0.15 * delta;

        if (array[i3 + 1] > 10) {
          array[i3 + 1] = -7;
          array[i3] = (Math.random() - 0.5) * 20;
          array[i3 + 2] = (Math.random() - 0.5) * 20;
        }
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={particleSize}
        color={particleColor}
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};
