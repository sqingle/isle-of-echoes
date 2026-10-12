/* Reusable SVG scenery. Every structure is drawn around its own origin (0,0) = ground contact,
   centred, with "up" being negative y, so the island map and the full-screen backdrops can both
   place and scale the same pieces. All gradients live in <ArtDefs/>; mount it once per <svg>. */

import type { CSSProperties, ReactNode } from "react";

export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const r1 = (n: number) => Math.round(n * 10) / 10;

export function gearPath(cx: number, cy: number, R: number, teeth: number, depth: number) {
  const step = (Math.PI * 2) / teeth;
  const pts: string[] = [];
  for (let i = 0; i < teeth; i++) {
    const a = i * step;
    const seq: [number, number][] = [
      [0.04, R - depth],
      [0.16, R],
      [0.46, R],
      [0.58, R - depth],
    ];
    for (const [f, rad] of seq) {
      const ang = a + f * step;
      pts.push(`${r1(cx + Math.cos(ang) * rad)} ${r1(cy + Math.sin(ang) * rad)}`);
    }
  }
  return `M${pts.join("L")}Z`;
}

export function ArtDefs({ p = "a" }: { p?: string }) {
  return (
    <defs>
      <linearGradient id={`${p}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#1f5a9c" />
        <stop offset="0.45" stopColor="#5f9bcb" />
        <stop offset="0.82" stopColor="#c9dbe0" />
        <stop offset="1" stopColor="#efdcab" />
      </linearGradient>
      <radialGradient id={`${p}-sun`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff1c2" stopOpacity="0.95" />
        <stop offset="0.35" stopColor="#f7d98a" stopOpacity="0.45" />
        <stop offset="1" stopColor="#f7d98a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-sea`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#7eb6c4" />
        <stop offset="0.25" stopColor="#3a8ba4" />
        <stop offset="1" stopColor="#0f3b52" />
      </linearGradient>
      <linearGradient id={`${p}-haze`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f6e6b8" stopOpacity="0" />
        <stop offset="0.5" stopColor="#f6e6b8" stopOpacity="0.5" />
        <stop offset="1" stopColor="#f6e6b8" stopOpacity="0" />
      </linearGradient>
      <linearGradient id={`${p}-col`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8d7d63" />
        <stop offset="0.35" stopColor="#d9c9a6" />
        <stop offset="0.7" stopColor="#bba98a" />
        <stop offset="1" stopColor="#7a6b53" />
      </linearGradient>
      <linearGradient id={`${p}-stone`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a8d8c" />
        <stop offset="0.5" stopColor="#c0c2bd" />
        <stop offset="1" stopColor="#6d7070" />
      </linearGradient>
      <linearGradient id={`${p}-stoneDark`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a4f52" />
        <stop offset="0.5" stopColor="#70767a" />
        <stop offset="1" stopColor="#363a3d" />
      </linearGradient>
      <linearGradient id={`${p}-rock`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#d58a4c" />
        <stop offset="0.55" stopColor="#a8532b" />
        <stop offset="1" stopColor="#6b2f19" />
      </linearGradient>
      <linearGradient id={`${p}-rockLit`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#efab68" />
        <stop offset="1" stopColor="#c0693a" />
      </linearGradient>
      <linearGradient id={`${p}-grass`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a7b85a" />
        <stop offset="1" stopColor="#5f7a30" />
      </linearGradient>
      <linearGradient id={`${p}-sand`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f0d79c" />
        <stop offset="1" stopColor="#b98f55" />
      </linearGradient>
      <radialGradient id={`${p}-dome`} cx="0.35" cy="0.25" r="0.9">
        <stop offset="0" stopColor="#9fd0ea" />
        <stop offset="0.35" stopColor="#3d78ad" />
        <stop offset="1" stopColor="#14355b" />
      </radialGradient>
      <radialGradient id={`${p}-rust`} cx="0.4" cy="0.35" r="0.85">
        <stop offset="0" stopColor="#c8764b" />
        <stop offset="0.6" stopColor="#8e4528" />
        <stop offset="1" stopColor="#4d2113" />
      </radialGradient>
      <radialGradient id={`${p}-lamp`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#fff6cf" />
        <stop offset="0.3" stopColor="#ffd96a" />
        <stop offset="1" stopColor="#ffd96a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${p}-wood`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#a8825a" />
        <stop offset="1" stopColor="#6c4a2d" />
      </linearGradient>
      <linearGradient id={`${p}-metal`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#d9bd9d" />
        <stop offset="0.5" stopColor="#f3e3c4" />
        <stop offset="1" stopColor="#a58665" />
      </linearGradient>
      <filter id={`${p}-blur`} x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <filter id={`${p}-blur-s`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="4" />
      </filter>
    </defs>
  );
}

/* ------------------------------------------------------------------ */
/* Sky and sea                                                         */
/* ------------------------------------------------------------------ */

export function Sky({ p, w, h, sun = { x: 260, y: 140 } }: { p: string; w: number; h: number; sun?: { x: number; y: number } }) {
  return (
    <g>
      <rect width={w} height={h} fill={`url(#${p}-sky)`} />
      <circle cx={sun.x} cy={sun.y} r={Math.max(w, h) * 0.34} fill={`url(#${p}-sun)`} />
    </g>
  );
}

export function Clouds({ p, w, y = 20, scale = 1, seed = 4 }: { p: string; w: number; y?: number; scale?: number; seed?: number }) {
  const rand = rng(seed);
  const layers = [0, 1, 2];
  return (
    <g>
      {layers.map((l) => (
        <g
          key={l}
          className={l === 1 ? "animate-drift-slow" : "animate-drift"}
          style={{ animationDelay: `${-l * 23}s` } as CSSProperties}
          opacity={0.55 + l * 0.12}
        >
          {Array.from({ length: 5 }).map((_, i) => {
            const cx = (w / 5) * i + rand() * 140 - 40 + l * 40;
            const cy = y + l * 46 * scale + rand() * 34;
            const rx = (110 + rand() * 120) * scale;
            return (
              <g key={i} filter={`url(#${p}-blur)`}>
                <ellipse cx={cx} cy={cy} rx={rx} ry={rx * 0.2} fill="#fffaf0" />
                <ellipse cx={cx + rx * 0.3} cy={cy - rx * 0.1} rx={rx * 0.55} ry={rx * 0.17} fill="#ffffff" />
                <ellipse cx={cx - rx * 0.1} cy={cy + rx * 0.1} rx={rx * 0.8} ry={rx * 0.1} fill="#b8cfe0" opacity="0.7" />
              </g>
            );
          })}
        </g>
      ))}
    </g>
  );
}

export function Sea({ p, w, y, h, glints = 60, seed = 9 }: { p: string; w: number; y: number; h: number; glints?: number; seed?: number }) {
  const rand = rng(seed);
  return (
    <g>
      <rect y={y} width={w} height={h} fill={`url(#${p}-sea)`} />
      <rect y={y - 26} width={w} height={70} fill={`url(#${p}-haze)`} />
      {Array.from({ length: glints }).map((_, i) => {
        const gy = y + 8 + Math.pow(rand(), 1.6) * (h - 12);
        const depth = (gy - y) / h;
        const gx = rand() * w;
        const len = 14 + depth * 70 * rand();
        return (
          <rect
            key={i}
            x={gx}
            y={gy}
            width={len}
            height={1.2 + depth * 2.4}
            rx="1"
            fill="#f2f5e8"
            className="animate-shimmer"
            style={{ animationDelay: `${-rand() * 7}s`, animationDuration: `${5 + rand() * 5}s` }}
            opacity="0.4"
          />
        );
      })}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Nature                                                              */
/* ------------------------------------------------------------------ */

export function Pine({ x, y, h, tone = 0 }: { x: number; y: number; h: number; tone?: number }) {
  const w = h * 0.36;
  const fills = ["#2c4a2a", "#355a30", "#21381f", "#3b6034"];
  const c = fills[tone % fills.length];
  return (
    <g>
      <rect x={x - 1.4} y={y - h * 0.14} width="2.8" height={h * 0.14} fill="#3a2a1a" />
      <polygon points={`${x},${y - h} ${x - w * 0.55},${y - h * 0.46} ${x + w * 0.55},${y - h * 0.46}`} fill={c} />
      <polygon points={`${x},${y - h * 0.72} ${x - w * 0.78},${y - h * 0.2} ${x + w * 0.78},${y - h * 0.2}`} fill={c} />
      <polygon points={`${x},${y - h * 0.45} ${x - w},${y - h * 0.08} ${x + w},${y - h * 0.08}`} fill={c} />
      <polygon points={`${x},${y - h} ${x + w * 0.55},${y - h * 0.46} ${x + w * 0.1},${y - h * 0.46}`} fill="#000" opacity="0.18" />
    </g>
  );
}

export function Forest({ x0, x1, y0, y1, count, seed = 3, scale = 1, avoid }: {
  p?: string;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  count: number;
  seed?: number;
  scale?: number;
  avoid?: { x0: number; x1: number; y0: number; y1: number };
}) {
  const rand = rng(seed);
  const trees: { x: number; y: number; h: number; t: number }[] = [];
  for (let i = 0; i < count; i++) {
    const y = y0 + rand() * (y1 - y0);
    const x = x0 + rand() * (x1 - x0);
    if (avoid && x > avoid.x0 && x < avoid.x1 && y > avoid.y0 && y < avoid.y1) continue;
    const depth = (y - y0) / (y1 - y0);
    trees.push({ x, y, h: (26 + depth * 34 + rand() * 12) * scale, t: Math.floor(rand() * 4) });
  }
  trees.sort((a, b) => a.y - b.y);
  return (
    <g>
      {trees.map((t, i) => (
        <Pine key={i} x={t.x} y={t.y} h={t.h} tone={t.t} />
      ))}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Structures (origin = ground, centred)                               */
/* ------------------------------------------------------------------ */

export function Column({ p, x, y, h, w }: { p: string; x: number; y: number; h: number; w: number }) {
  const cap = h * 0.1;
  return (
    <g>
      <ellipse cx={x} cy={y} rx={w * 0.9} ry={w * 0.22} fill="#000" opacity="0.28" />
      <rect x={x - w * 0.78} y={y - h * 0.07} width={w * 1.56} height={h * 0.07} fill={`url(#${p}-col)`} />
      <rect x={x - w / 2} y={y - h + cap} width={w} height={h - cap - h * 0.07} fill={`url(#${p}-col)`} />
      {[-0.26, 0, 0.26].map((f) => (
        <rect key={f} x={x + f * w - 0.5} y={y - h + cap} width="1" height={h - cap - h * 0.07} fill="#5a4c37" opacity="0.4" />
      ))}
      <rect x={x - w * 0.7} y={y - h + cap * 0.35} width={w * 1.4} height={cap * 0.65} fill={`url(#${p}-col)`} />
      <rect x={x - w * 0.85} y={y - h} width={w * 1.7} height={cap * 0.45} fill={`url(#${p}-col)`} />
      <rect x={x - w * 0.85} y={y - h} width={w * 1.7} height="1" fill="#fff" opacity="0.35" />
    </g>
  );
}

export function Lamp({ p, x = 0, y = 0, s = 1 }: { p: string; x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cy="-26" r="22" fill={`url(#${p}-lamp)`} className="animate-flicker" />
      <rect x="-1.5" y="-18" width="3" height="18" fill="#2a2620" />
      <circle cy="-22" r="5.5" fill="#fff0b0" />
    </g>
  );
}

export function Colonnade({ p }: { p: string }) {
  const cols = [
    { x: 92, y: -15, h: 44, w: 8 },
    { x: 66, y: -14, h: 48, w: 8.6 },
    { x: 40, y: -12, h: 52, w: 9.2 },
    { x: 10, y: -8, h: 57, w: 10 },
    { x: -26, y: -3, h: 62, w: 10.8 },
    { x: -66, y: 4, h: 68, w: 11.6 },
    { x: -112, y: 12, h: 74, w: 12.4 },
  ];
  return (
    <g>
      <ellipse cx="-8" cy="6" rx="130" ry="14" fill="#000" opacity="0.22" />
      <ellipse cx="-30" cy="14" rx="26" ry="7" fill={`url(#${p}-stone)`} />
      <ellipse cx="-30" cy="11" rx="22" ry="5.5" fill="#cfd1c8" />
      {cols.map((c, i) => (
        <Column key={i} p={p} {...c} />
      ))}
      <Lamp p={p} x={-136} y={22} s={0.9} />
    </g>
  );
}

export function Library({ p }: { p: string }) {
  return (
    <g>
      <ellipse cx="0" cy="3" rx="90" ry="9" fill="#000" opacity="0.25" />
      <rect x="-96" y="-34" width="30" height="34" fill={`url(#${p}-stoneDark)`} />
      <rect x="-70" y="-46" width="140" height="46" fill={`url(#${p}-stone)`} />
      {[-52, -30, -8, 14, 36, 54].map((x) => (
        <rect key={x} x={x} y="-38" width="10" height="24" fill="#2c3338" opacity="0.8" />
      ))}
      <rect x="-70" y="-50" width="140" height="6" fill="#d8d9d2" />
      <polygon points="-76,-50 0,-98 76,-50" fill={`url(#${p}-sand)`} />
      <polygon points="0,-98 76,-50 34,-50" fill="#7f5a2b" opacity="0.38" />
      <polygon points="-76,-50 0,-98 -8,-50" fill="#fff" opacity="0.14" />
      <rect x="-14" y="-24" width="28" height="24" fill="#1d2326" />
      <rect x="-70" y="-6" width="140" height="6" fill="#7e8281" />
    </g>
  );
}

export function Dome({ p }: { p: string }) {
  return (
    <g>
      <ellipse cx="0" cy="4" rx="58" ry="9" fill="#000" opacity="0.26" />
      <path d="M-46 0 L-46 -40 A46 10 0 0 1 46 -40 L46 0 A46 10 0 0 1 -46 0Z" fill={`url(#${p}-stone)`} />
      {[-34, -22, -10, 2, 14, 26, 36].map((x) => (
        <rect key={x} x={x} y="-42" width="1.2" height="44" fill="#4b5052" opacity="0.4" />
      ))}
      <ellipse cx="0" cy="-40" rx="46" ry="10" fill="#aeb2ae" />
      <path d="M-38 -41 A38 40 0 0 1 38 -41 A38 8 0 0 1 -38 -41Z" fill={`url(#${p}-dome)`} />
      <path d="M-26 -52 A30 30 0 0 1 -6 -72" fill="none" stroke="#e6f4fb" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
      <rect x="-4" y="-78" width="8" height="38" fill="#0c2340" opacity="0.5" />
      <ellipse cx="0" cy="-40" rx="38" ry="8" fill="none" stroke="#cdd2cf" strokeWidth="2" />
    </g>
  );
}

export function Gear({ p, cx, cy, r, teeth, spin, holes = 4 }: { p: string; cx: number; cy: number; r: number; teeth: number; spin?: "fwd" | "rev" | false; holes?: number }) {
  const cls = spin === "fwd" ? "animate-spin-slow" : spin === "rev" ? "animate-spin-rev" : "";
  return (
    <g className={cls} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <path d={gearPath(cx, cy, r, teeth, r * 0.17)} fill={`url(#${p}-rust)`} stroke="#3a190d" strokeWidth={Math.max(0.6, r * 0.02)} />
      <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#2f140a" strokeWidth={r * 0.025} opacity="0.5" />
      {Array.from({ length: holes }).map((_, i) => {
        const a = (i / holes) * Math.PI * 2 + Math.PI / holes;
        return <circle key={i} cx={cx + Math.cos(a) * r * 0.5} cy={cy + Math.sin(a) * r * 0.5} r={r * 0.15} fill="#1d0e08" />;
      })}
      <circle cx={cx} cy={cy} r={r * 0.2} fill="#b9835c" stroke="#3a190d" strokeWidth={r * 0.02} />
      <circle cx={cx} cy={cy} r={r * 0.11} fill="#2a130a" />
    </g>
  );
}

export function Cogworks({ p, spin = true }: { p: string; spin?: boolean }) {
  return (
    <g>
      <ellipse cx="0" cy="3" rx="76" ry="8" fill="#000" opacity="0.28" />
      <rect x="-66" y="-42" width="86" height="42" fill={`url(#${p}-stoneDark)`} />
      <polygon points="20,-42 62,-34 62,0 20,0" fill="#2a2e31" />
      <rect x="-70" y="-48" width="94" height="8" fill="#62686b" />
      <polygon points="24,-48 66,-40 62,-34 20,-42" fill="#7c8286" />
      <path d="M-66 -30 H20 M-66 -18 H20" stroke="#1b1e20" strokeWidth="1.2" opacity="0.7" />
      <Gear p={p} cx={-20} cy={-52} r={30} teeth={20} spin={spin ? "fwd" : false} />
      <Gear p={p} cx={26} cy={-34} r={20} teeth={14} spin={spin ? "rev" : false} holes={3} />
      <path d="M-76 -12 L-76 6 M-76 -12 H-60" stroke="#c07048" strokeWidth="2.2" fill="none" />
      <path d="M-86 6 L-60 -14" stroke="#e9e3d2" strokeWidth="5" opacity="0.85" />
    </g>
  );
}

export function PeakTank({ p }: { p: string }) {
  /* mountain + the cylinder that crowns it; origin = base centre of the mountain */
  return (
    <g>
      <polygon points="-120,0 -86,-96 -52,-170 -22,-224 0,-246 22,-230 52,-170 84,-96 130,0" fill={`url(#${p}-rock)`} />
      <polygon points="-22,-224 0,-246 22,-230 52,-170 18,-150 -4,-190" fill={`url(#${p}-rockLit)`} opacity="0.85" />
      <polygon points="-120,0 -86,-96 -48,-60 -62,0" fill="#4b2113" opacity="0.5" />
      <polygon points="52,-170 84,-96 130,0 86,0 60,-90" fill="#40190d" opacity="0.45" />
      <path d="M-52 -170 L-30 -110 L-60 -30 M18 -150 L30 -90 L10 -20" stroke="#4b2113" strokeWidth="2" fill="none" opacity="0.55" />
      <g transform="translate(0 -246)">
        <circle cy="-18" r="46" fill={`url(#${p}-lamp)`} opacity="0.55" className="animate-flicker" />
        <rect x="-17" y="-34" width="34" height="34" fill="#4b5155" />
        <rect x="-17" y="-34" width="12" height="34" fill="#6b7377" />
        <ellipse cy="-34" rx="17" ry="5.5" fill="#8a9296" />
        <ellipse cy="-34" rx="12" ry="3.2" fill="#2b3033" />
      </g>
    </g>
  );
}

export function Rocket({ p }: { p: string }) {
  return (
    <g transform="rotate(-17)">
      <path d="M-56 0 C-44 -17 8 -22 54 -6 C60 -3 60 3 54 6 C8 22 -44 17 -56 0Z" fill={`url(#${p}-metal)`} stroke="#6b5136" strokeWidth="1.2" />
      <path d="M-56 0 C-44 -6 -30 -8 -30 0 C-30 8 -44 6 -56 0Z" fill="#7a3f22" />
      <polygon points="-34,-12 -52,-34 -24,-18" fill="#40382e" />
      <polygon points="-34,12 -52,30 -24,16" fill="#40382e" />
      <polygon points="-18,-16 -6,-36 6,-17" fill="#5b4e3a" />
      {[-4, 14, 30].map((x) => (
        <circle key={x} cx={x} cy={-3} r="4" fill="#25435e" stroke="#6b5136" strokeWidth="1" />
      ))}
      <path d="M-6 -12 C10 -17 34 -14 48 -6" stroke="#fff" strokeWidth="2" fill="none" opacity="0.45" />
    </g>
  );
}

export function TiltedTower({ p }: { p: string }) {
  return (
    <g>
      <ellipse cx="6" cy="4" rx="70" ry="12" fill="#06202e" opacity="0.5" />
      <ellipse cx="6" cy="4" rx="82" ry="15" fill="none" stroke="#e9f4f4" strokeWidth="1.4" opacity="0.5" className="animate-shimmer" />
      <g transform="rotate(-13 0 0)">
        <rect x="-30" y="-110" width="60" height="112" fill={`url(#${p}-stoneDark)`} />
        <rect x="-30" y="-110" width="18" height="112" fill="#fff" opacity="0.07" />
        {[-92, -68, -44].map((y) => (
          <rect key={y} x="-8" y={y} width="16" height="12" fill="#12181b" />
        ))}
        <rect x="-38" y="-118" width="76" height="10" fill="#d6d6cc" />
        <polygon points="-34,-118 0,-146 34,-118" fill="#2f4a3a" />
        <polygon points="0,-146 34,-118 8,-118" fill="#1d3226" />
        <path d="M-30 -20 C-18 -14 -10 -26 4 -18 C14 -12 22 -22 30 -16" stroke="#6d9b72" strokeWidth="5" fill="none" opacity="0.55" />
      </g>
    </g>
  );
}

export function Boat() {
  return (
    <g className="animate-bob" style={{ transformOrigin: "0px 0px" }}>
      <ellipse cx="0" cy="5" rx="22" ry="4" fill="#06202e" opacity="0.5" />
      <path d="M-22 -2 Q0 12 22 -2 L18 -9 H-18 Z" fill="#c26a2c" />
      <path d="M-22 -2 Q0 12 22 -2" stroke="#6b3412" strokeWidth="1.2" fill="none" />
      <rect x="-18" y="-10" width="36" height="3" fill="#8f4a1f" />
      <path d="M-4 -9 L20 -26" stroke="#4b3220" strokeWidth="1.6" />
    </g>
  );
}

export function Dock({ p }: { p: string }) {
  return (
    <g>
      <polygon points="-70,-10 20,-30 112,-6 30,16" fill={`url(#${p}-wood)`} />
      <polygon points="30,16 112,-6 112,0 30,23" fill="#4c321d" />
      {Array.from({ length: 11 }).map((_, i) => (
        <line key={i} x1={-60 + i * 15} y1={-8 + i * 0.8} x2={-24 + i * 14} y2={14 + i * 0.6} stroke="#46301c" strokeWidth="1" opacity="0.6" />
      ))}
      {[-62, -20, 24, 70, 108].map((x, i) => (
        <rect key={x} x={x} y={-2 + i * 1.5} width="4" height="26" fill="#3a2716" />
      ))}
      <g transform="translate(150 22)">
        <Boat />
      </g>
    </g>
  );
}

/** a short run of wooden stair-logs, like the path through the trees */
export function LogSteps({ x1, y1, x2, y2, n }: { x1: number; y1: number; x2: number; y2: number; n: number }) {
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const t = i / (n - 1);
        const x = x1 + (x2 - x1) * t;
        const y = y1 + (y2 - y1) * t;
        const w = 16 + t * 14;
        return (
          <g key={i}>
            <rect x={x - w / 2} y={y} width={w} height={5 + t * 3} rx="2.5" fill="#6d5237" />
            <rect x={x - w / 2} y={y} width={w} height="1.6" rx="1" fill="#a4835c" opacity="0.7" />
          </g>
        );
      })}
    </g>
  );
}

export function Bird({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} className="animate-bob">
      <path d="M-14 0 Q-7 -9 0 0 Q7 -9 14 0 Q7 -4 0 3 Q-7 -4 -14 0Z" fill="#1c1812" />
    </g>
  );
}

export function Fog({ p, w, y, h, opacity = 0.5 }: { p: string; w: number; y: number; h: number; opacity?: number }) {
  return <rect y={y} width={w} height={h} fill={`url(#${p}-haze)`} opacity={opacity} />;
}

export function At({ x, y, s = 1, children }: { x: number; y: number; s?: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>
  );
}
