'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, RotateCcw, RefreshCw } from 'lucide-react';
import { cfg, MODELS, type ShirtType, type Surface } from '@/lib/uv';
import { buildTextureCanvas, paintSignatures } from '@/lib/texture';
import type { SignatureRec } from '@/lib/store';
import ShirtTemplate from './ShirtTemplate';

export default function ShirtViewer({
  type, signatures, height = 380, autoRotate = false,
}: {
  type: ShirtType;
  signatures: SignatureRec[];
  height?: number;
  autoRotate?: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<any>(null);
  const groupRef = useRef<any>(null);
  const targetRot = useRef(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [face, setFace] = useState<Surface>('front');
  const sigKey = JSON.stringify(signatures.map((s) => s.id));

  // ---- init three.js once ----
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
        if (disposed || !mountRef.current) return;

        const mount = mountRef.current;
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(mount.clientWidth, mount.clientHeight);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        mount.appendChild(renderer.domElement);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(34, mount.clientWidth / mount.clientHeight, 0.1, 100);
        scene.add(new THREE.HemisphereLight(0xffffff, 0xcfc4ae, 1.15));
        const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(2.5, 3.5, 4); scene.add(key);
        const rim = new THREE.DirectionalLight(0xdde4ff, 0.9); rim.position.set(-3, 2, -3.5); scene.add(rim);
        const ground = new THREE.Mesh(
          new THREE.CircleGeometry(1.5, 40),
          new THREE.ShadowMaterial({ opacity: 0.12 }),
        );
        ground.rotation.x = -Math.PI / 2; ground.position.y = -1.24; scene.add(ground);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.enablePan = false;
        controls.autoRotate = autoRotate;
        controls.autoRotateSpeed = 1.4;

        const canvas = buildTextureCanvas(type, signatures);
        canvasRef.current = canvas;
        const tex = new THREE.CanvasTexture(canvas);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.flipY = false;
        tex.anisotropy = 4;
        textureRef.current = tex;
        if (typeof document !== 'undefined' && document.fonts?.ready) {
          document.fonts.ready.then(() => { paintSignatures(canvas.getContext('2d')!, type, signatures); tex.needsUpdate = true; });
        }

        const gltf = await new GLTFLoader().loadAsync(MODELS[type].file);
        if (disposed) return;
        const model = gltf.scene;
        const fabric = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92, metalness: 0, side: THREE.DoubleSide });
        model.traverse((o: any) => { if (o.isMesh) { o.material = fabric; o.castShadow = false; o.receiveShadow = false; } });

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const scale = 2.25 / (size.y || 1);
        const group = new THREE.Group();
        model.position.set(-center.x, -center.y, -center.z);
        group.add(model);
        group.scale.setScalar(scale);
        const baseRot = cfg[type].frontIsPlusZ ? 0 : Math.PI;
        group.rotation.y = baseRot;
        targetRot.current = baseRot;
        groupRef.current = group;
        scene.add(group);

        const dist = 4.6;
        camera.position.set(0.6, 0.35, dist);
        controls.target.set(0, 0, 0);
        controls.minDistance = dist * 0.55;
        controls.maxDistance = dist * 1.7;
        controls.minPolarAngle = 0.7;
        controls.maxPolarAngle = 2.3;
        controls.update();

        let raf = 0;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          const g = groupRef.current;
          if (g) {
            let d = targetRot.current - g.rotation.y;
            d = Math.atan2(Math.sin(d), Math.cos(d));
            g.rotation.y += d * 0.08;
          }
          controls.update();
          renderer.render(scene, camera);
        };
        tick();

        const ro = new ResizeObserver(() => {
          if (!mount.clientWidth) return;
          camera.aspect = mount.clientWidth / mount.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(mount.clientWidth, mount.clientHeight);
        });
        ro.observe(mount);
        setStatus('ready');
        cleanup = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          controls.dispose();
          renderer.dispose();
          mount.removeChild(renderer.domElement);
        };
      } catch (err) {
        console.error('3D viewer failed, using 2D fallback', err);
        if (!disposed) setStatus('fallback');
      }
    })();
    return () => { disposed = true; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // ---- repaint texture when signatures change ----
  useEffect(() => {
    if (status !== 'ready' || !canvasRef.current || !textureRef.current) return;
    paintSignatures(canvasRef.current.getContext('2d')!, type, signatures);
    textureRef.current.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sigKey, status]);

  const flip = (f: Surface) => {
    setFace(f);
    const base = cfg[type].frontIsPlusZ ? 0 : Math.PI;
    targetRot.current = base + (f === 'back' ? Math.PI : 0);
  };

  if (status === 'fallback') {
    return (
      <div style={{ minHeight: height }} className="flex items-center justify-center py-4">
        <ShirtTemplate type={type} surface={face} signatures={signatures.filter((s) => s.surface === face)} />
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }}>
      <div ref={mountRef} className="absolute inset-0 cursor-grab active:cursor-grabbing [&>canvas]:block" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-stone-400">
          <Loader2 className="animate-spin" size={26} />
          <p className="text-xs font-medium">Loading 3D shirt…</p>
        </div>
      )}
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/90 p-1 shadow-md ring-1 ring-stone-200 backdrop-blur">
        {(['front', 'back'] as Surface[]).map((f) => (
          <button
            key={f}
            onClick={() => flip(f)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition ${face === f ? 'bg-violet-600 text-white' : 'text-stone-600 hover:bg-stone-100'}`}
          >
            {f}
          </button>
        ))}
        <span className="hidden items-center gap-1 px-2 text-[11px] text-stone-400 sm:flex">
          <RefreshCw size={11} /> drag to spin
        </span>
      </div>
      <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-medium text-stone-500 ring-1 ring-stone-200 backdrop-blur">
        <RotateCcw size={11} /> {signatures.length} signature{signatures.length === 1 ? '' : 's'}
      </div>
    </div>
  );
}
