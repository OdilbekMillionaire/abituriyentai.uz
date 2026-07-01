/**
 * AbituriyentAI Logo — a strange, minimalist geometric fox face.
 *
 * Design intent: two sharp triangular ears + two angular "eyes" made of
 * overlapping rhombuses, all floating with no body. The silhouette reads
 * instantly as a face yet is abstract enough to be mysterious.
 * Color: fiery amber-orange → electric violet gradient (bold, unlike any
 * typical education product).
 */

interface LogoProps {
  size?: number;
  showName?: boolean;
  light?: boolean;       // true = name is white (for dark BGs), false = dark
  className?: string;
}

export function Logo({ size = 32, showName = false, light = true, className = "" }: LogoProps) {
  const g1 = `logo-g1-${size}`;
  const g2 = `logo-g2-${size}`;
  const glow = `logo-glow-${size}`;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="AbituriyentAI"
      >
        <defs>
          {/* Warm amber → vivid violet */}
          <linearGradient id={g1} x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f97316" />
            <stop offset="50%"  stopColor="#e11d48" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          {/* Eye accent: bright orange → white */}
          <linearGradient id={g2} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#fff7ed" />
          </linearGradient>
          {/* Soft glow for pupils */}
          <filter id={glow} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="b" />
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Left ear (sharp triangle) ─────────────────────────── */}
        <polygon
          points="10,38 18,6 28,30"
          fill={`url(#${g1})`}
        />
        {/* ── Right ear (sharp triangle) ────────────────────────── */}
        <polygon
          points="54,38 46,6 36,30"
          fill={`url(#${g1})`}
        />

        {/* ── Face — wide flat pentagon ─────────────────────────── */}
        <polygon
          points="10,38 16,58 32,62 48,58 54,38 32,28"
          fill={`url(#${g1})`}
        />

        {/* ── Left eye socket (dark recess) ─────────────────────── */}
        <polygon
          points="18,36 24,30 30,36 24,42"
          fill="rgba(0,0,0,0.45)"
        />
        {/* ── Right eye socket ──────────────────────────────────── */}
        <polygon
          points="34,36 40,30 46,36 40,42"
          fill="rgba(0,0,0,0.45)"
        />

        {/* ── Left pupil (glowing rhombus) ──────────────────────── */}
        <polygon
          points="24,32.5 27,36 24,39.5 21,36"
          fill={`url(#${g2})`}
          filter={`url(#${glow})`}
        />
        {/* ── Right pupil ───────────────────────────────────────── */}
        <polygon
          points="40,32.5 43,36 40,39.5 37,36"
          fill={`url(#${g2})`}
          filter={`url(#${glow})`}
        />

        {/* ── Muzzle patch (small light diamond) ────────────────── */}
        <polygon
          points="32,46 36,50 32,54 28,50"
          fill="rgba(255,255,255,0.22)"
        />

        {/* ── Inner ear highlights ──────────────────────────────── */}
        <polygon points="13,36 18,14 24,30" fill="rgba(251,191,36,0.35)" />
        <polygon points="51,36 46,14 40,30" fill="rgba(251,191,36,0.35)" />
      </svg>

      {showName && (
        <span
          className={`font-black tracking-tight leading-none select-none ${
            light ? "text-white" : "text-slate-900"
          }`}
          style={{ fontSize: size * 0.5 }}
        >
          Abituriyent<span className={light ? "text-orange-400" : "text-violet-600"}>AI</span>
        </span>
      )}
    </span>
  );
}
