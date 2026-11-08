'use client';

import { useEffect, useRef } from 'react';
import { Eraser, Undo2 } from 'lucide-react';
import type { Stroke } from '@/lib/store';

export interface DrawAsset { strokes: Stroke[]; aspect: number }

const W = 660, H = 220, PEN = 5.5;

export default function SignaturePad({
  color, onChange,
}: {
  color: string;
  onChange: (asset: DrawAsset | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const strokesRef = useRef<{ color: string; pts: { x: number; y: number }[] }[]>([]);
  const drawing = useRef(false);
  const colorRef = useRef(color);
  colorRef.current = color;

  const redraw = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = PEN;
    for (const s of strokesRef.current) {
      ctx.strokeStyle = s.color; ctx.fillStyle = s.color;
      if (s.pts.length === 1) {
        ctx.beginPath(); ctx.arc(s.pts[0].x, s.pts[0].y, PEN / 2, 0, Math.PI * 2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.moveTo(s.pts[0].x, s.pts[0].y);
        for (let i = 1; i < s.pts.length; i++) {
          const mx = (s.pts[i - 1].x + s.pts[i].x) / 2, my = (s.pts[i - 1].y + s.pts[i].y) / 2;
          ctx.quadraticCurveTo(s.pts[i - 1].x, s.pts[i - 1].y, mx, my);
        }
        ctx.stroke();
      }
    }
  };

  const emit = () => {
    const all = strokesRef.current.flatMap((s) => s.pts);
    if (!all.length) { onChange(null); return; }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of all) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
    const pad = 12;
    x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad);
    x1 = Math.min(W, x1 + pad); y1 = Math.min(H, y1 + pad);
    const bw = Math.max(10, x1 - x0), bh = Math.max(10, y1 - y0);
    const strokes: Stroke[] = strokesRef.current.map((s) => ({
      color: s.color,
      width: PEN / bw,
      points: s.pts.map((p) => ({ x: (p.x - x0) / bw, y: (p.y - y0) / bh })),
    }));
    onChange({ strokes, aspect: Math.max(0.8, Math.min(6, bw / bh)) });
  };

  const pos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * W, y: ((e.clientY - rect.top) / rect.height) * H };
  };

  useEffect(() => { redraw(); }, []);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-stone-300 bg-[linear-gradient(#fff,#fff)]">
        <canvas
          ref={canvasRef}
          width={W} height={H}
          className="block h-auto w-full touch-none cursor-crosshair bg-white"
          onPointerDown={(e) => {
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            drawing.current = true;
            strokesRef.current.push({ color: colorRef.current, pts: [pos(e)] });
            redraw();
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            strokesRef.current[strokesRef.current.length - 1].pts.push(pos(e));
            redraw();
          }}
          onPointerUp={() => { if (drawing.current) { drawing.current = false; emit(); } }}
          onPointerCancel={() => { drawing.current = false; }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-stone-400">Draw with your finger or mouse</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { strokesRef.current.pop(); redraw(); emit(); }}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200"
          >
            <Undo2 size={13} /> Undo
          </button>
          <button
            type="button"
            onClick={() => { strokesRef.current = []; redraw(); emit(); }}
            className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-200"
          >
            <Eraser size={13} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}
