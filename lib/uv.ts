import regions from './uv-regions.json';

export type ShirtType = 'tee' | 'longsleeve';
export type Surface = 'front' | 'back';

export interface UVRegion { u0: number; v0: number; u1: number; v1: number; flipU: boolean }
interface ModelCfg {
  bbox: { min: number[]; max: number[]; center: number[]; size: number[] };
  frontIsPlusZ: boolean;
  front: UVRegion;
  back: UVRegion;
}

export const MODELS: Record<ShirtType, { file: string; label: string; blurb: string }> = {
  tee: {
    file: 'https://res.cloudinary.com/doc3mb9if/raw/upload/v1794134836/signout/tee.glb',
    label: 'Classic Tee',
    blurb: 'Short-sleeve · pure white · oversized crew neck',
  },
  longsleeve: {
    file: 'https://res.cloudinary.com/doc3mb9if/raw/upload/v1794134837/signout/longsleeve.glb',
    label: 'Long-Sleeve Shirt',
    blurb: 'Long-sleeve · pure white · relaxed fit',
  },
};

export const TEXTURE_SIZE = 2048;
export const cfg = regions as unknown as Record<ShirtType, ModelCfg>;

export function regionFor(type: ShirtType, surface: Surface): UVRegion {
  return cfg[type][surface];
}

/** Template coords (tx: 0 left → 1 right as you look at that side; ty: 0 top → 1 bottom) → UV. */
export function templateToUV(type: ShirtType, surface: Surface, tx: number, ty: number): [number, number] {
  const r = regionFor(type, surface);
  const u = r.flipU ? r.u1 - tx * (r.u1 - r.u0) : r.u0 + tx * (r.u1 - r.u0);
  const v = r.v1 - ty * (r.v1 - r.v0);
  return [u, v];
}

/** UV → canvas pixels. CanvasTexture uses flipY=false, so v=1 is the canvas top row. */
export function uvToPx(u: number, v: number): [number, number] {
  return [u * TEXTURE_SIZE, (1 - v) * TEXTURE_SIZE];
}

export function templateToPx(type: ShirtType, surface: Surface, tx: number, ty: number): [number, number] {
  const [u, v] = templateToUV(type, surface, tx, ty);
  return uvToPx(u, v);
}

/** Pixel size of one template unit on each axis (for stroke widths / text sizing). */
export function templatePxScale(type: ShirtType, surface: Surface): { x: number; y: number } {
  const r = regionFor(type, surface);
  return { x: (r.u1 - r.u0) * TEXTURE_SIZE, y: (r.v1 - r.v0) * TEXTURE_SIZE };
}
