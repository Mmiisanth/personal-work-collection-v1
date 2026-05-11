"use client";

import { useDeferredValue, useState } from "react";
import { ArrowRight } from "lucide-react";
import { banners } from "@/data/banners";
import type { Banner, BattleMode } from "@/lib/types";
import { CapsuleSwitch } from "@/components/capsule-switch";
import { DynamicSlopeBackground } from "@/components/dynamic-slope-background";
import { FilterModal } from "@/components/filter-modal";
import { NewsCarousel } from "@/components/news-carousel";
import { NewsModal } from "@/components/news-modal";

export function HomeShell() {
  const [activeBanner, setActiveBanner] = useState(0);
  const [mode, setMode] = useState<BattleMode>("mean");
  const backgroundMode = useDeferredValue(mode);
  const [newsModal, setNewsModal] = useState<Banner | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <main
      className={`landing-shell relative isolate flex min-h-dvh w-full flex-col overflow-x-hidden ${
        backgroundMode === "mean" ? "bg-[#7FFF00]" : "bg-[#FF4FD8]"
      }`}
    >
      <DynamicSlopeBackground mode={backgroundMode} />
      <section className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-[clamp(14px,4vw,56px)] py-[clamp(10px,1.8dvh,22px)]">
        <div className="display-font mb-[clamp(10px,2.1dvh,24px)] w-[min(470px,44vw)] rounded-[24px] border border-black/50 bg-white/50 px-8 py-[clamp(10px,1.25dvh,15px)] text-center text-[clamp(30px,3.3vw,44px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.6),0_14px_34px_rgba(0,0,0,0.08)] backdrop-blur-2xl max-md:w-[72vw]">
          RiotBus
        </div>
        <NewsCarousel
          active={activeBanner}
          banners={banners}
          onActiveChange={setActiveBanner}
          onOpen={setNewsModal}
        />
      </section>

      <section className="relative z-10 shrink-0 px-[clamp(18px,4vw,58px)] pb-[clamp(14px,2dvh,24px)] pt-[clamp(10px,1.6dvh,18px)]">
        <div
          className="mx-auto w-full max-w-[1180px] rounded-[30px] border border-black/50 bg-white/50 px-[clamp(16px,2vw,28px)] py-[clamp(12px,1.8dvh,20px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.62),0_18px_46px_rgba(0,0,0,0.08)] backdrop-blur-2xl [--switch-width:470px] max-md:[--switch-width:64vw]"
        >
          <div className="mx-auto w-[var(--switch-width)] text-center">
            <h1 className="display-font text-[clamp(38px,5vw,68px)] leading-[0.95]">
              choose model
            </h1>
            <p className="mt-4 text-[clamp(14px,1.15vw,18px)] font-black leading-tight text-black/70">
              先选模式再上车筛艺人和维度。
            </p>
          </div>

          <div className="relative mt-[clamp(12px,1.8dvh,20px)] flex min-h-12 items-center justify-between gap-4 overflow-visible max-md:flex-wrap max-md:items-center max-md:gap-x-3 max-md:gap-y-4">
            <div className="shrink-0 pl-[clamp(2px,0.6vw,8px)] text-left max-md:order-1 max-md:w-[calc(50%-6px)]">
              <ModeCopy lines={["mean tune", "offensive"]} title="mean mode" />
            </div>
            <div className="pointer-events-auto absolute left-1/2 flex -translate-x-1/2 items-center max-md:relative max-md:order-2 max-md:left-auto max-md:mx-auto max-md:translate-x-0">
              <CapsuleSwitch onChange={setMode} value={mode} />
              <button
                className="display-font absolute left-full ml-3 flex size-12 shrink-0 items-center justify-center rounded-full border border-black/55 bg-white/30 text-[clamp(24px,2.4vw,34px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.68),0_10px_24px_rgba(0,0,0,0.12)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/50"
                onClick={() => setFilterOpen(true)}
                type="button"
              >
                <ArrowRight strokeWidth={4} />
              </button>
            </div>
            <div className="shrink-0 pr-[clamp(2px,0.6vw,8px)] text-left max-md:order-1 max-md:w-[calc(50%-6px)] max-md:text-right">
              <ModeCopy lines={["neutral tune", "kind"]} title="normal mode" />
            </div>
          </div>
        </div>
      </section>

      <NewsModal banner={newsModal} onClose={() => setNewsModal(null)} />
      {filterOpen ? (
        <FilterModal mode={mode} onClose={() => setFilterOpen(false)} />
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
