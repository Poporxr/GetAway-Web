import type { SignatureRec } from '@/lib/store';

// Renders one signature (strokes or typed text) inside a box of the given
// template width (fraction of the signing region). Used by the flat template,
// the placement editor and the 2D fallback.
export default function SignaturePreview({
  sig, regionWidthPct,
}: {
  sig: Pick<SignatureRec, 'mode' | 'strokes' | 'text' | 'color' | 'aspect'>;
  regionWidthPct: number; // signature width as % of region width
}) {
  const aspect = Math.max(0.8, Math.min(6, sig.aspect || 2.5));
  if (sig.mode === 'type' && sig.text) {
    return (
      <svg viewBox={`0 0 100 ${100 / aspect}`} style={{ width: '100%', display: 'block', overflow: 'visible' }} aria-label={sig.text}>
        <text
          x="50" y="52%" textAnchor="middle" dominantBaseline="middle"
          textLength={Math.min(97, sig.text.length * 21)} lengthAdjust="spacingAndGlyphs"
          fill={sig.color}
          style={{ fontFamily: 'Caveat, "Segoe Script", cursive', fontWeight: 600, fontSize: `${88 / aspect + 12}px` }}
        >
          {sig.text}
        </text>
      </svg>
    );
  }
  const h = 100 / aspect;
  return (
    <svg viewBox={`0 0 100 ${h}`} style={{ width: '100%', display: 'block', overflow: 'visible' }}>
      {(sig.strokes ?? []).map((stroke, i) => (
        <polyline
          key={i}
          points={stroke.points.map((p) => `${(p.x * 100).toFixed(1)},${(p.y * h).toFixed(1)}`).join(' ')}
          fill="none" stroke={stroke.color} strokeWidth={Math.max(1.6, stroke.width * 100)}
          strokeLinecap="round" strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
