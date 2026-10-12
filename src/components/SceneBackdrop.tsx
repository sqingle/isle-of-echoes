import type { LocationId } from "@/lib/game";
import {
  ArtDefs,
  At,
  Bird,
  Boat,
  Clouds,
  Cogworks,
  Colonnade,
  Dock,
  Dome,
  Fog,
  Forest,
  Gear,
  Lamp,
  Library,
  PeakTank,
  Rocket,
  Sea,
  Sky,
  TiltedTower,
  rng,
} from "./art";

const P = "bd";
const W = 1600;
const H = 900;
const HZ = 470;

/** mossy basalt boulders across the foreground, like the shoreline in the reference scenes */
function Rocks({ y, h, seed, count = 26 }: { y: number; h: number; seed: number; count?: number }) {
  const rand = rng(seed);
  const rocks = Array.from({ length: count }).map(() => {
    const w = 70 + rand() * 150;
    const x = rand() * (W + 100) - 50;
    const yy = y + rand() * h;
    const rh = 34 + rand() * 70;
    const pts = [
      [x - w / 2, yy],
      [x - w * 0.42, yy - rh * 0.7],
      [x - w * 0.1, yy - rh],
      [x + w * 0.3, yy - rh * 0.9],
      [x + w / 2, yy - rh * 0.2],
      [x + w * 0.45, yy],
    ];
    return { x, yy, w, rh, pts, hue: rand() };
  });
  rocks.sort((a, b) => a.yy - b.yy);
  return (
    <g>
      {rocks.map((r, i) => (
        <g key={i}>
          <polygon points={r.pts.map((p) => p.join(",")).join(" ")} fill={r.hue > 0.5 ? "#4a4e49" : "#3b3f3c"} />
          <polygon
            points={[r.pts[1], r.pts[2], r.pts[3], [r.x + r.w * 0.2, r.yy - r.rh * 0.62], [r.x - r.w * 0.25, r.yy - r.rh * 0.55]].map((p) => p.join(",")).join(" ")}
            fill={r.hue > 0.3 ? "#6f8b3c" : "#82923f"}
            opacity="0.85"
          />
          <polygon points={`${r.pts[3].join(",")} ${r.pts[4].join(",")} ${r.pts[5].join(",")} ${r.x + r.w * 0.1},${r.yy}`} fill="#000" opacity="0.28" />
        </g>
      ))}
    </g>
  );
}

function Basalt({ x, y, n, seed, w = 46 }: { x: number; y: number; n: number; seed: number; w?: number }) {
  const rand = rng(seed);
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const h = 90 + rand() * 260;
        const cx = x + i * (w * 0.88);
        const top = y - h;
        return (
          <g key={i}>
            <polygon points={`${cx - w / 2},${y} ${cx - w / 2},${top + 10} ${cx},${top} ${cx + w / 2},${top + 10} ${cx + w / 2},${y}`} fill="#3c4144" />
            <polygon points={`${cx},${top} ${cx + w / 2},${top + 10} ${cx + w / 2},${y} ${cx + w * 0.1},${y}`} fill="#2a2e31" />
            <polygon points={`${cx - w / 2},${top + 10} ${cx},${top} ${cx + w / 2},${top + 10} ${cx},${top + 22}`} fill="#7f9a46" opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

function Grass({ y }: { y: number }) {
  return (
    <g>
      <path d={`M0 ${y} C300 ${y - 50} 700 ${y - 10} 1100 ${y - 40} S1500 ${y - 10} 1600 ${y - 30} V${H} H0Z`} fill={`url(#${P}-grass)`} />
      <path d={`M0 ${y + 120} C400 ${y + 80} 900 ${y + 130} 1600 ${y + 90} V${H} H0Z`} fill="#3d5127" opacity="0.8" />
    </g>
  );
}

function Scene({ id }: { id: LocationId | "haze" }) {
  switch (id) {
    case "elision":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 1100, y: 190 }} />
          <Clouds p={P} w={W} y={70} scale={1.3} seed={7} />
          <Fog p={P} w={W} y={HZ - 90} h={160} opacity={0.8} />
          <Forest p={P} x0={-40} x1={W + 40} y0={470} y1={640} count={120} seed={21} scale={2.4} />
          <Grass y={650} />
          <At x={800} y={800} s={4.6}>
            <Colonnade p={P} />
          </At>
          <Fog p={P} w={W} y={500} h={200} opacity={0.35} />
        </>
      );
    case "blending":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 400, y: 200 }} />
          <Clouds p={P} w={W} y={60} scale={1.2} seed={3} />
          <Sea p={P} w={W} y={HZ} h={H - HZ} glints={140} seed={5} />
          <At x={1250} y={HZ + 8} s={2.2}>
            <polygon points="-90,0 -40,-40 20,-26 80,-48 130,0" fill="#33515a" opacity="0.65" />
          </At>
          <At x={720} y={720} s={5.2}>
            <Dock p={P} />
          </At>
          <At x={1320} y={720} s={2.4}>
            <Lamp p={P} />
          </At>
        </>
      );
    case "segmentation":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 1250, y: 140 }} />
          <Clouds p={P} w={W} y={60} scale={1.2} seed={13} />
          <Sea p={P} w={W} y={HZ + 40} h={H - HZ} glints={70} seed={8} />
          <At x={1280} y={640} s={3.4}>
            <PeakTank p={P} />
          </At>
          <At x={1250} y={800} s={5.2}>
            <Cogworks p={P} />
          </At>
          <Rocks y={760} h={140} seed={31} />
          <Gear p={P} cx={330} cy={690} r={330} teeth={26} spin="fwd" />
          <Gear p={P} cx={760} cy={840} r={190} teeth={16} spin="rev" holes={5} />
        </>
      );
    case "isolation":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 300, y: 160 }} />
          <Clouds p={P} w={W} y={50} scale={1.3} seed={17} />
          <Sea p={P} w={W} y={HZ} h={H - HZ} glints={90} seed={12} />
          <Fog p={P} w={W} y={HZ - 40} h={120} opacity={0.6} />
          <At x={800} y={830} s={8.4}>
            <Dome p={P} />
          </At>
          <Rocks y={820} h={80} seed={41} count={16} />
        </>
      );
    case "nonwordEB":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 800, y: 180 }} />
          <Clouds p={P} w={W} y={90} scale={1.6} seed={23} />
          <Bird x={1220} y={170} s={1.8} />
          <Sea p={P} w={W} y={HZ} h={H - HZ} glints={80} seed={2} />
          <rect x="360" y="660" width="880" height="34" fill="#868c88" />
          <rect x="360" y="694" width="880" height="206" fill="#2d3235" />
          <At x={800} y={650} s={6.2}>
            <Rocket p={P} />
          </At>
          <Rocks y={800} h={100} seed={44} count={18} />
        </>
      );
    case "digits":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 1300, y: 170 }} />
          <Clouds p={P} w={W} y={60} scale={1.3} seed={29} />
          <Forest p={P} x0={-40} x1={W + 40} y0={480} y1={600} count={110} seed={51} scale={2.2} />
          <Grass y={660} />
          <At x={800} y={800} s={7.2}>
            <Library p={P} />
          </At>
          <At x={250} y={820} s={3}>
            <Lamp p={P} />
          </At>
          <At x={1350} y={820} s={3}>
            <Lamp p={P} />
          </At>
          <Fog p={P} w={W} y={560} h={160} opacity={0.35} />
        </>
      );
    case "nonwordRep":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 280, y: 180 }} />
          <Clouds p={P} w={W} y={60} scale={1.3} seed={37} />
          <Sea p={P} w={W} y={HZ + 60} h={H - HZ} glints={50} seed={14} />
          <At x={820} y={900} s={3.6}>
            <PeakTank p={P} />
          </At>
          <Basalt x={-10} y={900} n={9} seed={61} />
          <Basalt x={1180} y={900} n={10} seed={67} />
          <Bird x={1000} y={160} s={1.8} />
        </>
      );
    case "rapid":
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 1180, y: 200 }} />
          <Clouds p={P} w={W} y={60} scale={1.3} seed={43} />
          <Sea p={P} w={W} y={HZ} h={H - HZ} glints={110} seed={6} />
          <At x={1240} y={780} s={3.4}>
            <TiltedTower p={P} />
          </At>
          <At x={340} y={800} s={2.6}>
            <Boat />
          </At>
        </>
      );
    default:
      return (
        <>
          <Sky p={P} w={W} h={HZ + 60} sun={{ x: 300, y: 160 }} />
          <Clouds p={P} w={W} y={60} scale={1.3} seed={5} />
          <Sea p={P} w={W} y={HZ} h={H - HZ} glints={110} seed={3} />
        </>
      );
  }
}

export function SceneBackdrop({ scene = "haze", dim = 0.28 }: { scene?: LocationId | "haze"; dim?: number }) {
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-abyss">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <ArtDefs p={P} />
        <Scene id={scene} />
      </svg>
      <div className="vignette absolute inset-0" />
      <div className="absolute inset-0" style={{ background: `rgb(5 9 12 / ${dim})` }} />
    </div>
  );
}
