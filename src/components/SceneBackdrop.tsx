import type { LocationId } from "@/lib/game";
import {
  ArtDefs,
  Clouds,
  Sea,
  Sky,
} from "./art";

const P = "bd";
const W = 1600;
const H = 900;
const HZ = 470;

/** the painted scene for each realm */
export const PAINTED: Partial<Record<LocationId | "haze", string>> = {
  elision: "/art/whispering-chimes.jpg",
  blending: "/art/weavers-landing.jpg",
  segmentation: "/art/patchwork-windmill.jpg",
  isolation: "/art/stargazers-nest.jpg",
  nonwordEB: "/art/star-skiff.jpg",
  digits: "/art/hollow-library.jpg",
  nonwordRep: "/art/echo-peak.jpg",
  rapid: "/art/lantern-treehouse.jpg",
};

function Scene({ id }: { id: LocationId | "haze" }) {
  const painting = PAINTED[id];
  if (painting) return <image href={painting} width={W} height={H} />;
  // map-page and ledger backgrounds ("haze") are still drawn in code
  return (
    <>
      <Sky p={P} w={W} h={HZ + 60} sun={{ x: 300, y: 160 }} />
      <Clouds p={P} w={W} y={60} scale={1.3} seed={5} />
      <Sea p={P} w={W} y={HZ} h={H - HZ} glints={110} seed={3} />
    </>
  );
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
