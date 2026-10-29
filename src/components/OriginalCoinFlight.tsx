import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { DeviceOrientationControls } from '@react-three/drei';
import * as THREE from 'three';

const GyroCamera = () => {
    const { camera } = useThree();
    useFrame(() => {
        // Fortam pozitia camerei la origine dupa fiecare frame de giroscop
        camera.position.set(0, 0, 0);
    });
    return <DeviceOrientationControls makeDefault alphaOffset={0} />;
};

// ─────────────────────────────────────────────────────────────────────────────
// AIRCOINS-STYLE FLIGHT: moneda zboara in linie dreapta prin oras.
// Trece o singura data - daca ai ratat-o a disparut definitiv.
// Glow-ul se activeaza DOAR cand esti la ≤1m distanta.
// ─────────────────────────────────────────────────────────────────────────────

type CoinFlightPath = {
    id: number;
    // Punctul de start: departe in spatele utilizatorului (sau lateral)
    start: THREE.Vector3;
    // Punctul de final: de cealalta parte
    end: THREE.Vector3;
    // Durata totala a traversarii: 20-28 secunde (viteza realista de oras)
    durationSeconds: number;
};

const createCoinFlightPath = (): CoinFlightPath => {
    // Alege o directie cardinala aleatorie (N->S, S->N, E->W, W->E, sau diagonale)
    const angle = Math.random() * Math.PI * 2;
    
    // Distanta de traversare: moneda vine de la 40m si merge pana la 40m
    // In spatiul 3D al scenei, 1 unitate ≈ 1 metru
    const traverseDistance = 40;

    // Moneda trece exact prin dreptul utilizatorului (la 0,0,0 = camera)
    // cu un mic offset vertical (inaltime piept ~1.3-1.7m) si lateral mic
    const passOffsetX = (Math.random() - 0.5) * 0.6; // ±0.3m lateral fata de user
    const passY       = 1.3 + Math.random() * 0.4;   // intre 1.3m si 1.7m inaltime
    const passOffsetZ = (Math.random() - 0.5) * 0.6; // ±0.3m adancime fata de user

    // Directia principala de traversare in planul XZ
    const dx = Math.cos(angle);
    const dz = Math.sin(angle);

    const start = new THREE.Vector3(
        passOffsetX - dx * traverseDistance,
        passY,
        passOffsetZ - dz * traverseDistance,
    );
    const end = new THREE.Vector3(
        passOffsetX + dx * traverseDistance,
        passY + (Math.random() - 0.5) * 0.4, // variatie minima de inaltime
        passOffsetZ + dz * traverseDistance,
    );

    return {
        id: Date.now() + Math.floor(Math.random() * 100000),
        start,
        end,
        durationSeconds: 20 + Math.random() * 8, // 20-28 secunde traversare completa
    };
};

const AircoinsCoinMotion = ({ 
    coinRef, 
    path, 
    onDistanceChange, 
    onEscape, 
    onTimeLeftChange, 
    isPaused 
}: { 
    coinRef: React.MutableRefObject<THREE.Group | null>, 
    path: CoinFlightPath, 
    onDistanceChange: (d: number) => void, 
    onEscape: () => void, 
    onTimeLeftChange: (seconds: number) => void, 
    isPaused: boolean 
}) => {
    const { camera } = useThree();
    const startTimeRef = useRef<number | null>(null);
    const escapedRef = useRef(false);

    useEffect(() => {
        startTimeRef.current = null;
        escapedRef.current = false;
        onTimeLeftChange(path.durationSeconds);
    }, [path.id]);

    useFrame((state) => {
        if (!coinRef.current || isPaused) return;
        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const progress = THREE.MathUtils.clamp(elapsed / path.durationSeconds, 0, 1);
        const timeLeft = Math.max(0, path.durationSeconds - elapsed);
        onTimeLeftChange(timeLeft);

        // Linie dreapta pura relativa la (0,0,0) = pozitia fixa a camerei
        // Moneda trece GARANTAT prin dreptul userului
        const pos = path.start.clone().lerp(path.end, progress);

        // Plutire verticala minima
        pos.y += Math.sin(state.clock.elapsedTime * 1.2) * 0.02;

        coinRef.current.position.copy(pos);

        // Camera e mereu la (0,0,0) deci distanta = lungimea vectorului pozitiei monedei
        const dist = coinRef.current.position.length();
        onDistanceChange(dist);

        if (progress >= 1 && !escapedRef.current) {
            escapedRef.current = true;
            onEscape();
        }
    });

    return null;
};


export { GyroCamera, createCoinFlightPath, AircoinsCoinMotion };
export type { CoinFlightPath };
