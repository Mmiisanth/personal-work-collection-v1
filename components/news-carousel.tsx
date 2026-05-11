"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";
import type { Banner } from "@/lib/types";

type NewsCarouselProps = {
  banners: Banner[];
  active: number;
  onActiveChange: (index: number) => void;
  onOpen: (banner: Banner) => void;
};

const AUTOPLAY_MS = 4300;
const SLIDE_MS = 640;
const SNAP_MS = 80;

export function NewsCarousel({
  banners,
  active,
  onActiveChange,
  onOpen,
}: NewsCarouselProps) {
  const [trackIndex, setTrackIndex] = useState(active + 1);
  const [isSnapping, setIsSnapping] = useState(false);
  const [metrics, setMetrics] = useState({
    cardGap: 24,
    cardHeight: 300,
    cardWidth: 640,
    viewportWidth: 1024,
  });
  const trackItems =
    banners.length > 0
      ? [
          {
            banner: banners[banners.length - 1],
            key: `clone-left-${banners[banners.length - 1].id}`,
            realIndex: banners.length - 1,
          },
          ...banners.map((banner, index) => ({
            banner,
            key: banner.id,
            realIndex: index,
          })),
          {
            banner: banners[0],
            key: `clone-right-${banners[0].id}`,
            realIndex: 0,
          },
        ]
      : [];
  const trackX =
    metrics.viewportWidth / 2 -
    metrics.cardWidth / 2 -
    trackIndex * (metrics.cardWidth + metrics.cardGap);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      const nextIndex = (active + 1) % banners.length;

      setIsSnapping(false);
      setTrackIndex(active === banners.length - 1 ? banners.length + 1 : nextIndex + 1);
      onActiveChange(nextIndex);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [active, banners.length, onActiveChange]);

  useEffect(() => {
    const updateMetrics = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setMetrics({
        cardGap: Math.round(Math.min(Math.max(width * 0.02, 16), 28)),
        cardHeight: Math.round(Math.min(Math.max(height * 0.36, 248), 380)),
        cardWidth:
          width < 640
            ? Math.round(width * 0.86)
            : Math.round(Math.min(Math.max(width * 0.68, 680), 880)),
        viewportWidth: width,
      });
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => window.removeEventListener("resize", updateMetrics);
  }, []);

  useEffect(() => {
    if (trackIndex !== banners.length + 1 && trackIndex !== 0) return;
    let releaseTimer: number | undefined;

    const snapTimer = window.setTimeout(() => {
      setIsSnapping(true);
      setTrackIndex(trackIndex === 0 ? banners.length : 1);

      releaseTimer = window.setTimeout(() => {
        setIsSnapping(false);
      }, SNAP_MS);
    }, SLIDE_MS);

    return () => {
      window.clearTimeout(snapTimer);

      if (releaseTimer) {
        window.clearTimeout(releaseTimer);
      }
    };
  }, [banners.length, trackIndex]);

  function goToBanner(index: number) {
    if (banners.length <= 0) return;

    setIsSnapping(false);

    if (active === banners.length - 1 && index === 0) {
      setTrackIndex(banners.length + 1);
    } else if (active === 0 && index === banners.length - 1) {
      setTrackIndex(0);
    } else {
      setTrackIndex(index + 1);
    }

    onActiveChange(index);
  }

  return (
    <section className="flex w-full flex-col items-center gap-[clamp(8px,1.1vh,14px)]">
      <div
        className="relative w-screen overflow-hidden border-y border-black/55 bg-white/30 py-[clamp(10px,1.8vh,18px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_50px_rgba(0,0,0,0.05)] backdrop-blur-2xl"
        style={{ height: metrics.cardHeight + 40 }}
      >
        <div
          className="flex h-full items-center will-change-transform"
          style={{
            gap: metrics.cardGap,
            transform: `translateX(${trackX}px)`,
            transition: isSnapping
              ? "none"
              : `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          }}
        >
          {trackItems.map(({ banner, key, realIndex }) => {
            const isActive = realIndex === active;

            return (
              <button
                className={`relative shrink-0 overflow-hidden rounded-[24px] border text-black shadow-[0_18px_34px_rgba(0,0,0,0.12)] backdrop-blur-2xl transition-[border-color,box-shadow,opacity,transform] duration-300 hover:-translate-y-1 ${
                  isActive
                    ? "border-black/80 bg-white/45"
                    : "border-black/55 bg-white/35"
                }`}
                onClick={() => {
                  if (isActive) {
                    onOpen(banner);
                    return;
                  }

                  goToBanner(realIndex);
                }}
                key={key}
                style={{ height: metrics.cardHeight, width: metrics.cardWidth }}
                type="button"
              >
                <CenterBanner banner={banner} compact={!isActive} />
                {!isActive ? (
                  <span className="pointer-events-none absolute inset-0 bg-white/[0.03]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative h-8 w-[min(344px,42vw)] rounded-full border border-black bg-white/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.14)] backdrop-blur-2xl max-sm:w-[58vw]">
        <div className="relative h-full overflow-hidden rounded-full">
          <motion.div
            animate={{ x: `${active * 100}%` }}
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-black/15"
            style={{ width: `${100 / banners.length}%` }}
            transition={{ type: "spring", stiffness: 170, damping: 24, mass: 1 }}
          >
            <motion.div
              animate={{ scaleX: 1 }}
              className="h-full w-full origin-left rounded-full bg-black"
              initial={{ scaleX: 0 }}
              key={active}
              transition={{ duration: AUTOPLAY_MS / 1000, ease: "linear" }}
            />
          </motion.div>
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${banners.length}, minmax(0, 1fr))`,
            }}
          >
            {banners.map((banner, index) => (
              <button
                aria-label={`切换到 ${banner.title}`}
                className="relative z-10 rounded-full"
                key={banner.id}
                onClick={() => goToBanner(index)}
                type="button"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CenterBanner({
  banner,
  compact = false,
}: {
  banner: Banner;
  compact?: boolean;
}) {
  return (
    <article
      className={`grid h-full grid-cols-[0.76fr_1.24fr] ${
        compact ? "pointer-events-none opacity-100" : ""
      }`}
    >
      <div className="relative flex min-w-0 flex-col justify-between border-r-2 border-black bg-white/45 p-[clamp(10px,1.1vw,16px)]">
        <div className="flex items-center justify-between gap-2">
          <span className="display-font whitespace-nowrap rounded-full bg-black px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] uppercase text-white">
            RiotBus News
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/70 px-2 py-1 text-[clamp(8px,0.68vw,10px)] font-black">
            live-ish
          </span>
        </div>
        <div className="my-2.5 flex flex-1 items-center justify-center overflow-hidden rounded-[20px] border-2 border-black/25 shadow-inner">
          <img
            alt={`${banner.title} banner image`}
            className="h-full w-full object-cover"
            src={banner.imageSrc}
          />
        </div>
        <div className="flex items-center gap-1.5 text-[clamp(9px,0.8vw,12px)] font-black">
          <ExternalLink size={12} strokeWidth={3} />
          <span className="truncate">{banner.sourceLabel}</span>
        </div>
      </div>
      <div className="relative flex min-w-0 flex-col justify-between p-[clamp(14px,1.8vw,24px)] text-left">
        <div>
          <div className="mb-2.5 flex flex-nowrap gap-2 overflow-hidden">
            <span className="whitespace-nowrap rounded-full bg-brat-green px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
              pop emergency
            </span>
            <span className="whitespace-nowrap rounded-full bg-riot-pink/70 px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
              messy but cute
            </span>
          </div>
          <h2 className="display-font text-[clamp(24px,3vw,40px)] leading-[0.94]">
            {banner.title}
          </h2>
          <p className="mt-2 line-clamp-2 text-[clamp(12px,1.18vw,16px)] font-black leading-tight text-black/78">
            {banner.dek}
          </p>
          <p className="mt-3 line-clamp-2 rounded-[15px] bg-white/62 p-2.5 text-[clamp(10px,0.92vw,13px)] font-bold leading-snug text-black/75">
            {banner.body}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between border-t-2 border-black/20 pt-3">
          <span className="display-font text-[clamp(12px,1vw,15px)]">
            click for details
          </span>
          <span className="display-font rounded-full bg-black px-4 py-2 text-[clamp(10px,0.9vw,13px)] text-white">
            open
          </span>
        </div>
      </div>
    </article>
  );
}
