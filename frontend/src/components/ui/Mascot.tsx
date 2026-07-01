/**
 * Zafar — AbituriyentAI's mascot.
 *
 * A friendly, geometric fox wearing a graduation cap.
 * Inherits the brand gradient (#f97316 → #e11d48 → #7c3aed).
 *
 * Moods:
 *   happy       — big grin, tiny ambient sparkle
 *   thinking    — slight smile, thought-bubble dots
 *   celebrating — wide grin, confetti stars bursting
 *   waving      — grin + raised right arm
 *   studying    — neutral expression, holding open book
 */

interface MascotProps {
  size?: number;
  mood?: "happy" | "thinking" | "celebrating" | "waving" | "studying";
  showName?: boolean;
  className?: string;
}

// ── Tiny 4-point star helper ──────────────────────────────────────────────────
function Star4({ cx, cy, r, fill }: { cx: number; cy: number; r: number; fill: string }) {
  const p = (angle: number, radius: number) => {
    const a = (angle * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };
  const pts = [
    ...p(0, r), ...p(90, r * 0.38), ...p(90, r),
    ...p(180, r * 0.38), ...p(180, r), ...p(270, r * 0.38),
    ...p(270, r), ...p(360, r * 0.38),
  ];
  return <polygon points={pts.join(",")} fill={fill} />;
}

export function Mascot({ size = 160, mood = "happy", showName = false, className = "" }: MascotProps) {
  // Unique IDs per render to avoid SVG gradient collision when multiple instances used
  const uid = `zfr-${size}-${mood}`;

  return (
    <span className={`inline-flex flex-col items-center gap-1 select-none ${className}`}>
      <svg
        width={size}
        height={Math.round(size * 1.3)}
        viewBox="0 0 160 208"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Zafar — AbituriyentAI maskoti"
      >
        <defs>
          {/* Brand gradient: amber → rose → violet */}
          <linearGradient id={`${uid}-fur`} x1="20" y1="0" x2="140" y2="208" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#f97316" />
            <stop offset="48%"  stopColor="#e11d48" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
          {/* Inner ear / belly highlight */}
          <linearGradient id={`${uid}-light`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          {/* Cap gradient */}
          <linearGradient id={`${uid}-cap`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
          {/* Soft drop shadow */}
          <filter id={`${uid}-shadow`} x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#7c3aed" floodOpacity="0.18" />
          </filter>
          {/* Eye glow */}
          <filter id={`${uid}-glow`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ════════════════════════════════════════
            1. TAIL  (behind body — drawn first)
            ════════════════════════════════════════ */}
        <path
          d="M118,158 Q152,140 149,116 Q146,97 132,105 Q123,114 127,138 Q129,153 120,163 Z"
          fill={`url(#${uid}-fur)`}
        />
        {/* Fluffy tail tip */}
        <ellipse cx="136" cy="106" rx="9" ry="7" fill="#fef9ee" transform="rotate(-35,136,106)" />

        {/* ════════════════════════════════════════
            2. BODY  (sitting oval)
            ════════════════════════════════════════ */}
        <ellipse
          cx="80" cy="158" rx="38" ry="34"
          fill={`url(#${uid}-fur)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Belly patch */}
        <ellipse cx="80" cy="163" rx="22" ry="21" fill="#fef9ee" />

        {/* ── Book (studying mood) ── */}
        {mood === "studying" && (
          <g transform="translate(50,168)">
            {/* Book cover left */}
            <path d="M0,0 Q0,-3 3,-3 L28,-3 L28,26 L3,26 Q0,26 0,23 Z" fill="#3b82f6" />
            {/* Book cover right */}
            <path d="M32,-3 L57,-3 Q60,-3 60,0 L60,23 Q60,26 57,26 L32,26 Z" fill="#2563eb" />
            {/* Spine */}
            <rect x="28" y="-3" width="4" height="29" fill="#1d4ed8" />
            {/* Pages lines */}
            <line x1="5" y1="4" x2="26" y2="4" stroke="white" strokeWidth="1.2" opacity="0.6" />
            <line x1="5" y1="8" x2="26" y2="8" stroke="white" strokeWidth="1.2" opacity="0.6" />
            <line x1="5" y1="12" x2="26" y2="12" stroke="white" strokeWidth="1.2" opacity="0.6" />
            <line x1="34" y1="4" x2="55" y2="4" stroke="white" strokeWidth="1.2" opacity="0.6" />
            <line x1="34" y1="8" x2="55" y2="8" stroke="white" strokeWidth="1.2" opacity="0.6" />
            <line x1="34" y1="12" x2="55" y2="12" stroke="white" strokeWidth="1.2" opacity="0.6" />
          </g>
        )}

        {/* ── Paws ── */}
        <ellipse cx="52" cy="188" rx="15" ry="7" fill={`url(#${uid}-fur)`} />
        <ellipse cx="108" cy="188" rx="15" ry="7" fill={`url(#${uid}-fur)`} />
        {/* Toe notches */}
        {[45, 52, 59].map(x => (
          <line key={x} x1={x} y1="190" x2={x} y2="193" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" />
        ))}
        {[101, 108, 115].map(x => (
          <line key={x} x1={x} y1="190" x2={x} y2="193" stroke="rgba(0,0,0,0.18)" strokeWidth="1.5" strokeLinecap="round" />
        ))}

        {/* ── Waving arm ── */}
        {mood === "waving" && (
          <path
            d="M117,150 Q136,136 140,122 Q143,112 136,110"
            stroke={`url(#${uid}-fur)`} strokeWidth="13"
            fill="none" strokeLinecap="round"
          />
        )}

        {/* ════════════════════════════════════════
            3. HEAD
            ════════════════════════════════════════ */}

        {/* Ears — drawn BEFORE head so head overlaps base */}
        {/* Left ear */}
        <polygon points="38,80 50,42 72,72" fill={`url(#${uid}-fur)`} />
        {/* Right ear */}
        <polygon points="88,72 110,42 122,80" fill={`url(#${uid}-fur)`} />
        {/* Inner ear highlights */}
        <polygon points="42,77 50,52 68,70" fill={`url(#${uid}-light)`} opacity="0.65" />
        <polygon points="92,70 110,52 118,77" fill={`url(#${uid}-light)`} opacity="0.65" />

        {/* Head circle */}
        <circle
          cx="80" cy="94" r="40"
          fill={`url(#${uid}-fur)`}
          filter={`url(#${uid}-shadow)`}
        />

        {/* Muzzle patch */}
        <ellipse cx="80" cy="108" rx="18" ry="14" fill="#fef9ee" />

        {/* ════════════════════════════════════════
            4. FACE DETAILS
            ════════════════════════════════════════ */}

        {/* Left eye white */}
        <circle cx="66" cy="88" r="11" fill="white" />
        {/* Left pupil */}
        <circle cx="67" cy="89" r="7.5" fill="#1e1b4b" filter={`url(#${uid}-glow)`} />
        {/* Left eye shines */}
        <circle cx="69.5" cy="86" r="2.8" fill="white" />
        <circle cx="72"   cy="91" r="1.1" fill="rgba(255,255,255,0.5)" />

        {/* Right eye white */}
        <circle cx="94" cy="88" r="11" fill="white" />
        {/* Right pupil */}
        <circle cx="95" cy="89" r="7.5" fill="#1e1b4b" filter={`url(#${uid}-glow)`} />
        {/* Right eye shines */}
        <circle cx="97.5" cy="86" r="2.8" fill="white" />
        <circle cx="100"  cy="91" r="1.1" fill="rgba(255,255,255,0.5)" />

        {/* Eyebrow arches — friendly, slightly raised */}
        <path d="M57,80 Q66,74 75,79" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />
        <path d="M85,79 Q94,74 103,80" stroke="#7c3aed" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.45" />

        {/* ── Thinking brow (one raised) ── */}
        {mood === "thinking" && (
          <path d="M85,77 Q94,70 103,77" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.8" />
        )}

        {/* Nose */}
        <ellipse cx="80" cy="107" rx="5.5" ry="3.8" fill="#1e1b4b" />
        <ellipse cx="79" cy="106" rx="1.8" ry="1.2" fill="rgba(255,255,255,0.35)" />

        {/* ── Mouth / Expression ── */}
        {(mood === "happy" || mood === "waving") && (
          /* Wide friendly grin */
          <path d="M71,114 Q80,123 89,114" stroke="#1e1b4b" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
        {mood === "celebrating" && (
          /* Big open grin */
          <>
            <path d="M69,113 Q80,125 91,113" stroke="#1e1b4b" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            {/* Cheek blush */}
            <circle cx="57" cy="100" r="7" fill="#f87171" opacity="0.22" />
            <circle cx="103" cy="100" r="7" fill="#f87171" opacity="0.22" />
          </>
        )}
        {mood === "thinking" && (
          /* Slight pensive smile */
          <path d="M74,114 Q80,119 86,114" stroke="#1e1b4b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}
        {mood === "studying" && (
          /* Focused neutral */
          <path d="M75,113 L85,113" stroke="#1e1b4b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        )}

        {/* ════════════════════════════════════════
            5. GRADUATION CAP
            ════════════════════════════════════════ */}
        {/* Cap body (sits on head, between ears) */}
        <rect x="60" y="54" width="40" height="12" rx="2" fill={`url(#${uid}-cap)`} />
        {/* Mortarboard flat top */}
        <rect x="48" y="50" width="64" height="7" rx="3" fill="#312e81" />
        {/* Board highlight strip */}
        <rect x="50" y="51" width="20" height="2" rx="1" fill="rgba(255,255,255,0.12)" />
        {/* Top button */}
        <circle cx="80" cy="50" r="3.5" fill="#7c3aed" />
        {/* Tassel cord */}
        <path d="M112,53 Q116,60 114,70" stroke="#f97316" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        {/* Tassel end decoration */}
        <circle cx="114" cy="73" r="5" fill="#f97316" />
        <line x1="111" y1="75" x2="110" y2="82" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="114" y1="77" x2="114" y2="84" stroke="#e11d48" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="117" y1="75" x2="118" y2="82" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" />

        {/* ════════════════════════════════════════
            6. MOOD-SPECIFIC EFFECTS
            ════════════════════════════════════════ */}

        {/* Happy — tiny ambient sparkle */}
        {mood === "happy" && (
          <>
            <Star4 cx={145} cy={74} r={5} fill="#fbbf24" />
            <circle cx="17"  cy="118" r="2.5" fill="#7c3aed" opacity="0.6" />
            <circle cx="148" cy="140" r="1.8" fill="#f97316" opacity="0.5" />
          </>
        )}

        {/* Thinking — thought bubble */}
        {mood === "thinking" && (
          <>
            <circle cx="118" cy="70" r="3.5" fill="#7c3aed" opacity="0.55" />
            <circle cx="127" cy="60" r="5"   fill="#7c3aed" opacity="0.70" />
            <circle cx="138" cy="48" r="7"   fill="#7c3aed" opacity="0.85" />
            {/* Question mark inside bubble */}
            <text x="135" y="52" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">?</text>
          </>
        )}

        {/* Celebrating — confetti burst */}
        {mood === "celebrating" && (
          <g>
            <Star4 cx={22}  cy={52}  r={7}   fill="#fbbf24" />
            <Star4 cx={143} cy={38}  r={5.5} fill="#7c3aed" />
            <Star4 cx={140} cy={152} r={4.5} fill="#f97316" />
            <Star4 cx={18}  cy={155} r={4}   fill="#e11d48" />
            <circle cx="30"  cy="88"  r="3" fill="#fbbf24"  opacity="0.8" />
            <circle cx="148" cy="95"  r="2.5" fill="#7c3aed" opacity="0.8" />
            <circle cx="25"  cy="170" r="2" fill="#f97316"  opacity="0.7" />
            <circle cx="145" cy="172" r="2" fill="#fbbf24"  opacity="0.7" />
            {/* Confetti ribbons */}
            <path d="M20,62 Q26,70 20,78"   stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
            <path d="M143,58 Q137,66 143,74" stroke="#fbbf24" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.7" />
          </g>
        )}

        {/* Waving — small sparkle near hand */}
        {mood === "waving" && (
          <>
            <Star4 cx={146} cy={108} r={5} fill="#fbbf24" />
            <circle cx="152" cy="120" r="2" fill="#7c3aed" opacity="0.6" />
          </>
        )}

        {/* Studying — small floating letters */}
        {mood === "studying" && (
          <g opacity="0.6">
            <text x="20"  y="62"  fontSize="9" fontWeight="bold" fill="#f97316">∫</text>
            <text x="142" y="56"  fontSize="9" fontWeight="bold" fill="#7c3aed">π</text>
            <text x="15"  y="135" fontSize="9" fontWeight="bold" fill="#e11d48">∑</text>
            <text x="143" y="135" fontSize="9" fontWeight="bold" fill="#fbbf24">√</text>
          </g>
        )}
      </svg>

      {showName && (
        <div className="text-center mt-0.5">
          <p className="font-black text-slate-800 text-sm tracking-tight">Zafar</p>
          <p className="text-[10px] text-slate-400 font-medium">AbituriyentAI maskoti</p>
        </div>
      )}
    </span>
  );
}
