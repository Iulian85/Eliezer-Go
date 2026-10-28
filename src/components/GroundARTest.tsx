import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { Group, PerspectiveCamera } from 'three';
import { Coin3D } from './Coin3D';
import { loadTrackingEngine, TrackedReality, TrackingEngine } from '../utils/trackingEngine';
import { COIN_VISUAL_SCALE, fixedGroundPosition, GroundAlignment, GroundTrackingGate } from '../utils/groundTracking';

interface TrackingState { frame: TrackedReality | null; visible: boolean; receivedAt: number; position: [number, number, number] }
function TrackedCoin({ tracking }: { tracking: React.RefObject<TrackingState> }) {
  const coin = useRef<Group>(null);
  useFrame(({ camera }) => {
    const state = tracking.current;
    if (!coin.current) return;
    coin.current.visible = state.visible && performance.now() - state.receivedAt < 300;
    coin.current.position.set(...state.position);
    const frame = state.frame;
    if (!frame) return;
    camera.projectionMatrix.fromArray(frame.intrinsics);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
    camera.position.set(frame.position.x, frame.position.y, frame.position.z);
    camera.quaternion.set(frame.rotation.x, frame.rotation.y, frame.rotation.z, frame.rotation.w);
    camera.updateMatrixWorld();
  });
  return <group ref={coin} visible={false}>
    <pointLight position={[0, 1, 1]} intensity={6.5} color="#fbbf24" distance={8} />
    <Coin3D scale={COIN_VISUAL_SCALE} />
  </group>;
}

class CameraRenderBoundary extends React.Component<{ onError: () => void; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function GroundARTest({ getAlignment, onClose }: { getAlignment: () => GroundAlignment | null; onClose: (error?: string) => void }) {
  const feed = useRef<HTMLCanvasElement>(null);
  const alignmentRef = useRef(getAlignment);
  alignmentRef.current = getAlignment;
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const tracking = useRef<TrackingState>({ frame: null, visible: false, receivedAt: 0, position: [0, 1.3, 0] });
  const [message, setMessage] = useState('Se încarcă motorul AR…');
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [cameraStarted, setCameraStarted] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    let disposed = false;
    let terminal = false;
    let engine: TrackingEngine | null = null;
    let status = '';
    let seenFrame = false;
    let lastFrameAt = 0;
    let lastReport = 0;
    const gate = new GroundTrackingGate();
    const report = (text: string) => { if (!disposed && status !== text) { status = text; setMessage(text); } };
    const fail = (text: string) => {
      if (disposed || terminal) return;
      terminal = true;
      started.current = false;
      tracking.current.visible = false;
      tracking.current.frame = null;
      setFailed(true); report(text);
      try { engine?.stop(); } finally { closeRef.current(text); }
    };
    const resize = () => {
      if (!feed.current) return;
      feed.current.width = Math.max(1, Math.round(feed.current.clientWidth));
      feed.current.height = Math.max(1, Math.round(feed.current.clientHeight));
      tracking.current.visible = false;
    };
    resize();
    window.addEventListener('resize', resize);
    const onVisibility = () => {
      if (document.hidden) fail('Testul s-a oprit când aplicația a trecut în fundal. Închide și pornește din nou testul.');
    };
    document.addEventListener('visibilitychange', onVisibility);
    const timeout = setTimeout(() => {
      if (!seenFrame) fail('Nu am primit urmărirea camerei în Telegram. Închide testul și verifică permisiunile camerei și senzorilor.');
    }, 15000);
    const watchdog = setInterval(() => {
      if (seenFrame && performance.now() - lastFrameAt > 1500) {
        fail('Camera AR nu mai transmite poziția. Închide și repornește fixarea.');
      }
    }, 500);
    void loadTrackingEngine().then(async loaded => {
      if (disposed || terminal) return;
      engine = loaded;
      engine.stop(); engine.clearCameraPipelineModules();
      engine.XrController.configure({ scale: 'absolute', disableWorldTracking: false });
      engine.addCameraPipelineModules([
        engine.GlTextureRenderer.pipelineModule(),
        engine.XrController.pipelineModule(),
        {
          name: 'eliezer-ground-tracking',
          listeners: [{ event: 'reality.trackingstatus', process: ({ detail }: { detail: { status: string; reason?: string } }) => {
            gate.observeStatus(detail.status, detail.reason);
          } }],
          onStart: () => {
            if (disposed || terminal) return;
            const alignment = alignmentRef.current();
            if (!alignment) { fail('Așteaptă GPS precis și busola, apoi repornește testul lângă monedă.'); return; }
            tracking.current.position = fixedGroundPosition(alignment);
            engine!.XrController.updateCameraProjectionMatrix({ origin: { x: 0, y: 0, z: 0 }, facing: alignment.facing });
            started.current = true;
            setCameraStarted(true);
            report('Îndreaptă camera spre asfalt și deplasează telefonul înainte și înapoi pentru calibrare.');
          },
          onUpdate: ({ processCpuResult }: { processCpuResult?: { reality?: TrackedReality } }) => {
            if (disposed || terminal || !started.current) return;
            const frame = processCpuResult?.reality;
            if (!frame) return;
            seenFrame = true;
            lastFrameAt = performance.now();
            const visible = gate.update(frame, performance.now());
            if (gate.needsRestart) {
              fail('Urmărirea s-a pierdut. Am ascuns moneda pentru a nu o muta. Închide și repornește fixarea.');
              return;
            }
            tracking.current = { ...tracking.current, frame: visible ? frame : null, visible, receivedAt: performance.now() };
            setReady(previous => previous === visible ? previous : visible);
            if (performance.now() - lastReport > 250) {
              lastReport = performance.now();
              const [x, , z] = tracking.current.position;
              const distance = Math.hypot(frame.position.x - x, frame.position.z - z);
              report(visible ? `AR · distanță ${distance.toFixed(1)} m · cameră la ${frame.position.y.toFixed(1)} m de sol` :
                'Calibrare: privește asfaltul și fă lent un pas înainte, apoi înapoi. Aștept scara reală și deplasarea camerei.');
            }
          },
          onException: () => fail('Motorul AR nu a pornit în acest Telegram. Închide testul și verifică permisiunile camerei și senzorilor.'),
          onCameraStatusChange: ({ status: cameraStatus }: { status: string }) => {
            if (cameraStatus === 'failed') fail('Camera nu este disponibilă. Permite accesul camerei în Telegram și reîncearcă.');
          },
        },
      ]);
      if (disposed || terminal || !feed.current) return;
      await engine.run({ canvas: feed.current });
    }).catch(() => fail('Motorul AR nu s-a încărcat sau nu este compatibil. Închide testul și reîncearcă.'));
    return () => {
      disposed = true; started.current = false;
      clearTimeout(timeout);
      clearInterval(watchdog);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      tracking.current.visible = false;
      engine?.stop(); engine?.clearCameraPipelineModules();
    };
  }, []);

  return createPortal(<div style={{ position: 'fixed', inset: 0, zIndex: 2147483000, isolation: 'isolate', background: '#060b13' }} role="dialog" aria-label="Test ancorare pe sol">
    <canvas ref={feed} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }} />
    <div className="absolute inset-0" style={{ zIndex: 1, pointerEvents: 'none' }}>
      <CameraRenderBoundary onError={() => {
        try { window.XR8?.stop(); } finally { closeRef.current('Afișarea 3D nu a pornit în Telegram. Am revenit la cameră.'); }
      }}>
      <Canvas dpr={1} camera={{ near: .05, far: 200 }} gl={{ alpha: true, antialias: true }}
        onCreated={({ camera, gl }) => {
          gl.setClearColor(0x000000, 0);
          (camera as PerspectiveCamera & { manual: boolean }).manual = true;
        }}>
        <ambientLight intensity={1.8} /><directionalLight position={[3, 5, 4]} intensity={3} />
        <TrackedCoin tracking={tracking} />
      </Canvas>
      </CameraRenderBoundary>
    </div>
    {!cameraStarted && <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'grid', placeItems: 'center', pointerEvents: 'none' }}>
      <p className="rounded-xl bg-slate-900 p-5 text-white text-center" role="status">Se pornește camera AR…<br />Dacă nu pornește, revii automat la camera obișnuită.</p>
    </div>}
    <div style={{ zIndex: 3 }} className="absolute top-0 inset-x-0 pt-[max(4rem,env(safe-area-inset-top))] px-4 pointer-events-none">
      <button onClick={() => {
        // Release the camera before the parent requests its normal video stream.
        try { window.XR8?.stop(); } finally { onClose(); }
      }} className="pointer-events-auto rounded-full bg-slate-950/90 border border-cyan-500 px-4 py-2 text-white">Închide testul AR</button>
    </div>
    <div style={{ zIndex: 3 }} className="absolute bottom-0 inset-x-0 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/80 to-transparent text-center text-white">
      <p role="status" className={failed ? 'text-amber-300' : ready ? 'text-cyan-300' : 'text-white'}>{message}</p>
      <p className="text-xs text-slate-300 mt-2">TEST · Fă câțiva pași înapoi și verifică dacă baza rămâne pe același loc.</p>
      <a href="/ar-engine/v1.0.0/LICENSE.txt" target="_blank" rel="noreferrer" className="text-[9px] text-slate-500">8th Wall · © 2026 Niantic Spatial, Inc. · Licență și excluderea garanțiilor</a>
    </div>
  </div>, document.body);
}
