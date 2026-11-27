"use client";

import { useState } from "react";
import { LOCATIONS, type LocationId } from "@/lib/game";
const W = 1280;
const H = 720;

interface Props {
  interactive?: boolean;
  /** "meet" keeps the whole valley visible, "slice" fills a hero background */
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
      aria-label={interactive ? "Map of the Valley of Echoes with eight realms" : "The Valley of Echoes at dusk"}
    >
      <image href="/art/valley-map.jpg" width={W} height={H} />

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
