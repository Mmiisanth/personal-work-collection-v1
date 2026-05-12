"use client";

import { memo, useEffect, useMemo, useState } from "react";
import type { BattleMode } from "@/lib/types";

type DynamicSlopeBackgroundProps = {
  mode: BattleMode;
};

const STRIP_HEIGHT = 126;
const STRIP_ANGLE_RADIANS = Math.PI / 6;
const EMOJI_LABEL_GAP = "\u00a0".repeat(3);
const TOKEN_GAP = "\u00a0".repeat(6);

const themeCopy: Record<BattleMode, string[]> = {
  mean: [
    "🚌 交",
    "👴🏻 尖",
    "🐷 猪",
    "🚽 厕",
    "🏖️ 沙",
    "🛞 伦",
    "💣 炸",
    "3️⃣ 三",
    "👂 聋",
    "🦍 猩",
  ],
  neutral: [
    "🍓 莓",
    "🌈 嘎",
    "🎙️ 呆",
    "🍉 果",
    "👩🏿‍🎤 日",
    "🥑 梨",
    "💅🏼 A",
    "🪵 匠",
    "🍨 娅",
    "👸🏾 碧",
  ],
};

const acidOrnaments = [
  { className: "acid-ornament--spark-tl" },
  { className: "acid-ornament--orbit-tr" },
  { className: "acid-ornament--bolt-left" },
  { className: "acid-ornament--plus-bl" },
  { className: "acid-ornament--wave-br" },
  { className: "acid-ornament--globe-br" },
];

function buildCopySegments(copy: string[], stripIndex: number) {
  const offsetCopy = copy
    .slice(stripIndex % copy.length)
    .concat(copy.slice(0, stripIndex % copy.length));
  const segment = Array.from({ length: 5 })
    .flatMap(() => offsetCopy)
    .map((item) => item.replace(" ", EMOJI_LABEL_GAP))
    .join(TOKEN_GAP);

  return [segment, segment];
}

function DynamicSlopeBackgroundBase({ mode }: DynamicSlopeBackgroundProps) {
  const [stripCount, setStripCount] = useState(8);
  const copy = themeCopy[mode];

  useEffect(() => {
    let resizeFrame: number | undefined;

    const updateStripCount = () => {
      const viewportCoverage =
        window.innerWidth * Math.sin(STRIP_ANGLE_RADIANS) +
        window.innerHeight * Math.cos(STRIP_ANGLE_RADIANS);

      setStripCount(Math.ceil(viewportCoverage / STRIP_HEIGHT) + 3);
    };
    const scheduleUpdateStripCount = () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(updateStripCount);
    };

    updateStripCount();
    window.addEventListener("resize", scheduleUpdateStripCount);

    return () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      window.removeEventListener("resize", scheduleUpdateStripCount);
    };
  }, []);

  const strips = useMemo(
    () =>
      Array.from({ length: stripCount }).map((_, stripIndex) => ({
        direction: stripIndex % 2 === 0 ? "left" : "right",
        key: stripIndex,
        segments: buildCopySegments(copy, stripIndex),
        tone: stripIndex % 2 === 0 ? "primary" : "secondary",
        top: `calc(50% + ${(stripIndex - stripCount / 2) * STRIP_HEIGHT}px)`,
      })),
    [copy, stripCount],
  );

  return (
    <div
      aria-hidden="true"
      className={`dynamic-slope-bg dynamic-slope-bg--${mode}`}
    >
      {strips.map((strip) => (
        <div
          className="dynamic-slope-strip"
          data-direction={strip.direction}
          data-tone={strip.tone}
          key={strip.key}
          style={{ top: strip.top }}
        >
          <div className="dynamic-slope-text-plane">
            <div className="dynamic-slope-marquee">
              {strip.segments.map((segment, segmentIndex) => (
                <span className="dynamic-slope-segment" key={segmentIndex}>
                  {segment}
                </span>
              ))}
            </div>
          </div>
        </div>
      ))}
      <div className="acid-ornaments">
        {acidOrnaments.map((ornament) => (
          <span
            className={`acid-ornament ${ornament.className}`}
            key={ornament.className}
          />
        ))}
      </div>
    </div>
  );
}

export const DynamicSlopeBackground = memo(DynamicSlopeBackgroundBase);
