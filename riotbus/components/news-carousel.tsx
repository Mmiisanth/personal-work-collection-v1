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
const TRACK_CYCLES = 3;

export function NewsCarousel({
  banners,
  active,
  onActiveChange,
  onOpen,
}: NewsCarouselProps) {
  const middleCycle = Math.floor(TRACK_CYCLES / 2);
  const [trackIndex, setTrackIndex] = useState(active + banners.length * middleCycle);
  const [isSnapping, setIsSnapping] = useState(false);
  const [metrics, setMetrics] = useState({
    cardGap: 24,
    cardHeight: 300,
    cardWidth: 640,
    viewportWidth: 1024,
  });
  const trackItems =
    banners.length > 0
      ? Array.from({ length: banners.length * TRACK_CYCLES }, (_, index) => banners[index % banners.length])
      : [];
  const canonicalTrackIndex = active + banners.length * middleCycle;
  const trackX =
    metrics.viewportWidth / 2 -
    metrics.cardWidth / 2 -
    trackIndex * (metrics.cardWidth + metrics.cardGap);

  useEffect(() => {
    if (banners.length <= 0) return;
    setIsSnapping(true);
    setTrackIndex(canonicalTrackIndex);

    const timer = window.setTimeout(() => {
      setIsSnapping(false);
    }, SNAP_MS);

    return () => window.clearTimeout(timer);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      const nextIndex = (active + 1) % banners.length;

      setIsSnapping(false);
      setTrackIndex(trackIndex + 1);
      onActiveChange(nextIndex);
    }, AUTOPLAY_MS);

    return () => window.clearInterval(timer);
  }, [active, banners.length, onActiveChange, trackIndex]);

  useEffect(() => {
    let resizeTimer: number | undefined;

    const updateMetrics = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const nextMetrics = {
        cardGap: Math.round(Math.min(Math.max(width * 0.02, 16), 28)),
        cardHeight: Math.round(Math.min(Math.max(height * 0.36, 248), 380)),
        cardWidth:
          width < 640
            ? Math.round(width * 0.86)
            : Math.round(Math.min(Math.max(width * 0.68, 680), 880)),
        viewportWidth: width,
      };

      setMetrics((current) =>
        current.cardGap === nextMetrics.cardGap &&
        current.cardHeight === nextMetrics.cardHeight &&
        current.cardWidth === nextMetrics.cardWidth &&
        current.viewportWidth === nextMetrics.viewportWidth
          ? current
          : nextMetrics,
      );
    };

    const scheduleUpdateMetrics = () => {
      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }

      resizeTimer = window.setTimeout(updateMetrics, 120);
    };

    updateMetrics();
    window.addEventListener("resize", scheduleUpdateMetrics);

    return () => {
      window.removeEventListener("resize", scheduleUpdateMetrics);

      if (resizeTimer) {
        window.clearTimeout(resizeTimer);
      }
    };
  }, []);

  useEffect(() => {
    if (banners.length <= 0) return;
    if (trackIndex >= banners.length && trackIndex < banners.length * 2) return;

    let releaseTimer: number | undefined;

    const snapTimer = window.setTimeout(() => {
      setIsSnapping(true);
      setTrackIndex(canonicalTrackIndex);

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
  }, [banners.length, canonicalTrackIndex, trackIndex]);

  function goToBanner(index: number) {
    if (banners.length <= 0) return;

    setIsSnapping(false);

    const directDelta = index - active;
    const wrappedForwardDelta = directDelta + banners.length;
    const wrappedBackwardDelta = directDelta - banners.length;
    const delta = [directDelta, wrappedForwardDelta, wrappedBackwardDelta].sort(
      (a, b) => Math.abs(a) - Math.abs(b),
    )[0];

    setTrackIndex(trackIndex + delta);

    onActiveChange(index);
  }

  return (
    <section className="flex w-full flex-col items-center gap-[clamp(8px,1.1vh,14px)]">
      <div
        className="relative w-screen overflow-hidden border-y border-black/55 bg-white/30 py-[clamp(10px,1.8vh,18px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl"
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
          {trackItems.map((banner, index) => {
            const realIndex = index % banners.length;
            const isCentered = index === trackIndex;
            const key = `${banner.id}-${index}`;

            return (
              <button
                className={`relative shrink-0 overflow-hidden rounded-[24px] border text-black shadow-[0_18px_34px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-[border-color,box-shadow,opacity,transform] duration-300 hover:-translate-y-1 ${
                  isCentered
                    ? "border-black/80 bg-white/45"
                    : "border-black/55 bg-white/35"
                }`}
                onClick={() => {
                  if (isCentered) {
                    onOpen(banner);
                    return;
                  }

                  goToBanner(realIndex);
                }}
                key={key}
                style={{ height: metrics.cardHeight, width: metrics.cardWidth }}
                type="button"
              >
                <CenterBanner banner={banner} compact={!isCentered} />
                {!isCentered ? (
                  <span className="pointer-events-none absolute inset-0 bg-white/[0.03]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative h-8 w-[min(344px,42vw)] rounded-full border border-black bg-white/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.14)] backdrop-blur-xl max-sm:w-[58vw]">
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
  const isProminent = !compact;

  return (
    <article className={`grid h-full grid-cols-[0.82fr_1.18fr] ${compact ? "pointer-events-none opacity-100" : ""}`}>
      <div className="relative flex min-w-0 flex-col overflow-hidden border-r-2 border-black bg-white/45">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/15 p-[clamp(8px,0.9vw,12px)]">
          <span className="display-font whitespace-nowrap rounded-full bg-black px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] uppercase text-white">
            RiotBus News
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/70 px-2 py-1 text-[clamp(8px,0.68vw,10px)] font-black">
            live-ish
          </span>
        </div>
        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/5">
          <img
            alt={`${banner.title} banner image`}
            className="h-full w-full object-cover object-center"
            decoding="async"
            fetchPriority={isProminent ? "high" : "low"}
            loading={isProminent ? "eager" : "lazy"}
            width={960}
            height={1200}
            src={banner.imageSrc}
          />
        </div>
        <div className="banner-copy-fade flex shrink-0 items-center gap-1.5 border-t border-black/15 p-[clamp(8px,0.9vw,12px)] text-[clamp(9px,0.8vw,12px)] font-black">
          <ExternalLink size={12} strokeWidth={3} />
          <span className="min-w-0 whitespace-nowrap">{banner.sourceLabel}</span>
        </div>
      </div>
      <div className="relative flex min-w-0 flex-col overflow-hidden bg-white/35 p-[clamp(12px,1.4vw,20px)] text-left">
        <div className="banner-copy-fade flex shrink-0 max-h-9 flex-nowrap gap-2 overflow-hidden">
          <span className="whitespace-nowrap rounded-full bg-brat-green px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
            pop emergency
          </span>
          <span className="whitespace-nowrap rounded-full bg-riot-pink/70 px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
            messy but cute
          </span>
        </div>
        <h2 className="display-font mt-2 text-[clamp(20px,2.3vw,32px)] leading-[0.95]">
          {banner.title}
        </h2>
        <p className="banner-copy-fade mt-1.5 line-clamp-4 max-h-[7.2em] overflow-hidden text-[clamp(11px,1vw,14px)] font-black leading-[1.8] text-black/78">
          {banner.dek}
        </p>
        <p className="banner-copy-fade mt-2 line-clamp-4 max-h-[7.8em] overflow-hidden rounded-[15px] bg-white/62 p-2.5 text-[clamp(10px,0.82vw,12px)] font-bold leading-[1.7] text-black/75">
          {banner.body}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 border-t-2 border-black/20 pt-3">
          <span className="display-font text-[clamp(12px,1vw,15px)]">
            click for details
          </span>
          <span className="display-font whitespace-nowrap rounded-full bg-black px-4 py-2 text-[clamp(10px,0.9vw,13px)] text-white">
            open
          </span>
        </div>
      </div>
    </article>
  );
}
