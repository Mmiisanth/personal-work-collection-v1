"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { banners } from "@/data/banners";
import type { Banner, BattleMode } from "@/lib/types";
import { CapsuleSwitch } from "@/components/capsule-switch";
import { FilterModal } from "@/components/filter-modal";
import { NewsCarousel } from "@/components/news-carousel";
import { NewsModal } from "@/components/news-modal";

export function HomeShell() {
  const [activeBanner, setActiveBanner] = useState(0);
  const [mode, setMode] = useState<BattleMode>("mean");
  const [newsModal, setNewsModal] = useState<Banner | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden px-6 py-12 max-sm:px-4">
      <section className="mx-auto flex max-w-7xl flex-col items-center">
        <div className="glass display-font mb-12 rounded-[28px] px-24 py-8 text-center text-6xl shadow-glass max-md:px-10 max-md:text-5xl">
          RiotBus
        </div>
        <NewsCarousel
          active={activeBanner}
          banners={banners}
          onActiveChange={setActiveBanner}
          onOpen={setNewsModal}
        />
      </section>

      <section className="mx-auto mt-16 max-w-6xl">
        <h1 className="display-font text-6xl leading-none max-md:text-5xl">
          choose model
        </h1>
        <div className="mt-8 grid grid-cols-2 gap-6 max-md:grid-cols-1">
          <ModeCard
            active={mode === "mean"}
            title="刻薄女孩"
            lines={["mean tune", "黑话和争议素材", "会有点嘴毒"]}
            onClick={() => setMode("mean")}
          />
          <ModeCard
            active={mode === "neutral"}
            title="清清白白"
            lines={["neutral tune", "无黑料", "客观整理数据"]}
            onClick={() => setMode("neutral")}
            pink
          />
        </div>
        <div className="mt-10 flex items-center justify-center gap-5">
          <CapsuleSwitch onChange={setMode} value={mode} />
          <button
            className="display-font flex size-16 items-center justify-center rounded-full bg-white/60 text-2xl shadow-glass transition-transform hover:scale-105"
            onClick={() => setFilterOpen(true)}
            type="button"
          >
            <ArrowRight strokeWidth={4} />
          </button>
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-6xl grid-cols-3 gap-5 pb-20 max-lg:grid-cols-1">
        {["Taylor vs Gaga", "Sabrina vs Olivia", "Lana vs Lorde"].map(
          (item) => (
            <div className="glass rounded-[24px] p-6" key={item}>
              <p className="display-font text-3xl">{item}</p>
              <p className="mt-3 font-bold text-black/65">热门默认 PK 入口</p>
            </div>
          ),
        )}
      </section>

      <NewsModal banner={newsModal} onClose={() => setNewsModal(null)} />
      {filterOpen ? (
        <FilterModal mode={mode} onClose={() => setFilterOpen(false)} />
      ) : null}
    </main>
  );
}

function ModeCard({
  active,
  title,
  lines,
  onClick,
  pink,
}: {
  active: boolean;
  title: string;
  lines: string[];
  onClick: () => void;
  pink?: boolean;
}) {
  return (
    <button
      className={`glass rounded-[24px] p-7 text-left transition-transform hover:-translate-y-1 ${
        active ? "ring-4 ring-black/20" : ""
      }`}
      onClick={onClick}
      type="button"
    >
      <p
        className="display-font inline-flex rounded-2xl px-5 py-3 text-4xl"
        style={{ background: pink ? "#FFD2EA" : "#8CFF4F" }}
      >
        {title}
      </p>
      <div className="mt-6 space-y-2 text-2xl font-black">
        {lines.map((line, index) => (
          <p key={line}>
            {index + 1}. {line}
          </p>
        ))}
      </div>
    </button>
  );
}
