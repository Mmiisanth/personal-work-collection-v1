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
    <div className="relative flex w-full max-w-[440px] rounded-full border border-black/30 bg-white/35 p-1 shadow-glass backdrop-blur-2xl">
      <motion.div
        className="absolute bottom-1 top-1 rounded-full"
        animate={{
          x: `${activeIndex * 100}%`,
          scaleX: 1,
          backgroundColor: modes[activeIndex].color,
        }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        style={{ width: "50%" }}
      />
      {modes.map((mode) => (
        <button
          key={mode.value}
          className="display-font relative z-10 h-12 flex-1 rounded-full text-lg transition-transform hover:scale-[1.02]"
          onClick={() => onChange(mode.value)}
          type="button"
        >
          {mode.label}
        </button>
      ))}
    </div>
  );
}
