"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { motion } from "framer-motion";
import { artists } from "@/data/artists";
import { ArtistAvatar } from "@/components/artist-avatar";
import { getArtistDisplayName } from "@/lib/artist-display";
import type { BattleMode, MetricKey } from "@/lib/types";

const metrics: Array<{ key: MetricKey; label: string; source: string }> = [
  { key: "sales", label: "销量", source: "CM" },
  { key: "streaming", label: "流媒", source: "Spotify followers" },
  { key: "awards", label: "奖项", source: "wins / noms / GF" },
  { key: "reviews", label: "乐评", source: "AOTY / RYM" },
];

const hotPairs = [
  {
    label: "Taylor vs Gaga",
    artists: ["taylor-swift", "lady-gaga"],
  },
  {
    label: "Sabrina vs Olivia",
    artists: ["sabrina-carpenter", "olivia-rodrigo"],
  },
  {
    label: "Lana vs Lorde",
    artists: ["lana-del-rey", "lorde"],
  },
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
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [checking, setChecking] = useState(false);
  const isMean = mode === "mean";
  const accentClass = isMean ? "bg-brat-green" : "bg-[#FF8AD7]";
  const accentSoftClass = isMean ? "bg-brat-green/45" : "bg-[#FF8AD7]/45";

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

  function selectHotPair(pair: string[]) {
    setSelectedArtists(pair);
  }

  function submit() {
    if (!canSubmit) return;
    if (apiMode === "custom") {
      sessionStorage.setItem(
        "riotbus.aiProvider",
        JSON.stringify({ baseUrl, apiKey, model }),
      );
    } else {
      sessionStorage.removeItem("riotbus.aiProvider");
    }
    const params = new URLSearchParams({
      mode,
      a: selectedArtists[0],
      b: selectedArtists[1],
      metrics: selectedMetrics.join(","),
    });
    router.push(`/compare?${params.toString()}`);
  }

  async function checkCustomApi() {
    setChecking(true);
    setChecked(false);
    setError("");
    try {
      const response = await fetch("/api/ai/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, model }),
      });
      const data = (await response.json()) as { ok?: boolean; message?: string };
      if (!response.ok || !data.ok) {
        setError(data.message || "API 校验失败。");
        return;
      }
      setChecked(true);
    } catch {
      setError("API 校验失败。");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 p-5 backdrop-blur-sm max-sm:items-end max-sm:p-3">
      <motion.div
        className="glass-strong relative flex max-h-[min(92dvh,920px)] w-full max-w-6xl flex-col overflow-hidden rounded-[34px] p-8 max-sm:max-h-[min(94dvh,920px)] max-sm:rounded-[28px] max-sm:p-4"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <button
          aria-label="Close filter modal"
          className="absolute right-8 top-8 flex size-12 items-center justify-center rounded-full bg-black/10 transition-transform hover:scale-105 max-sm:right-4 max-sm:top-4"
          onClick={onClose}
          type="button"
        >
          <X strokeWidth={4} />
        </button>
        <div className="min-h-0 overflow-y-auto pr-2 max-sm:pr-1">
          <div className={`display-font inline-flex rounded-2xl px-7 py-4 text-3xl max-sm:px-5 max-sm:py-3 max-sm:text-2xl ${accentClass}`}>
            {mode === "mean" ? "刻薄到底" : "清清白白"}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {hotPairs.map((pair) => (
              <button
                className={`rounded-full border-2 border-black/35 bg-white/45 px-4 py-2 text-sm font-black transition ${
                  isMean ? "hover:bg-brat-green" : "hover:bg-[#FF8AD7]"
                }`}
                key={pair.label}
                onClick={() => selectHotPair(pair.artists)}
                type="button"
              >
                {pair.label}
              </button>
            ))}
          </div>
          <div className="mt-6 grid grid-cols-[0.9fr_1.1fr] gap-10 max-lg:grid-cols-1">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3">
                <h2 className="display-font text-4xl max-sm:text-3xl">artists</h2>
                <span className="rounded-full bg-white/50 px-4 py-2 font-bold max-sm:px-3 max-sm:py-1.5">
                  已选 {selectedArtists.length}/2
                </span>
              </div>
              <div className="grid grid-cols-5 gap-4 max-sm:grid-cols-3 max-sm:gap-3">
                {artists.map((artist) => {
                  const selected = selectedArtists.includes(artist.id);
                  return (
                    <button
                      key={artist.id}
                      className="group flex flex-col items-center gap-2"
                      onClick={() => toggleArtist(artist.id)}
                      type="button"
                    >
                      <span className="relative transition-transform group-hover:scale-105">
                        <ArtistAvatar artist={artist} className="size-16" mode={mode} selected={selected} />
                        {selected ? (
                          <span className={`absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full text-black ${accentClass}`}>
                            <Check size={16} strokeWidth={4} />
                          </span>
                        ) : null}
                      </span>
                      <span className="text-center text-sm font-bold leading-tight">
                        {getArtistDisplayName(artist, mode)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
            <section>
              <h2 className="display-font mb-4 text-4xl max-sm:text-3xl">维度</h2>
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
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
                          selected ? accentClass : "bg-white/30"
                        }`}
                      >
                        {selected ? <Check strokeWidth={4} /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-7 rounded-[24px] bg-white/35 p-5 max-sm:mt-5 max-sm:p-4">
                <div className="mb-4 inline-grid max-w-full grid-cols-2 overflow-hidden rounded-full border-2 border-black bg-white/35 p-1 max-sm:mb-3">
                  {(["default", "custom"] as const).map((item) => (
                    <button
                      className={`rounded-full px-5 py-2 font-black transition ${
                        apiMode === item
                          ? item === "default"
                            ? accentClass
                            : "bg-riot-pink"
                          : "bg-transparent"
                      }`}
                      key={item}
                      onClick={() => setApiMode(item)}
                      type="button"
                    >
                      {item === "default" ? "default AI" : "custom"}
                    </button>
                  ))}
                </div>
                {apiMode === "custom" ? (
                  <div className="grid gap-3">
                    <input
                      className="rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot max-sm:px-4 max-sm:py-2.5"
                      onChange={(event) => setBaseUrl(event.target.value)}
                      placeholder="base_url"
                      value={baseUrl}
                    />
                    <input
                      className="rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot max-sm:px-4 max-sm:py-2.5"
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder="api_key"
                      type="password"
                      value={apiKey}
                    />
                    <div className="flex items-center gap-3">
                      <input
                        className="min-w-0 flex-1 rounded-full border border-black/25 bg-white/60 px-5 py-3 outline-none focus:border-brat-hot max-sm:px-4 max-sm:py-2.5"
                        onChange={(event) => setModel(event.target.value)}
                        placeholder="model"
                        value={model}
                      />
                      <button
                        className="display-font rounded-full bg-black px-6 py-3 text-white max-sm:px-4 max-sm:py-2.5"
                        disabled={checking}
                        onClick={checkCustomApi}
                        type="button"
                      >
                        {checking ? "..." : "check"}
                      </button>
                    </div>
                    {checked ? (
                      <p className={`rounded-2xl px-4 py-3 font-bold ${accentSoftClass}`}>
                        API 可用，可以发车。
                      </p>
                    ) : null}
                    {error ? (
                      <p className="rounded-2xl bg-riot-pink/30 px-4 py-3 font-bold">
                        {error}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="font-bold">
                    default免费发车
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
        <button
          className="display-font mx-auto mt-6 block w-full max-w-md shrink-0 rounded-full bg-black px-8 py-4 text-3xl text-white disabled:cursor-not-allowed disabled:bg-black/20 disabled:text-black/35 max-sm:mt-4 max-sm:px-6 max-sm:py-3 max-sm:text-2xl"
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
