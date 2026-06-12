"use client";

import { useDeferredValue, useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import { banners } from "@/data/banners";
import type { Banner, BattleMode } from "@/lib/types";
import { CapsuleSwitch } from "@/components/capsule-switch";
import { DynamicSlopeBackground } from "@/components/dynamic-slope-background";
import { FilterModal } from "@/components/filter-modal";
import { NewsCarousel } from "@/components/news-carousel";
import { NewsModal } from "@/components/news-modal";

export function HomeShell() {
  const shellRef = useRef<HTMLElement | null>(null);
  const [activeBanner, setActiveBanner] = useState(0);
  const [mode, setMode] = useState<BattleMode>("mean");
  const backgroundMode = useDeferredValue(mode);
  const [newsModal, setNewsModal] = useState<Banner | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [modeNoticeOpen, setModeNoticeOpen] = useState(true);
  const [hasChosenMode, setHasChosenMode] = useState(false);
  const hiddenHomeRevealStyle: CSSProperties | undefined = hasChosenMode
    ? undefined
    : {
        opacity: 0,
        transform: "translateY(18px)",
        visibility: "hidden",
      };

  function chooseMode(nextMode: BattleMode) {
    setMode(nextMode);
    setHasChosenMode(true);
    setModeNoticeOpen(false);
  }

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!shell) return;

    const title = shell.querySelector("[data-home-reveal='title']");
    const carousel = shell.querySelector("[data-home-reveal='carousel']");
    const modePanel = shell.querySelector("[data-home-reveal='mode-panel']");
    const modeDetails = shell.querySelectorAll("[data-home-reveal='mode-detail']");
    const revealTargets = [title, carousel, modePanel, ...modeDetails].filter(Boolean);

    if (!hasChosenMode) {
      gsap.set(revealTargets, {
        autoAlpha: 0,
        y: 18,
      });
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

        gsap.set(revealTargets, {
          autoAlpha: 0,
          y: reduceMotion ? 0 : 18,
        });

        const timeline = gsap.timeline({
          defaults: {
            duration: reduceMotion ? 0 : 0.62,
            ease: "power3.out",
          },
        });

        timeline
          .to(title, { autoAlpha: 1, y: 0 }, 0.18)
          .to(carousel, { autoAlpha: 1, y: 0, duration: reduceMotion ? 0 : 0.74 }, 0.44)
          .to(modePanel, { autoAlpha: 1, y: 0 }, 0.78)
          .to(
            modeDetails,
            {
              autoAlpha: 1,
              y: 0,
              stagger: reduceMotion ? 0 : 0.12,
              duration: reduceMotion ? 0 : 0.5,
            },
            0.98,
          );

        return () => timeline.kill();
      },
    );

    return () => mm.revert();
  }, [hasChosenMode]);

  return (
    <main
      ref={shellRef}
      className={`landing-shell relative isolate flex min-h-dvh w-full flex-col overflow-x-hidden ${
        backgroundMode === "mean" ? "bg-[#7FFF00]" : "bg-[#FF4FD8]"
      }`}
    >
      <DynamicSlopeBackground mode={backgroundMode} />
      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(14px,4vw,56px)] py-[clamp(10px,1.8dvh,22px)]">
        <div
          className="display-font mb-[clamp(10px,2.1dvh,24px)] w-[min(470px,44vw)] rounded-[24px] border border-black/50 bg-white/50 px-8 py-[clamp(10px,1.25dvh,15px)] text-center text-[clamp(30px,3.3vw,44px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-2xl max-md:w-[72vw]"
          data-home-reveal="title"
          style={hiddenHomeRevealStyle}
        >
          RiotBus
        </div>
        <div className="w-full" data-home-reveal="carousel" style={hiddenHomeRevealStyle}>
          <NewsCarousel
            active={activeBanner}
            banners={banners}
            onActiveChange={setActiveBanner}
            onOpen={setNewsModal}
          />
        </div>
      </section>

      <section className="relative z-10 shrink-0 px-[clamp(18px,4vw,58px)] pb-[clamp(14px,2dvh,24px)] pt-[clamp(10px,1.6dvh,18px)]">
        <div
          className="mx-auto w-full max-w-[1180px] rounded-[30px] border border-black/50 bg-white/50 px-[clamp(16px,2vw,28px)] py-[clamp(12px,1.8dvh,20px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_18px_46px_rgba(0,0,0,0.08)] backdrop-blur-2xl [--switch-width:470px] max-md:[--switch-width:64vw]"
          data-home-reveal="mode-panel"
          style={hiddenHomeRevealStyle}
        >
          <div className="mx-auto w-[var(--switch-width)] text-center" data-home-reveal="mode-detail">
            <h1 className="display-font text-[clamp(38px,5vw,68px)] leading-[0.95]">
              choose model
            </h1>
            <p className="mt-4 text-[clamp(14px,1.15vw,18px)] font-black leading-tight text-black/70">
              先选模式再上车筛艺人和维度
            </p>
          </div>

          <div className="relative mt-[clamp(12px,1.8dvh,20px)] flex min-h-12 items-center justify-between gap-4 overflow-visible max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-4">
            <div className="shrink-0 pl-[clamp(2px,0.6vw,8px)] text-left max-md:order-1 max-md:w-[calc(50%-6px)]" data-home-reveal="mode-detail">
              <ModeCopy lines={["mean tune", "offensive"]} title="mean mode" />
            </div>
            <div className="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center max-md:relative max-md:order-2 max-md:left-auto max-md:mx-auto max-md:translate-x-0" data-home-reveal="mode-detail">
              <CapsuleSwitch onChange={setMode} value={mode} />
              <button
                className="display-font absolute left-full ml-3 flex size-12 shrink-0 items-center justify-center rounded-full border border-black/55 bg-white/30 text-[clamp(24px,2.4vw,34px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/50"
                onClick={() => setFilterOpen(true)}
                type="button"
              >
                <ArrowRight strokeWidth={4} />
              </button>
            </div>
            <div className="shrink-0 pr-[clamp(2px,0.6vw,8px)] text-left max-md:order-1 max-md:w-[calc(50%-6px)] max-md:text-right" data-home-reveal="mode-detail">
              <ModeCopy lines={["neutral tune", "kind"]} title="normal mode" />
            </div>
          </div>
        </div>
      </section>

      <NewsModal banner={newsModal} onClose={() => setNewsModal(null)} />
      {filterOpen ? (
        <FilterModal mode={mode} onClose={() => setFilterOpen(false)} />
      ) : null}
      {modeNoticeOpen ? (
        <ModeNoticeModal onChoose={chooseMode} />
      ) : null}
    </main>
  );
}

function ModeCopy({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="font-black">
      <p className="display-font text-[clamp(22px,2.3vw,34px)] leading-[0.95]">{title}</p>
      <div className="mt-3 text-[clamp(15px,1.35vw,22px)] leading-tight text-black/80">
        {lines.map((line, index) => (
          <p key={line}>{index + 1}. {line}</p>
        ))}
      </div>
    </div>
  );
}

function ModeNoticeModal({
  onChoose,
}: {
  onChoose: (mode: BattleMode) => void;
}) {
  const modalRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;

    const panel = modal.querySelector("[data-mode-notice='panel']");
    const items = modal.querySelectorAll("[data-mode-notice='item']");
    const mm = gsap.matchMedia();

    mm.add(
      {
        all: "all",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const timeline = gsap.timeline({
          defaults: {
            duration: reduceMotion ? 0 : 0.42,
            ease: "power3.out",
          },
        });

        timeline
          .fromTo(
            panel,
            { y: reduceMotion ? 0 : 20, scale: reduceMotion ? 1 : 0.985, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1 },
            0,
          )
          .fromTo(
            items,
            { y: reduceMotion ? 0 : 16, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              stagger: reduceMotion ? 0 : 0.08,
            },
            0.14,
          );

        return () => timeline.kill();
      },
    );

    return () => mm.revert();
  }, []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 p-5 backdrop-blur-sm max-sm:p-3"
      ref={modalRef}
    >
      <div
        className="glass-strong relative w-full max-w-[760px] overflow-hidden rounded-[34px] border-2 border-black/35 p-[clamp(18px,3vw,34px)] shadow-[0_28px_80px_rgba(0,0,0,0.18)]"
        data-mode-notice="panel"
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-multiply [background-image:radial-gradient(circle,rgba(0,0,0,0.55)_1.2px,transparent_1.9px)] [background-size:13px_13px]" />
        <div className="relative">
          <p className="display-font inline-flex rounded-full bg-black px-5 py-2 text-sm uppercase text-white" data-mode-notice="item">
            RiotBus V1.1
          </p>
          <h2 className="display-font mt-5 text-[clamp(38px,6vw,70px)] leading-[0.9]" data-mode-notice="item">
            先选上车模式
          </h2>
          <p className="mt-4 max-w-2xl text-[clamp(15px,1.5vw,19px)] font-black leading-relaxed text-black/75" data-mode-notice="item">
            RiotBus 正式版本 V1.1 已上线，新增多智能体协同功能和优化动效设计。你可以先选择自己能接受的游玩方式；如有建议，请反馈到 soeuriours@outlook.com。
          </p>

          <div className="mt-7 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <button
              className="group rounded-[28px] border-2 border-black bg-[#7FFF00] p-5 text-left shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5"
              data-mode-notice="item"
              onClick={() => onChoose("mean")}
              type="button"
            >
              <p className="display-font text-[clamp(30px,4vw,46px)] leading-none">
                mean mode
              </p>
              <p className="mt-4 text-[clamp(14px,1.35vw,17px)] font-black leading-snug">
                会出现很刻薄、攻击性的称呼和话术，适合想体验黑话 battle 与饭圈梗文化的用户，敏感或只想看客观数据请谨慎选择。
              </p>
              <span className="mt-5 inline-flex rounded-full bg-black px-5 py-2 text-sm font-black text-white">
                选择 mean
              </span>
            </button>

            <button
              className="group rounded-[28px] border-2 border-black bg-[#FF8AD7] p-5 text-left shadow-[0_14px_30px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5"
              data-mode-notice="item"
              onClick={() => onChoose("neutral")}
              type="button"
            >
              <p className="display-font text-[clamp(30px,4vw,46px)] leading-none">
                normal mode
              </p>
              <p className="mt-4 text-[clamp(14px,1.35vw,17px)] font-black leading-snug">
                更适合客观了解艺人销量、流媒、奖项、乐评等数据，用相对温和的方式生成对比总结和信息说明。
              </p>
              <span className="mt-5 inline-flex rounded-full bg-black px-5 py-2 text-sm font-black text-white">
                选择正常
              </span>
            </button>
          </div>

          <a
            className="mt-5 block break-all text-xs font-black text-black/58 underline decoration-black/30 underline-offset-4"
            data-mode-notice="item"
            href="https://github.com/Mmiisanth/personal-work-collection-v1/tree/main/riotbus"
            rel="noreferrer"
            target="_blank"
          >
            GitHub: https://github.com/Mmiisanth/personal-work-collection-v1/tree/main/riotbus
          </a>
        </div>
      </div>
    </div>
  );
}
