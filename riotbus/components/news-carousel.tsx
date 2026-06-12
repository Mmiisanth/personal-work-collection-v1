"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
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
const TRACK_CYCLES = 3;

export function NewsCarousel({
  banners,
  active,
  onActiveChange,
  onOpen,
}: NewsCarouselProps) {
  const middleCycle = Math.floor(TRACK_CYCLES / 2);
  const [trackIndex, setTrackIndex] = useState(active + banners.length * middleCycle);
  const [centeredTrackIndex, setCenteredTrackIndex] = useState(active + banners.length * middleCycle);
  const [isSnapReset, setIsSnapReset] = useState(false);
  const [metrics, setMetrics] = useState({
    cardGap: 24,
    cardHeight: 300,
    cardWidth: 640,
    viewportWidth: 1024,
  });
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressTrackRef = useRef<HTMLDivElement | null>(null);
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
    setIsSnapReset(true);
    setCenteredTrackIndex(canonicalTrackIndex);
    setTrackIndex(canonicalTrackIndex);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    const timer = window.setInterval(() => {
      const nextIndex = (active + 1) % banners.length;

      setIsSnapReset(false);
      setTrackIndex((current) => current + 1);
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

    const snapTimer = window.setTimeout(() => {
      setIsSnapReset(true);
      setCenteredTrackIndex(canonicalTrackIndex);
      setTrackIndex(canonicalTrackIndex);
    }, SLIDE_MS);

    return () => {
      window.clearTimeout(snapTimer);
    };
  }, [banners.length, canonicalTrackIndex, trackIndex]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const mm = gsap.matchMedia();
    const targetX =
      metrics.viewportWidth / 2 -
      metrics.cardWidth / 2 -
      trackIndex * (metrics.cardWidth + metrics.cardGap);

    mm.add(
      {
        all: "all",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const tween = gsap.to(track, {
          x: targetX,
          duration: reduceMotion || isSnapReset ? 0 : SLIDE_MS / 1000,
          ease: "power3.out",
          overwrite: "auto",
          onComplete: () => {
            setCenteredTrackIndex(trackIndex);
            setIsSnapReset(false);
          },
        });

        return () => tween.kill();
      },
    );

    return () => mm.revert();
  }, [isSnapReset, metrics.cardGap, metrics.cardWidth, metrics.viewportWidth, trackIndex]);

  function goToBanner(index: number) {
    if (banners.length <= 0) return;

    const directDelta = index - active;
    const wrappedForwardDelta = directDelta + banners.length;
    const wrappedBackwardDelta = directDelta - banners.length;
    const delta = [directDelta, wrappedForwardDelta, wrappedBackwardDelta].sort(
      (a, b) => Math.abs(a) - Math.abs(b),
    )[0];

    setIsSnapReset(false);
    setTrackIndex((current) => current + delta);

    onActiveChange(index);
  }

  return (
    <section className="flex w-full flex-col items-center gap-[clamp(8px,1.1vh,14px)]">
      <div
        className="relative w-screen overflow-hidden border-y border-black/55 bg-white/30 py-[clamp(10px,1.8vh,18px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55),0_18px_50px_rgba(0,0,0,0.05)] backdrop-blur-xl"
        style={{ height: metrics.cardHeight + 40 }}
      >
        <div
          ref={trackRef}
          className="flex h-full items-center will-change-transform"
          style={{
            gap: metrics.cardGap,
            transform: `translateX(${trackX}px)`,
          }}
        >
          {trackItems.map((banner, index) => {
            const realIndex = index % banners.length;
            const isCentered = index === centeredTrackIndex;
            const key = `${banner.id}-${index}`;

            return (
              <button
                className={`relative shrink-0 overflow-hidden rounded-[24px] border text-black shadow-[0_18px_34px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-[border-color,box-shadow,opacity,transform] duration-300 hover:-translate-y-1 ${
                  isCentered
                    ? "scale-100 border-black/80 bg-white/45 shadow-[0_20px_42px_rgba(0,0,0,0.16)]"
                    : "scale-[0.965] border-black/55 bg-white/35 opacity-88"
                }`}
                data-carousel-centered={isCentered ? "true" : undefined}
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
                  <span className="pointer-events-none absolute inset-0 bg-white/18 backdrop-blur-[1px]" />
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative h-8 w-[min(344px,42vw)] rounded-full border border-black bg-white/25 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.7),0_8px_16px_rgba(0,0,0,0.14)] backdrop-blur-xl max-sm:w-[58vw]">
        <div ref={progressTrackRef} className="relative h-full overflow-hidden rounded-full">
          <div
            data-carousel-progress-pill
            className="absolute inset-y-0 left-0 overflow-hidden rounded-full bg-black/15 shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_6px_14px_rgba(0,0,0,0.16)] transition-transform duration-500 ease-out"
            style={{
              transform: `translateX(${active * 100}%)`,
              width: `${100 / banners.length}%`,
            }}
          >
            <div
              data-carousel-progress-fill
              className="carousel-progress-fill h-full w-full origin-left rounded-full bg-black shadow-[0_0_18px_rgba(127,255,0,0.45)]"
              key={active}
            />
          </div>
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
  const articleRef = useRef<HTMLElement | null>(null);
  const leftContentRef = useRef<HTMLDivElement | null>(null);
  const sourceRef = useRef<HTMLDivElement | null>(null);
  const rightContentRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const imageSheenRef = useRef<HTMLSpanElement | null>(null);
  const tagRowRef = useRef<HTMLDivElement | null>(null);
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const dekRef = useRef<HTMLParagraphElement | null>(null);
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (compact) return;

    const article = articleRef.current;
    const leftContent = leftContentRef.current;
    const source = sourceRef.current;
    const rightContent = rightContentRef.current;
    const image = imageRef.current;
    const imageSheen = imageSheenRef.current;
    const tagRow = tagRowRef.current;
    const title = titleRef.current;
    const dek = dekRef.current;
    const body = bodyRef.current;
    const footer = footerRef.current;
    if (
      !article ||
      !leftContent ||
      !source ||
      !rightContent ||
      !image ||
      !imageSheen ||
      !tagRow ||
      !title ||
      !dek ||
      !body ||
      !footer
    ) {
      return;
    }

    const mm = gsap.matchMedia();

    mm.add(
      {
        all: "all",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const duration = reduceMotion ? 0 : 0.56;
        const textTargets = [title, dek, body, footer];

        gsap.set([leftContent, source, rightContent], {
          autoAlpha: 1,
          filter: "blur(10px)",
        });
        gsap.set(image, { scale: 1.08, xPercent: -1.8, autoAlpha: 0.78 });
        gsap.set(imageSheen, { xPercent: -140, autoAlpha: 0 });
        gsap.set(tagRow.children, { y: -8, scale: 0.88, autoAlpha: 0 });
        gsap.set(textTargets, { y: 24, autoAlpha: 0 });
        gsap.set(body, { backgroundColor: "rgba(255,255,255,0.28)" });

        const timeline = gsap.timeline({
          defaults: { ease: "power3.out" },
        });

        timeline
          .fromTo(
            article,
            { boxShadow: "0 10px 24px rgba(0,0,0,0.08)" },
            {
              boxShadow: "0 20px 42px rgba(0,0,0,0.16)",
              duration: reduceMotion ? 0 : 0.36,
            },
          )
          .to(
            [leftContent, source, rightContent],
            {
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: reduceMotion ? 0 : 0.5,
              stagger: reduceMotion ? 0 : 0.045,
            },
            0.02,
          )
          .fromTo(
            image,
            { scale: 1.08, xPercent: -1.8, autoAlpha: 0.78 },
            {
              scale: 1,
              xPercent: 0,
              autoAlpha: 1,
              duration: reduceMotion ? 0 : 0.82,
            },
            0.06,
          )
          .fromTo(
            imageSheen,
            { xPercent: -140, autoAlpha: 0 },
            {
              xPercent: 140,
              autoAlpha: reduceMotion ? 0 : 0.72,
              duration: reduceMotion ? 0 : 0.9,
              ease: "power2.out",
            },
            0.14,
          )
          .fromTo(
            tagRow.children,
            { y: -8, scale: 0.88, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              duration: reduceMotion ? 0 : 0.38,
              stagger: reduceMotion ? 0 : 0.055,
            },
            0.16,
          )
          .fromTo(
            textTargets,
            { y: 24, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration,
              stagger: reduceMotion ? 0 : 0.07,
            },
            0.24,
          );

        timeline.fromTo(
          body,
          { backgroundColor: "rgba(255,255,255,0.28)" },
          {
            backgroundColor: "rgba(255,255,255,0.62)",
            duration: reduceMotion ? 0 : 0.58,
          },
          0.36,
        );

        return () => timeline.kill();
      },
    );

    return () => mm.revert();
  }, [banner.id, compact]);

  return (
    <article
      className={`grid h-full grid-cols-[0.82fr_1.18fr] transition-[filter,opacity,transform] duration-500 ease-out ${
        compact ? "pointer-events-none opacity-70 blur-[7px] saturate-[0.78]" : "opacity-100 blur-0 saturate-100"
      }`}
      ref={articleRef}
    >
      <div className="relative flex min-w-0 flex-col overflow-hidden border-r-2 border-black bg-white/45">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-black/15 p-[clamp(8px,0.9vw,12px)]">
          <span className="display-font whitespace-nowrap rounded-full bg-black px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] uppercase text-white">
            RiotBus News
          </span>
          <span className="whitespace-nowrap rounded-full bg-white/70 px-2 py-1 text-[clamp(8px,0.68vw,10px)] font-black">
            {banner.updatedAt}
          </span>
        </div>
        <div
          className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/5"
          ref={leftContentRef}
        >
          <img
            alt={`${banner.title} banner image`}
            className="h-full w-full object-cover object-center will-change-transform"
            decoding="async"
            fetchPriority={isProminent ? "high" : "low"}
            loading={isProminent ? "eager" : "lazy"}
            ref={imageRef}
            width={960}
            height={1200}
            src={banner.imageSrc}
          />
          <span
            className="pointer-events-none absolute inset-y-[-18%] left-0 w-1/3 rotate-12 bg-gradient-to-r from-transparent via-white/34 to-transparent mix-blend-screen"
            ref={imageSheenRef}
          />
        </div>
        <div
          className="banner-copy-fade flex shrink-0 items-center gap-1.5 border-t border-black/15 p-[clamp(8px,0.9vw,12px)] text-[clamp(9px,0.8vw,12px)] font-black"
          ref={sourceRef}
        >
          <ExternalLink size={12} strokeWidth={3} />
          <span className="min-w-0 whitespace-nowrap">{banner.sourceLabel}</span>
        </div>
      </div>
      <div
        className="relative flex min-w-0 flex-col overflow-hidden bg-white/35 p-[clamp(12px,1.4vw,20px)] text-left"
        ref={rightContentRef}
      >
        <div
          className="banner-copy-fade flex shrink-0 max-h-9 flex-nowrap gap-2 overflow-hidden"
          ref={tagRowRef}
        >
          <span className="whitespace-nowrap rounded-full bg-brat-green px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
            pop emergency
          </span>
          <span className="whitespace-nowrap rounded-full bg-riot-pink/70 px-2.5 py-1.5 text-[clamp(8px,0.72vw,11px)] font-black uppercase">
            messy but cute
          </span>
        </div>
        <h2
          className="display-font mt-2 text-[clamp(20px,2.3vw,32px)] leading-[0.95]"
          ref={titleRef}
        >
          {banner.title}
        </h2>
        <p
          className="banner-copy-fade mt-1.5 line-clamp-4 max-h-[7.2em] overflow-hidden text-[clamp(11px,1vw,14px)] font-black leading-[1.8] text-black/78"
          ref={dekRef}
        >
          {banner.dek}
        </p>
        <p
          className="banner-copy-fade mt-2 line-clamp-4 max-h-[7.8em] overflow-hidden rounded-[15px] bg-white/62 p-2.5 text-[clamp(10px,0.82vw,12px)] font-bold leading-[1.7] text-black/75"
          ref={bodyRef}
        >
          {banner.body}
        </p>
        <div
          className="mt-auto flex items-center justify-between gap-3 border-t-2 border-black/20 pt-3"
          ref={footerRef}
        >
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
