"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { artists } from "@/data/artists";
import type { BattleMode, MetricKey } from "@/lib/types";

const metrics: Array<{ key: MetricKey; label: string; source: string }> = [
  { key: "sales", label: "销量", source: "CM" },
  { key: "streaming", label: "流媒体", source: "Spotify" },
  { key: "awards", label: "奖项", source: "GRAMMY" },
  { key: "reviews", label: "乐评", source: "AOTY / RYM" },
];

export function FilterModal({
  mode,
  onClose,
}: {
  mode: BattleMode;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>([
    "sales",
    "streaming",
    "awards",
    "reviews",
  ]);
  const [apiMode, setApiMode] = useState<"default" | "custom">("default");
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return (
      selectedArtists.length === 2 &&
      selectedMetrics.length > 0 &&
      (apiMode === "default" || checked)
    );
  }, [apiMode, checked, selectedArtists.length, selectedMetrics.length]);

  function toggleArtist(id: string) {
    setSelectedArtists((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 2) return current;
      return [...current, id];
    });
  }

  function toggleMetric(metric: MetricKey) {
    setSelectedMetrics((current) => {
      if (current.includes(metric)) {
        return current.filter((item) => item !== metric);
      }
      return [...current, metric];
    });
  }

  function submit() {
    if (!canSubmit) return;
    const params = new URLSearchParams({
      mode,
      a: selectedArtists[0],
      b: selectedArtists[1],
      metrics: selectedMetrics.join(","),
    });
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 p-5 backdrop-blur-sm">
      <motion.div
        className="glass-strong relative w-full max-w-6xl rounded-[34px] p-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <button
          aria-label="Close filter modal"
          className="absolute right-8 top-8 flex size-12 items-center justify-center rounded-full bg-black/10 transition-transform hover:scale-105"
          onClick={onClose}
          type="button"
        >
          <X strokeWidth={4} />
        </button>
        <div className="display-font inline-flex rounded-2xl bg-brat-green px-7 py-4 text-3xl">
          {mode === "mean" ? "刻薄女孩 Mode" : "清清白白 Mode"}
        </div>
        <div className="mt-8 grid grid-cols-[0.9fr_1.1fr] gap-10 max-lg:grid-cols-1">
          <section>
            <div className="mb-4 flex items-end justify-between">
              <h2 className="display-font text-4xl">artists</h2>
              <span className="rounded-full bg-white/50 px-4 py-2 font-bold">
                已选 {selectedArtists.length}/2
              </span>
            </div>
            <div className="grid grid-cols-5 gap-4 max-sm:grid-cols-3">
              {artists.map((artist) => {
                const selected = selectedArtists.includes(artist.id);
                return (
                  <button
                    key={artist.id}
                    className="group flex flex-col items-center gap-2"
                    onClick={() => toggleArtist(artist.id)}
                    type="button"
                  >
                    <span
                      className="relative flex size-16 items-center justify-center rounded-full border-2 border-black/20 transition-transform group-hover:scale-105"
                      style={{ background: artist.avatarColor }}
                    >
                      {selected ? (
                        <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-brat-green text-black">
                          <Check size={16} strokeWidth={4} />
                        </span>
                      ) : null}
                    </span>
                    <span className="text-center text-sm font-bold leading-tight">
                      {artist.shortName}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
          <section>
            <h2 className="display-font mb-4 text-4xl">维度</h2>
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              {metrics.map((metric) => {
                const selected = selectedMetrics.includes(metric.key);
                return (
                  <button
                    key={metric.key}
                    className="glass flex items-center justify-between rounded-2xl p-5 text-left transition-transform hover:scale-[1.01]"
                    onClick={() => toggleMetric(metric.key)}
                    type="button"
                  >
                    <span>
                      <span className="display-font block text-3xl">
                        {metric.label}
                      </span>
                      <span className="font-bold text-black/60">
                        {metric.source}
                      </span>
                    </span>
                    <span
                      className={`flex size-12 items-center justify-center rounded-xl border-2 border-black ${
                        selected ? "bg-brat-green" : "bg-white/30"
                      }`}
                    >
                      {selected ? <Check strokeWidth={4} /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-7 rounded-[24px] bg-white/35 p-5">
              <div className="mb-4 flex gap-3">
                <button
                  className={`rounded-full px-5 py-2 font-bold ${
                    apiMode === "default" ? "bg-brat-green" : "bg-white/40"
                  }`}
                  onClick={() => setApiMode("default")}
                  type="button"
                >
                  default AI
                </button>
                <button
                  className={`rounded-full px-5 py-2 font-bold ${
                    apiMode === "custom" ? "bg-riot-pink" : "bg-white/40"
                  }`}
                  onClick={() => setApiMode("custom")}
                  type="button"
                >
                  custom
                </button>
              </div>
              {apiMode === "custom" ? (
                <div className="grid gap-3">
                  <input
                    className="rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot"
                    placeholder="base_url"
                  />
                  <input
                    className="rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot"
                    placeholder="api_key"
                    type="password"
                  />
                  <div className="flex items-center gap-3">
                    <input
                      className="min-w-0 flex-1 rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot"
                      placeholder="model"
                    />
                    <button
                      className="display-font rounded-full bg-black px-6 py-3 text-white"
                      onClick={() => {
                        setChecked(false);
                        setError("MVP 这里先做 UI，真实校验接到 /api/ai/check 后启用。");
                      }}
                      type="button"
                    >
                      check
                    </button>
                  </div>
                  {error ? (
                    <p className="rounded-2xl bg-riot-pink/30 px-4 py-3 font-bold">
                      {error}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="font-bold">
                  我们先用 default AI 免费发车，额度用完再让用户自己填。
                </p>
              )}
            </div>
          </section>
        </div>
        <button
          className="display-font mx-auto mt-8 block w-full max-w-md rounded-full bg-black px-8 py-4 text-3xl text-white disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/35"
          disabled={!canSubmit}
          onClick={submit}
          type="button"
        >
          确认
        </button>
      </motion.div>
    </div>
  );
}
