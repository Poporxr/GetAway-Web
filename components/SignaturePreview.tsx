'use client';

import { useEffect, useRef } from 'react';
import type { SignatureRec } from '@/lib/localstore';
import { fitTextToBox, LINE_HEIGHT } from '@/lib/text';

// Renders one signature (drawn strokes or typed text/emoji) onto a small
// canvas, using the same fitting math as the 2048px shirt texture so the
// flat template, the placement editor and the 3D shirt all agree.
const PW = 480;

export default function SignaturePreview({
  sig,
}: {
  sig: Pick<SignatureRec, 'mode' | 'strokes' | 'text' | 'color' | 'aspect' | 'font'>;
  regionWidthPct?: number; // legacy prop, no longer needed (canvas is self-sized)
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aspect = Math.max(0.5, Math.min(6, sig.aspect || 2.5));
  const H = Math.round(PW / aspect);
  const key = JSON.stringify([sig.mode, sig.text, sig.color, sig.font, sig.aspect, sig.strokes?.length]);

  useEffect(() => {
    const draw = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, PW, H);
      if ((sig.mode === 'type' || sig.mode === 'text') && sig.text) {
        const { fontPx, lines } = fitTextToBox(ctx, sig.text, sig.font, PW, H);
        ctx.fillStyle = sig.color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const lineH = fontPx * LINE_HEIGHT;
        const y0 = H / 2 - ((lines.length - 1) * lineH) / 2;
        lines.forEach((line, i) => ctx.fillText(line, PW / 2, y0 + i * lineH));
      } else {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const stroke of sig.strokes ?? []) {
          ctx.strokeStyle = stroke.color;
          ctx.fillStyle = stroke.color;
          ctx.lineWidth = Math.max(1.6, stroke.width * PW);
          const pts = stroke.points;
          if (pts.length === 1) {
            ctx.beginPath();
            ctx.arc(pts[0].x * PW, pts[0].y * H, ctx.lineWidth / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (pts.length > 1) {
            ctx.beginPath();
            ctx.moveTo(pts[0].x * PW, pts[0].y * H);
            for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x * PW, pts[i].y * H);
            ctx.stroke();
          }
        }
      }
    };
    draw();
    // Webfonts (Caveat / Archivo Black) may land after first paint; redraw
    // once they are in so the preview uses the real glyphs, not a fallback.
    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => { if (!cancelled) draw(); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, H]);

  return (
    <canvas
      ref={canvasRef}
      width={PW}
      height={H}
      style={{ width: '100%', height: '100%', display: 'block' }}
      role="img"
      aria-label={sig.text ?? 'signature'}
    />
  );
}
