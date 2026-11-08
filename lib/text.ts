// Text-signing support shared by the editor, the 2D preview and the 3D texture
// compositor, so a typed message looks the same in all three places.
// Fonts: one handwriting, one clean sans, one bold display face.
export type TextFontKey = 'hand' | 'sans' | 'display';

export interface TextFont {
  key: TextFontKey;
  label: string;
  blurb: string;
  stack: string; // CSS font-family stack
  weight: number;
  charFactor: number; // rough average glyph width / font-size, for layout estimates
  startFrac: number; // starting font-size as a fraction of box width in the editor
}

export const TEXT_FONTS: TextFont[] = [
  { key: 'hand', label: 'Handwritten', blurb: 'Warm marker scrawl', stack: 'Caveat, "Segoe Script", cursive', weight: 600, charFactor: 0.34, startFrac: 0.34 },
  { key: 'sans', label: 'Clean', blurb: 'Crisp modern sans', stack: 'Inter, system-ui, sans-serif', weight: 600, charFactor: 0.47, startFrac: 0.27 },
  { key: 'display', label: 'Bold display', blurb: 'Big statement letters', stack: '"Archivo Black", Inter, sans-serif', weight: 400, charFactor: 0.58, startFrac: 0.3 },
];

export const DEFAULT_FONT: TextFontKey = 'hand';

export function textFont(key: string | undefined): TextFont {
  return TEXT_FONTS.find((f) => f.key === key) ?? TEXT_FONTS[0];
}

export function canvasFont(key: string | undefined, px: number): string {
  const f = textFont(key);
  return `${f.weight} ${px}px ${f.stack}`;
}

export const LINE_HEIGHT = 1.22;
export const MAX_TEXT_LEN = 48;

/** Curated emoji set for the signing picker. */
export const SIGN_EMOJIS = [
  '🎉', '🎓', '🥳', '🎊', '🏆', '⭐', '🌟', '✨',
  '❤️', '🖤', '💙', '💚', '🧡', '💛', '💯', '🔥',
  '👏', '🙌', '💪', '🫶', '🤝', '✍️', '📚', '🚀',
  '😂', '😎', '🥹', '💐', '🍾', '🎈',
];

/** Greedy word wrap given a per-line max character count (estimate path). */
function wrapByChars(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars || !cur) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * Editor-side estimate of a text block's aspect (width / height) for a box of
 * the given pixel width, without a canvas. The compositor later fits the real
 * glyphs into exactly this box, so small estimate errors only change the
 * final font size slightly, never the layout contract.
 */
export function estimateTextAspect(text: string, fontKey: string | undefined, boxWidthPx: number): number {
  const f = textFont(fontKey);
  const clean = text.trim();
  if (!clean) return 2.5;
  let fontPx = Math.max(10, boxWidthPx * f.startFrac);
  let lines = 1;
  for (let i = 0; i < 6; i++) {
    const maxChars = Math.max(2, Math.floor(boxWidthPx / (fontPx * f.charFactor)));
    lines = wrapByChars(clean, maxChars).length;
    if (lines <= 4) break;
    fontPx *= 0.85;
  }
  const heightPx = Math.max(1, lines) * fontPx * LINE_HEIGHT;
  return Math.max(0.5, Math.min(6, boxWidthPx / heightPx));
}

export interface FittedText { fontPx: number; lines: string[] }

/** Real-measure wrap with a raw width-measuring callback. */
export function wrapMeasured(text: string, maxW: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (!cur || measure(next) <= maxW) cur = next;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

/**
 * Fit text into a pixel box with a real canvas context: wraps on measured
 * glyph widths and shrinks the font until every line fits the box. Used by
 * both the 2048px shirt texture and the small placement preview so the two
 * always agree. Emojis are ordinary glyphs to fillText and render in colour.
 */
export function fitTextToBox(
  ctx: CanvasRenderingContext2D,
  text: string,
  fontKey: string | undefined,
  boxW: number,
  boxH: number,
): FittedText {
  const clean = text.trim();
  let fontPx = Math.max(8, boxH);
  let lines: string[] = [clean];
  for (let i = 0; i < 28; i++) {
    ctx.font = canvasFont(fontKey, fontPx);
    lines = wrapMeasured(clean, boxW, (s) => ctx.measureText(s).width);
    let widest = 0;
    for (const l of lines) widest = Math.max(widest, ctx.measureText(l).width);
    const heightNeeded = lines.length * fontPx * LINE_HEIGHT;
    if (widest <= boxW + 0.5 && heightNeeded <= boxH + 0.5) break;
    const scale = Math.min(widest > 0 ? boxW / widest : 1, boxH / Math.max(1, heightNeeded));
    fontPx = Math.max(6, fontPx * Math.min(0.99, scale));
  }
  ctx.font = canvasFont(fontKey, fontPx);
  lines = wrapMeasured(clean, boxW, (s) => ctx.measureText(s).width);
  return { fontPx, lines };
}
