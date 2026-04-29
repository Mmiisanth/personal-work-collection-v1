"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
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
      <div className="grid w-full grid-cols-[0.68fr_1.8fr_0.68fr] items-center gap-7 max-lg:grid-cols-1">
        <SideCard
          banner={banners[previous]}
          side="left"
          onClick={() => onActiveChange(previous)}
        />
        <AnimatePresence mode="wait">
          <motion.button
            key={banners[active].id}
            className="group relative min-h-[390px] overflow-hidden rounded-[30px] border-[3px] border-black bg-[#f6ffef] p-0 text-left shadow-[0_24px_60px_rgba(0,0,0,0.16)] transition-transform hover:-translate-y-1 max-lg:min-h-[310px]"
            initial={{ opacity: 0, scale: 0.94, x: 42 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, x: -42 }}
            transition={{ type: "spring", stiffness: 230, damping: 24 }}
            onClick={() => onOpen(banners[active])}
            type="button"
          >
            <NewsWrap banner={banners[active]} />
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
      className={`relative min-h-[280px] overflow-hidden border-2 border-black/40 bg-white/55 p-5 text-center shadow-[0_16px_34px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-transform hover:-translate-y-1 max-lg:hidden ${
        side === "left" ? "slanted-left" : "slanted-right"
      }`}
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      type="button"
    >
      <div
        className="absolute inset-x-0 top-0 h-20 opacity-90"
        style={{ background: banner.color }}
      />
      <div className="relative flex h-full min-h-[240px] flex-col items-center justify-center gap-4 px-3">
        <span className="rounded-full bg-black px-3 py-1 text-xs font-black uppercase text-white">
          next wrap
        </span>
        <p className="display-font max-w-[170px] text-3xl leading-none">
          {banner.title}
        </p>
        <p className="max-w-[170px] text-sm font-black leading-tight text-black/65">
          {banner.dek}
        </p>
      </div>
    </motion.button>
  );
}

function NewsWrap({ banner }: { banner: Banner }) {
  return (
    <article className="grid h-full min-h-[390px] grid-cols-[0.9fr_1.1fr] max-md:grid-cols-1">
      <div className="relative flex flex-col justify-between border-r-2 border-black bg-white/45 p-5 max-md:min-h-[170px] max-md:border-b-2 max-md:border-r-0">
        <div className="flex items-center justify-between">
          <span className="display-font rounded-full bg-black px-4 py-2 text-sm uppercase text-white">
            RiotBus News Wrap
          </span>
          <span className="rounded-full bg-white/65 px-3 py-1 text-xs font-black">
            live-ish
          </span>
        </div>
        <div
          className="my-5 flex flex-1 items-center justify-center rounded-[24px] border-2 border-black/35 shadow-inner"
          style={{ background: banner.color }}
        >
          <span className="display-font rotate-[-4deg] text-5xl max-md:text-4xl">
            {banner.id.includes("gaga")
              ? "GAGA"
              : banner.id.includes("olivia")
                ? "OLIVIA"
                : "AG8"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm font-black">
          <ExternalLink size={16} strokeWidth={3} />
          <span>{banner.sourceLabel}</span>
        </div>
      </div>
      <div className="relative flex flex-col justify-between p-7">
        <div>
          <div className="mb-5 flex gap-2">
            <span className="rounded-full bg-brat-green px-3 py-1 text-xs font-black uppercase">
              pop emergency
            </span>
            <span className="rounded-full bg-riot-pink/70 px-3 py-1 text-xs font-black uppercase">
              messy but cute
            </span>
          </div>
          <h2 className="display-font text-6xl leading-[0.92] max-md:text-4xl">
            {banner.title}
          </h2>
          <p className="mt-5 text-2xl font-black leading-tight text-black/76 max-md:text-xl">
            {banner.dek}
          </p>
          <p className="mt-5 rounded-[20px] bg-white/60 p-4 text-lg font-bold leading-snug text-black/76">
            {banner.body}
          </p>
        </div>
        <div className="mt-5 flex items-center justify-between border-t-2 border-black/20 pt-4">
          <span className="display-font text-lg">click for details</span>
          <span className="display-font rounded-full bg-black px-4 py-2 text-white">
            open
          </span>
        </div>
      </div>
    </article>
  );
}
