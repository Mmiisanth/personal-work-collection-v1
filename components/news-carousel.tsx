"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Banner } from "@/lib/types";

type NewsCarouselProps = {
  banners: Banner[];
  active: number;
  onActiveChange: (index: number) => void;
  onOpen: (banner: Banner) => void;
};

export function NewsCarousel({
  banners,
  active,
  onActiveChange,
  onOpen,
}: NewsCarouselProps) {
  const previous = (active - 1 + banners.length) % banners.length;
  const next = (active + 1) % banners.length;

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6">
      <div className="grid w-full grid-cols-[0.72fr_1.75fr_0.72fr] items-center gap-6 max-lg:grid-cols-1">
        <SideCard
          banner={banners[previous]}
          side="left"
          onClick={() => onActiveChange(previous)}
        />
        <AnimatePresence mode="wait">
          <motion.button
            key={banners[active].id}
            className="glass-strong min-h-[310px] rounded-[28px] p-8 text-left transition-transform hover:-translate-y-1 max-lg:min-h-[230px]"
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -16 }}
            transition={{ type: "spring", stiffness: 220, damping: 25 }}
            onClick={() => onOpen(banners[active])}
            type="button"
          >
            <div
              className="mb-6 h-28 rounded-[22px]"
              style={{ background: banners[active].color }}
            />
            <p className="display-font text-5xl leading-none max-md:text-4xl">
              {banners[active].title}
            </p>
            <p className="mt-5 max-w-xl text-xl font-bold text-black/70">
              {banners[active].dek}
            </p>
          </motion.button>
        </AnimatePresence>
        <SideCard
          banner={banners[next]}
          side="right"
          onClick={() => onActiveChange(next)}
        />
      </div>
      <div className="glass relative flex h-11 w-72 rounded-full p-1">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            aria-label={`Show ${banner.title}`}
            className="relative z-10 flex-1 rounded-full"
            onClick={() => onActiveChange(index)}
            type="button"
          />
        ))}
        <motion.div
          className="absolute bottom-1 top-1 rounded-full bg-brat-green shadow-glow"
          animate={{ x: `${active * 100}%` }}
          transition={{ type: "spring", stiffness: 340, damping: 27 }}
          style={{ width: `${100 / banners.length}%` }}
        />
      </div>
    </section>
  );
}

function SideCard({
  banner,
  side,
  onClick,
}: {
  banner: Banner;
  side: "left" | "right";
  onClick: () => void;
}) {
  return (
    <motion.button
      className={`glass min-h-[250px] p-6 text-center transition-transform hover:-translate-y-1 max-lg:hidden ${
        side === "left" ? "slanted-left" : "slanted-right"
      }`}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      type="button"
    >
      <div className="flex h-full min-h-[210px] items-center justify-center">
        <p className="display-font max-w-[160px] text-4xl leading-tight">
          {banner.title}
        </p>
      </div>
    </motion.button>
  );
}
