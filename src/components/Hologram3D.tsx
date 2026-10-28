import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// The pedestal is a sibling of the spinning coin, fixed at ground level.
export function Hologram3D() {
  const rings = useRef<THREE.Group>(null);
  const beam = useMemo(() => ({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 } },
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float time; varying vec2 vUv;
      void main(){ float fade=pow(1.-vUv.y,2.);
        float rays=pow(.5+.5*sin(vUv.x*150.+time*.3),12.);
        float scan=.85+.15*sin(vUv.y*75.-time*2.);
        gl_FragColor=vec4(.02,.75,1.,fade*(.07+rays*.23)*scan); }`,
  }), []);
  useFrame(({ clock }, delta) => {
    if (rings.current) rings.current.rotation.y += delta * .12;
    beam.uniforms.time.value = clock.elapsedTime;
  });
  return <group position={[0, -2.5, 0]}>
    <group ref={rings}>
      {[.72, 1.04, 1.45, 1.85, 2.03].map((radius, i) =>
        <mesh key={radius} rotation={[-Math.PI / 2, 0, 0]} position={[0, .025 + i * .004, 0]}>
          <ringGeometry args={[radius, radius + (i === 2 ? .075 : .018), 128]} />
          <meshBasicMaterial color={i === 2 ? '#65ffff' : '#00baff'} transparent opacity={.85}
            blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>)}
      {Array.from({ length: 12 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, .05, 0]}>
        <ringGeometry args={[1.76, 1.84, 12, 1, i * Math.PI / 6, .35]} />
        <meshBasicMaterial color="#20edff" transparent opacity={.95} blending={THREE.AdditiveBlending}
          depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>)}
      {Array.from({ length: 48 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, .035, 0]}>
        <ringGeometry args={[1.16, i % 4 === 0 ? 1.29 : 1.21, 2, 1, i * Math.PI / 24, .025]} />
        <meshBasicMaterial color="#58eaff" transparent opacity={.7} depthWrite={false} toneMapped={false} />
      </mesh>)}
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, .015, 0]}>
      <circleGeometry args={[2.15, 96]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv; void main(){float r=length(vUv-.5)*2.;float a=pow(max(0.,1.-r),3.);float glow=exp(-pow((r-.69)*35.,2.))*.28+exp(-pow((r-.85)*40.,2.))*.24;gl_FragColor=vec4(.02,.8,1.,a*.8+glow);}`} />
    </mesh>
    <mesh position={[0, 1.15, 0]}>
      <cylinderGeometry args={[.72, 1.35, 2.3, 64, 1, true]} />
      <shaderMaterial {...beam} />
    </mesh>
    <pointLight position={[0, .25, 0]} color="#00dbff" intensity={3} distance={4} />
  </group>;
}
