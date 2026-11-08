// Client-side texture compositor: paints the garment's fabric canvas and draws
// every saved signature into it at its mapped UV position. Signatures are stored
// as stroke vectors / typed text (never raster), so they render identically
// on every device and reload.
import { TEXTURE_SIZE, templateToPx, templatePxScale, type ShirtType } from './uv';
import type { SignatureRec } from './store';

function fabricBase(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#fcfcf9';
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
  // subtle woven noise, deterministic so every client paints the same fabric
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  ctx.fillStyle = 'rgba(120,120,110,0.05)';
  for (let i = 0; i < 5200; i++) {
    ctx.fillRect(rand() * TEXTURE_SIZE, rand() * TEXTURE_SIZE, 2, 2);
  }
  // gentle vertical shading so the cloth is not flat white
  const g = ctx.createLinearGradient(0, 0, 0, TEXTURE_SIZE);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(160,155,140,0.10)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, TEXTURE_SIZE, TEXTURE_SIZE);
}

const rad = (deg: number) => (deg * Math.PI) / 180;

function rotateAround(x: number, y: number, cx: number, cy: number, deg: number): [number, number] {
  const r = rad(deg); const cos = Math.cos(r), sin = Math.sin(r);
  const dx = x - cx, dy = y - cy;
  return [cx + dx * cos - dy * sin, cy + dx * sin + dy * cos];
}

export function paintSignatures(ctx: CanvasRenderingContext2D, type: ShirtType, signatures: SignatureRec[]) {
  fabricBase(ctx);
  for (const s of signatures) {
    const scale = templatePxScale(type, s.surface);
    const boxW = s.w * scale.x;
    const boxH = s.h * scale.y;
    const [cx, cy] = templateToPx(type, s.surface, s.x, s.y);

    if (s.mode === 'draw' && s.strokes) {
      for (const stroke of s.strokes) {
        ctx.strokeStyle = stroke.color;
        ctx.fillStyle = stroke.color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = Math.max(2.2, stroke.width * boxW);
        const pts = stroke.points.map((p) => {
          const tx = s.x - s.w / 2 + p.x * s.w;
          const ty = s.y - s.h / 2 + p.y * s.h;
          const [rx, ry] = rotateAround(tx, ty, s.x, s.y, s.rotation);
          return templateToPx(type, s.surface, rx, ry);
        });
        if (pts.length === 1) {
          ctx.beginPath(); ctx.arc(pts[0][0], pts[0][1], ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
          ctx.stroke();
        }
      }
    } else if (s.mode === 'type' && s.text) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rad(s.rotation));
      let fontPx = boxH * 0.94;
      ctx.font = `600 ${fontPx}px Caveat, "Segoe Script", cursive`;
      const w = ctx.measureText(s.text).width;
      if (w > boxW) { fontPx *= boxW / w; ctx.font = `600 ${fontPx}px Caveat, "Segoe Script", cursive`; }
      ctx.fillStyle = s.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.text, 0, fontPx * 0.05);
      ctx.restore();
    }
  }
}

export function buildTextureCanvas(type: ShirtType, signatures: SignatureRec[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TEXTURE_SIZE; canvas.height = TEXTURE_SIZE;
  const ctx = canvas.getContext('2d')!;
  paintSignatures(ctx, type, signatures);
  return canvas;
}
