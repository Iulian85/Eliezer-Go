import { Quaternion } from 'three';

export interface TrackedReality {
  rotation: { x: number; y: number; z: number; w: number };
  position: { x: number; y: number; z: number };
  intrinsics: number[];
  trackingStatus: string;
  trackingReason?: string;
}
export interface TrackingEngine {
  loadChunk(name: string): Promise<void>;
  run(options: { canvas: HTMLCanvasElement }): Promise<void> | void;
  stop(): void;
  clearCameraPipelineModules(): void;
  addCameraPipelineModules(modules: unknown[]): void;
  GlTextureRenderer: { pipelineModule(): unknown };
  XrController: {
    configure(options: { scale: 'absolute'; disableWorldTracking: boolean }): void;
    pipelineModule(): unknown;
    updateCameraProjectionMatrix(options: { origin: { x: number; y: number; z: number }; facing: Quaternion }): void;
  };
}
declare global { interface Window { XR8?: TrackingEngine } }
let loading: Promise<TrackingEngine> | null = null;

export function loadTrackingEngine(): Promise<TrackingEngine> {
  if (loading) return loading;
  loading = new Promise<TrackingEngine>((resolve, reject) => {
    let finished = false;
    const script = document.getElementById('ground-ar-engine') as HTMLScriptElement | null;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('xrloaded', ready); };
    const fail = () => { if (finished) return; finished = true; cleanup(); reject(new Error('Motorul AR nu s-a încărcat. Închide testul și încearcă din nou.')); };
    const ready = async () => {
      if (!window.XR8 || finished) return;
      // Loading the SLAM chunk explicitly avoids starting with an uninitialized controller.
      const engine = window.XR8;
      try {
        await engine.loadChunk('slam');
        if (finished) return;
        finished = true; cleanup(); resolve(engine);
      } catch { fail(); }
    };
    const timer = setTimeout(fail, 45000);
    window.addEventListener('xrloaded', ready);
    if (window.XR8) { void ready(); return; }
    if (!script) {
      const element = document.createElement('script');
      element.id = 'ground-ar-engine';
      element.src = '/ar-engine/v1.0.0/xr.js';
      element.async = true;
      element.onerror = () => { element.remove(); fail(); };
      document.head.appendChild(element);
    }
  }).catch(error => { loading = null; throw error; });
  return loading;
}
