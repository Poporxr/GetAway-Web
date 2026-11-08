import type { Surface } from './uv';
import { templatePxScale, type ShirtType } from './uv';

// Signature footprint, shared by the editor (client) and the API (server) so
// bounds + collision validation can never drift apart.
// Width is a fraction of the signing-region width, by entitlement size.
export const SIZE_WIDTH: Record<number, number> = { 1: 0.36, 2: 0.5, 3: 0.62, 4: 0.76 };
export const MAX_SIGNATURES_PER_SHIRT = 60;

export interface Box { x: number; y: number; w: number; h: number }

export function signatureBox(type: ShirtType, surface: Surface, size: number, aspect: number, cx: number, cy: number): Box {
  const w = SIZE_WIDTH[size] ?? SIZE_WIDTH[1];
  const scale = templatePxScale(type, surface); // px per template unit
  const h = (w * scale.x) / (Math.max(0.8, Math.min(6, aspect)) * scale.y);
  return { x: cx, y: cy, w, h };
}

export function withinBounds(b: Box): boolean {
  return b.x - b.w / 2 >= -0.001 && b.x + b.w / 2 <= 1.001 && b.y - b.h / 2 >= -0.001 && b.y + b.h / 2 <= 1.001;
}

export function overlaps(a: Box, b: Box, pad = 0.012): boolean {
  return (
    Math.abs(a.x - b.x) * 2 < a.w + b.w + pad * 2 &&
    Math.abs(a.y - b.y) * 2 < a.h + b.h + pad * 2
  );
}

export function findCollision(type: ShirtType, surface: Surface, candidate: Box, existing: { surface: Surface; x: number; y: number; w: number; h: number }[]): boolean {
  return existing
    .filter((s) => s.surface === surface)
    .some((s) => overlaps(candidate, { x: s.x, y: s.y, w: s.w, h: s.h }));
}
