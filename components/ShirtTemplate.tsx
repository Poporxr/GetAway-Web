import type { ReactNode } from 'react';
import type { ShirtType, Surface } from '@/lib/uv';
import type { SignatureRec } from '@/lib/localstore';
import SignaturePreview from './SignaturePreview';

const SILHOUETTES: Record<ShirtType, string> = {
  tee: 'M82 26 L48 40 L26 92 L62 106 L62 214 Q62 226 74 226 L166 226 Q178 226 178 214 L178 106 L214 92 L192 40 L158 26 Q120 46 82 26 Z',
  longsleeve:
    'M82 26 L50 38 L36 196 Q35 208 46 208 L62 208 Q71 208 71 197 L73 128 L73 214 Q73 226 85 226 L155 226 Q167 226 167 214 L167 128 L169 197 Q169 208 178 208 L194 208 Q205 208 204 196 L190 38 L158 26 Q120 46 82 26 Z',
};

// The signing region inside the silhouette (presentational mapping; the
// editor measures this box for exact template coordinates).
export const REGION_STYLE = { left: '29%', top: '21%', width: '42%', height: '60%' } as const;

export default function ShirtTemplate({
  type, surface, signatures = [], children, regionRef,
}: {
  type: ShirtType;
  surface: Surface;
  signatures?: SignatureRec[];
  children?: ReactNode;
  regionRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="relative mx-auto w-full max-w-[340px] select-none">
      <svg viewBox="0 0 240 240" className="w-full drop-shadow-sm" role="img" aria-label={`${type} ${surface} template`}>
        <path d={SILHOUETTES[type]} fill="#f7f5ef" stroke="#d8d2c4" strokeWidth="2.5" />
        {type === 'longsleeve' && (
          <g stroke="#d8d2c4" strokeWidth="2">
            <line x1="120" y1="42" x2="120" y2="226" strokeDasharray="5 5" />
            {[70, 105, 140, 175, 208].map((y) => (
              <circle key={y} cx="120" cy={y} r="3" fill="#efece3" />
            ))}
          </g>
        )}
        <text x="120" y="240" textAnchor="middle" fontSize="0.1" fill="none">{surface}</text>
      </svg>
      <div
        ref={regionRef}
        className="absolute rounded-lg border-2 border-dashed border-violet-300/80 bg-violet-50/30"
        style={REGION_STYLE}
      >
        {signatures.map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`,
              transform: `translate(-50%,-50%) rotate(${s.rotation}deg)`,
            }}
          >
            <SignaturePreview sig={s} regionWidthPct={s.w * 100} />
          </div>
        ))}
        {children}
      </div>
      <p className="mt-1 text-center text-[11px] font-medium uppercase tracking-widest text-stone-400">
        {surface === 'front' ? 'Front' : 'Back'}
      </p>
    </div>
  );
}
