"use client";

import { useState } from "react";
import { LOCATIONS, type LocationId } from "@/lib/game";
import {
  ArtDefs,
  At,
  Bird,
  Clouds,
  Cogworks,
  Colonnade,
  Dock,
  Dome,
  Forest,
  Fog,
  Library,
  LogSteps,
  PeakTank,
  Rocket,
  Sea,
  Sky,
  TiltedTower,
} from "./art";

const P = "isl";
const W = 1200;
const H = 720;
const HORIZON = 214;

const PLATEAU =
  "M236 468 C226 408 268 352 350 338 C430 322 520 318 600 330 C650 318 720 322 760 340 L800 380 C860 420 960 440 1012 470 C1030 486 1020 510 990 522 C900 548 780 560 690 566 C600 574 500 590 420 596 C330 600 262 560 236 468Z";

interface Props {
  interactive?: boolean;
  /** "meet" keeps the whole island visible, "slice" fills a hero background */
  fit?: "meet" | "slice";
  selected?: LocationId | null;
  done?: Partial<Record<LocationId, boolean>>;
  onSelect?: (id: LocationId) => void;
}

export function IslandMap({ interactive = true, fit = "meet", selected = null, done = {}, onSelect }: Props) {
  const [hover, setHover] = useState<LocationId | null>(null);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className="h-full w-full"
      role={interactive ? "group" : "img"}
      aria-label={interactive ? "Map of the Isle of Echoes with eight realms" : "The Isle of Echoes seen from the sea"}
    >
      <ArtDefs p={P} />
      <Sky p={P} w={W} h={HORIZON + 40} sun={{ x: 240, y: 120 }} />
      <Clouds p={P} w={W} y={50} />
      <Bird x={900} y={96} s={1.1} />
      <Bird x={940} y={118} s={0.7} />
      <Sea p={P} w={W} y={HORIZON} h={H - HORIZON} glints={90} />

      {/* the tilted tower, half-drowned at the left */}
      <At x={128} y={600}>
        <TiltedTower p={P} />
      </At>

      {/* island: cliff, then grass plateau */}
      <ellipse cx="640" cy="606" rx="470" ry="24" fill="#021722" opacity="0.4" />
      <g transform="translate(0 40)">
        <path d={PLATEAU} fill={`url(#${P}-rock)`} stroke="#3c180c" strokeWidth="2" />
      </g>
      <g transform="translate(0 20) translate(0 0)">
        <path d={PLATEAU} fill="#7b3d20" />
      </g>
      <path d={PLATEAU} fill={`url(#${P}-grass)`} stroke="#4c6026" strokeWidth="1.5" />
      <path d="M250 520 C270 540 300 556 340 566 C300 570 262 548 250 520Z" fill="#cfc975" opacity="0.8" />
      <ellipse cx="640" cy="420" rx="120" ry="30" fill="#c6d27a" opacity="0.28" />

      {/* mountain, rocket pad and the library behind everything else */}
      <At x={880} y={504}>
        <PeakTank p={P} />
      </At>
      <rect x="628" y="280" width="92" height="9" fill="#8a8f8c" />
      <At x={676} y={266} s={0.95}>
        <Rocket p={P} />
      </At>
      <At x={598} y={350}>
        <Library p={P} />
      </At>

      <Forest p={P} x0={252} x1={584} y0={346} y1={576} count={150} seed={11} avoid={{ x0: 312, x1: 548, y0: 340, y1: 410 }} />
      <LogSteps x1={660} y1={552} x2={566} y2={462} n={9} />
      <LogSteps x1={552} y1={446} x2={476} y2={414} n={5} />

      <At x={430} y={398} s={1}>
        <Colonnade p={P} />
      </At>
      <At x={716} y={430} s={1.1}>
        <Dome p={P} />
      </At>
      <At x={996} y={464} s={0.95}>
        <Cogworks p={P} />
      </At>
      <At x={650} y={576}>
        <Dock p={P} />
      </At>

      <Fog p={P} w={W} y={HORIZON - 30} h={90} opacity={0.5} />

      {interactive &&
        LOCATIONS.map((l) => {
          const isDone = !!done[l.id];
          const active = hover === l.id || selected === l.id;
          const labelW = Math.max(150, l.name.length * 9.4 + 34);
          const lx = l.labelSide === "left" ? l.anchor.x - labelW + 22 : l.labelSide === "right" ? l.anchor.x - 22 : l.anchor.x - labelW / 2;
          return (
            <g
              key={l.id}
              role="button"
              tabIndex={0}
              aria-label={`${l.name}: ${l.subtest}${isDone ? " (visited)" : ""}`}
              aria-pressed={selected === l.id}
              className="cursor-pointer outline-none"
              onMouseEnter={() => setHover(l.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(l.id)}
              onBlur={() => setHover(null)}
              onClick={() => onSelect?.(l.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect?.(l.id);
                }
              }}
            >
              <circle cx={l.anchor.x} cy={l.anchor.y} r="38" fill="transparent" />
              <circle
                cx={l.anchor.x}
                cy={l.anchor.y}
                r={active ? 30 : 22}
                fill={isDone ? "#9bc65a" : "#ffd96a"}
                opacity={active ? 0.5 : 0.3}
                className="animate-flicker"
                style={{ transition: "r .25s ease, opacity .25s ease" }}
              />
              <circle
                cx={l.anchor.x}
                cy={l.anchor.y}
                r="9"
                fill={isDone ? "#a9d46a" : "#fff0b0"}
                stroke={selected === l.id ? "#fff" : "#6d4d12"}
                strokeWidth={selected === l.id ? 2.4 : 1.6}
              />
              {isDone ? (
                <path d={`M${l.anchor.x - 4} ${l.anchor.y} l3 3 l5 -6`} stroke="#27400f" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              ) : (
                <circle cx={l.anchor.x} cy={l.anchor.y} r="3.2" fill="#8a5a10" />
              )}
              {active && (
                <g pointerEvents="none">
                  <rect x={lx} y={l.anchor.y - 62} width={labelW} height="30" rx="3" fill="#0d1215" fillOpacity="0.88" stroke="#c9a24a" strokeOpacity="0.8" />
                  <text
                    x={lx + labelW / 2}
                    y={l.anchor.y - 42}
                    textAnchor="middle"
                    fontSize="12.5"
                    fill="#eadfc4"
                    style={{ fontFamily: "var(--font-display)", letterSpacing: "0.12em", textTransform: "uppercase" }}
                  >
                    {l.name}
                  </text>
                </g>
              )}
            </g>
          );
        })}
    </svg>
  );
}
