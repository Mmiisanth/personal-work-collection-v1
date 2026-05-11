"use client";

import { motion } from "framer-motion";
import type { BattleMode } from "@/lib/types";

type CapsuleSwitchProps = {
  value: BattleMode;
  onChange: (mode: BattleMode) => void;
};

const modes: Array<{ value: BattleMode; label: string; color: string }> = [
  { value: "mean", label: "刻薄女孩", color: "#8CFF4F" },
  { value: "neutral", label: "清清白白", color: "#FF7AC8" },
];

export function CapsuleSwitch({ value, onChange }: CapsuleSwitchProps) {
  const activeIndex = modes.findIndex((mode) => mode.value === value);

  return (
    <div className="relative flex w-[var(--switch-width,min(72vw,470px))] overflow-hidden rounded-full border border-black/55 bg-white/22 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_12px_26px_rgba(0,0,0,0.12)] backdrop-blur-2xl">
      <div className="relative grid h-10 min-w-0 w-full grid-cols-2 overflow-hidden rounded-full">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
          animate={{
            x: `${activeIndex * 100}%`,
            backgroundColor: modes[activeIndex].color,
          }}
          transition={{ type: "spring", stiffness: 210, damping: 24, mass: 1 }}
          style={{ width: "50%" }}
        />
        {modes.map((mode) => (
          <button
            key={mode.value}
            className="display-font relative z-10 min-w-0 rounded-full px-3 text-[clamp(15px,1.5vw,22px)] leading-none transition-transform hover:scale-[1.02]"
            onClick={() => onChange(mode.value)}
            type="button"
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
