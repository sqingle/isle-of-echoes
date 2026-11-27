import type { LocationId } from "@/lib/game";
import {
  ArtDefs,
  At,
  Bird,
  Boat,
  Clouds,
  PeakTank,
  Sea,
  Sky,
  TiltedTower,
  rng,
} from "./art";

const P = "bd";
const W = 1600;
const H = 900;
const HZ = 470;

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

/** realms that have a painted scene; the rest are still drawn in code */
export const PAINTED: Partial<Record<LocationId | "haze", string>> = {
  elision: "/art/whispering-chimes.jpg",
  blending: "/art/weavers-landing.jpg",
  segmentation: "/art/patchwork-windmill.jpg",
  isolation: "/art/stargazers-nest.jpg",
  nonwordEB: "/art/star-skiff.jpg",
  digits: "/art/hollow-library.jpg",
};

function Scene({ id }: { id: LocationId | "haze" }) {
  const painting = PAINTED[id];
  if (painting) return <image href={painting} width={W} height={H} />;
  switch (id) {
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
  // painted scenes are already dim at the edges, so they get a lighter vignette
  const painted = scene in PAINTED;
  return (
    <div aria-hidden className="grain pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-abyss">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className="h-full w-full">
        <ArtDefs p={P} />
        <Scene id={scene} />
      </svg>
      <div className={`vignette absolute inset-0 ${painted ? "opacity-55" : ""}`} />
      <div className="absolute inset-0" style={{ background: `rgb(5 9 12 / ${dim})` }} />
    </div>
  );
}
