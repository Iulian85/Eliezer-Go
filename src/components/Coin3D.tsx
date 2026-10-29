import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  createCoinFrontTexture,
  createCoinBackTexture,
  createCoinRimTexture,
  createCoinRimEmissiveTexture,
} from '../utils/coinTextures';

interface Coin3DProps {
  scale?: number;
  hovered?: boolean;
  canCollect?: boolean;
  isCollecting?: boolean;
  onClick?: () => void;
}

export const Coin3D: React.FC<Coin3DProps> = ({
  scale = 1,
  hovered = false,
  canCollect = false,
  isCollecting = false,
  onClick,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const glowLightRef = useRef<THREE.PointLight>(null);
  const glowHaloRef = useRef<THREE.Mesh>(null);
  const glowCameraPosition = useRef(new THREE.Vector3());

  // 1. Procedural 1024x1024 Front Texture: Bold 24K Gold "ELZR" typography & cybernetic circuits
  const frontTexture = useMemo(() => createCoinFrontTexture(), []);

  // 2. Procedural 1024x1024 Back Texture: Crystalline glowing lightning bolt ("fulger")
  const backTexture = useMemo(() => createCoinBackTexture(), []);

  // 3. Procedural Lateral Rim Texture: 24K Gold milled rim with electric-blue neon energy channels
  const rimTexture = useMemo(() => createCoinRimTexture(), []);
  const rimEmissiveTexture = useMemo(() => createCoinRimEmissiveTexture(), []);

  // Soft spherical golden radial glow texture for collection aura (NO physical rings)
  const goldenGlowTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const cx = 256;
    const cy = 256;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 256);
    grad.addColorStop(0, 'rgba(255, 235, 130, 0.95)');
    grad.addColorStop(0.2, 'rgba(251, 191, 36, 0.85)');
    grad.addColorStop(0.45, 'rgba(245, 158, 11, 0.45)');
    grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.18)');
    grad.addColorStop(0.9, 'rgba(14, 165, 233, 0.08)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    // Smooth continuous 3D coin rotation showing both faces & the lateral blue rim
    const speed = isCollecting ? 5 : .25;
    groupRef.current.rotation.y += delta * speed;

    // Smooth pulse for collection golden glow and light beam when player is close
    if (canCollect && glowLightRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 4.5);
      glowLightRef.current.intensity = 7 + pulse * 2.5;

      if (glowHaloRef.current) {
        glowHaloRef.current.lookAt(state.camera.getWorldPosition(glowCameraPosition.current));
        const haloScale = 1 + pulse * 0.08;
        glowHaloRef.current.scale.set(haloScale, haloScale, 1);
      }
    }

    if (isCollecting) {
      groupRef.current.scale.multiplyScalar(Math.exp(-5 * delta));
    }
  });

  return (
    <group
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      <group ref={groupRef}>
      {/* Generous touch/click collider for mobile tapping in AR */}
      <mesh
        visible={false}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Collection halo faces the camera even while the coin rotates. */}
      {canCollect && (
        <group>
          {/* Pure Radiant Golden Glow Halo behind the coin (Zero physical rings!) */}
          {goldenGlowTexture && (
            <mesh ref={glowHaloRef} position={[0, 0, -0.06]}>
              <planeGeometry args={[4.4, 4.4]} />
              <meshBasicMaterial
                map={goldenGlowTexture}
                transparent
                opacity={0.88}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          )}

          {/* Dynamic glowing point lights illuminating the coin and environment */}
          <pointLight
            ref={glowLightRef}
            color="#00f0ff"
            position={[0, -1.2, 0]}
            intensity={8}
            distance={6}
          />
          <pointLight
            color="#fbbf24"
            position={[0, 0.5, 1.0]}
            intensity={5}
            distance={5}
          />
        </group>
      )}

      {/* Single 3D Golden AR Coin:
          - material-0: Lateral rim (24K Gold with glowing electric-blue channels)
          - material-1: Front face (24K Gold with prominent "ELZR" lettering)
          - material-2: Back face (24K Gold with crystalline glowing lightning bolt "fulger")
      */}
      <mesh
        ref={meshRef}
        castShadow
        receiveShadow
        rotation={[Math.PI / 2, 0, 0]}
      >
        <cylinderGeometry args={[1.3, 1.3, 0.24, 64]} />

        {/* Lateral Rim: 24K Gold + Electric Blue Power Bars */}
        <meshStandardMaterial
          attach="material-0"
          map={rimTexture}
          emissiveMap={rimEmissiveTexture}
          emissive="#00e5ff"
          emissiveIntensity={canCollect ? 1.8 : hovered ? 1.2 : 0.85}
          metalness={0.92}
          roughness={0.16}
        />

        {/* Front Face: Bold "ELZR" Typography */}
        <meshStandardMaterial
          attach="material-1"
          map={frontTexture}
          metalness={0.82}
          roughness={0.16}
          emissive={canCollect ? '#f59e0b' : '#000000'}
          emissiveIntensity={canCollect ? 0.35 : hovered ? 0.2 : 0.05}
        />

        {/* Back Face: Lightning Bolt ("fulger") */}
        <meshStandardMaterial
          attach="material-2"
          map={backTexture}
          metalness={0.82}
          roughness={0.16}
          emissive={canCollect ? '#00e5ff' : '#000000'}
          emissiveIntensity={canCollect ? 0.4 : hovered ? 0.22 : 0.05}
        />
      </mesh>
      </group>
    </group>
  );
};
