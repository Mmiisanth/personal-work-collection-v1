"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Send, X } from "lucide-react";
import type { AiProvider, BattleMode, MetricKey } from "@/lib/types";
import { artists } from "@/data/artists";

type Message = {
  role: "ai" | "user";
  content: string;
};

const metricLabels: Record<MetricKey, string> = {
  sales: "销量",
  streaming: "流媒体",
  awards: "奖项",
  reviews: "乐评",
};

export function AiPanel({
  artistAId,
  artistBId,
  mode,
  metrics,
}: {
  artistAId: string;
  artistBId: string;
  mode: BattleMode;
  metrics: MetricKey[];
}) {
  const artistA = artists.find((artist) => artist.id === artistAId) ?? artists[0];
  const artistB = artists.find((artist) => artist.id === artistBId) ?? artists[1];
  const [input, setInput] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messageEndRef = useRef<HTMLDivElement | null>(null);
  const isMean = mode === "mean";
  const accentClass = isMean ? "bg-[#9DFF55]" : "bg-[#FF8AD7]";
  const highlightClass = isMean ? "bg-[#9DFF55]/55" : "bg-[#FF8AD7]/62";
  const shellTintClass = isMean ? "bg-[#F1FFE5]/80" : "bg-[#FFF0FA]/84";
  const panelTintClass = isMean ? "bg-[#F1FFE5]/45" : "bg-[#FFE1F3]/50";
  const aiBubbleClass = isMean ? "bg-white/66" : "bg-[#FFF6FC]/78";

  const dataSummary = useMemo(
    () =>
      metrics
        .map(
          (metric) =>
            `${metricLabels[metric]}：${artistA.shortName} = ${
              artistA.stats[metric] || "缺失"
            }；${artistB.shortName} = ${
              artistB.stats[metric] || "缺失"
            }`,
        )
        .join("\n"),
    [artistA.shortName, artistA.stats, artistB.shortName, artistB.stats, metrics],
  );

  function getStoredProvider(): AiProvider | undefined {
    const raw = sessionStorage.getItem("riotbus.aiProvider");
    if (!raw) return undefined;
    try {
      const provider = JSON.parse(raw) as AiProvider;
      if (!provider.baseUrl || !provider.apiKey || !provider.model) return undefined;
      return provider;
    } catch {
      return undefined;
    }
  }

  useEffect(() => {
    let ignore = false;

    async function generateOpening() {
      setLoading(true);
      try {
        const response = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            artistA: artistA.name,
            artistB: artistB.name,
            metrics,
            dataSummary,
            provider: getStoredProvider(),
          }),
        });
        const data = (await response.json()) as { message?: string };
        if (!ignore) {
          setMessages([
            {
              role: "ai",
              content: data.message || "AI 这次没憋出话，先看左边数据。",
            },
          ]);
        }
      } catch {
        if (!ignore) {
          setMessages([
            {
              role: "ai",
              content: "AI 暂时掉线了，先看左边数据，等下再上车。",
            },
          ]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    generateOpening();

    return () => {
      ignore = true;
    };
  }, [artistA.name, artistB.name, dataSummary, metrics, mode]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [loading, messages, sending]);

  async function send() {
    if (!input.trim() || sending || loading) return;
    const userMessage = input.trim();
    setInput("");
    setSending(true);
    setMessages((current) => [
      ...current,
      { role: "user", content: userMessage },
    ]);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          artistA: artistA.name,
          artistB: artistB.name,
          metrics,
          dataSummary,
          userQuestion: userMessage,
          provider: getStoredProvider(),
        }),
      });
      const data = (await response.json()) as { message?: string };
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          content: data.message || "AI 这次没接住，换个问法再来。",
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "ai", content: "AI 追问暂时失败，等下再试。" },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className={`flex h-[680px] max-h-[calc(100vh-92px)] min-h-[560px] flex-col rounded-[28px] border border-white/75 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.13)] backdrop-blur-[14px] ${shellTintClass}`}>
      <div className="mb-4 flex shrink-0 items-center justify-between gap-4">
        <p className="display-font text-3xl max-sm:text-2xl">乱斗报告</p>
        <button
          className={`display-font rounded-full px-5 py-2 text-sm ${accentClass}`}
          onClick={() => setExportOpen(true)}
          type="button"
        >
          总结生成报告
        </button>
      </div>
      <div className={`min-h-0 flex-1 space-y-3 overflow-y-auto rounded-[24px] border border-black/10 p-3 pr-2 ${panelTintClass}`}>
        {loading ? (
          <div className={`${aiBubbleClass} rounded-[20px] p-4 text-sm font-bold leading-relaxed`}>
            发车中先别急。
          </div>
        ) : null}
        {messages.map((message, index) => (
          <div
            className={`max-w-[92%] rounded-[20px] p-4 text-sm font-bold leading-relaxed ${
              message.role === "ai"
                ? aiBubbleClass
                : `ml-auto ${accentClass}`
            }`}
            key={`${message.role}-${index}`}
          >
            <MarkdownMessage content={message.content} highlightClass={highlightClass} />
          </div>
        ))}
        {sending ? (
          <div className={`${aiBubbleClass} rounded-[20px] p-4 text-sm font-bold leading-relaxed`}>
            挽尊中。。。
          </div>
        ) : null}
        <div ref={messageEndRef} />
      </div>
      <div className="mt-4 flex shrink-0 items-end gap-3">
        <textarea
          className={`max-h-28 min-h-14 min-w-0 flex-1 resize-none rounded-[22px] border border-black/20 bg-white/78 px-5 py-4 text-sm font-bold leading-snug outline-none ${
            isMean ? "focus:border-[#7FFF00]" : "focus:border-[#FF4FD8]"
          }`}
          onChange={(event) => setInput(event.target.value)}
          placeholder="接着问或者直接反驳... 点击右边按钮发送"
          rows={2}
          value={input}
        />
        <button
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-black text-white transition disabled:cursor-not-allowed disabled:bg-black/35"
          disabled={!input.trim() || sending || loading}
          onClick={send}
          type="button"
        >
          <Send />
        </button>
      </div>
      {exportOpen ? (
        <ExportModal
          artistA={artistA.shortName}
          artistB={artistB.shortName}
          conversation={messages
            .map((message) => `${message.role}: ${message.content}`)
            .join("\n")}
          mode={mode}
          provider={getStoredProvider()}
          onClose={() => setExportOpen(false)}
        />
      ) : null}
    </div>
  );
}

function MarkdownMessage({
  content,
  highlightClass = "bg-[#9DFF55]/55",
}: {
  content: string;
  highlightClass?: string;
}) {
  const blocks = parseMarkdownBlocks(content);

  return (
    <div className="space-y-3 whitespace-normal break-words">
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <p className="display-font text-lg leading-tight" key={index}>
              <InlineMarkdown highlightClass={highlightClass} text={block.lines[0]} />
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul className="space-y-1 pl-5 marker:text-black" key={index}>
              {block.lines.map((line) => (
                <li className="list-disc" key={line}>
                  <InlineMarkdown highlightClass={highlightClass} text={line} />
                </li>
              ))}
            </ul>
          );
        }

        if (block.type === "ordered-list") {
          return (
            <ol className="space-y-1 pl-5 marker:font-black" key={index}>
              {block.lines.map((line) => (
                <li className="list-decimal" key={line}>
                  <InlineMarkdown highlightClass={highlightClass} text={line} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={index}>
            {block.lines.map((line, lineIndex) => (
              <Fragment key={`${line}-${lineIndex}`}>
                {lineIndex > 0 ? <br /> : null}
                <InlineMarkdown highlightClass={highlightClass} text={line} />
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

type MarkdownBlock = {
  type: "heading" | "list" | "ordered-list" | "paragraph";
  lines: string[];
};

function parseMarkdownBlocks(content: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  const lines = content.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").split("\n");
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trim();

    if (!line) {
      index += 1;
      continue;
    }

    if (/^#{1,3}\s+/.test(line)) {
      blocks.push({ type: "heading", lines: [line.replace(/^#{1,3}\s+/, "")] });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", lines: items });
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+[.)]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "ordered-list", lines: items });
      continue;
    }

    const paragraph: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() &&
      !/^#{1,3}\s+/.test(lines[index].trim()) &&
      !/^[-*]\s+/.test(lines[index].trim()) &&
      !/^\d+[.)]\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", lines: paragraph });
  }

  return blocks;
}

function InlineMarkdown({
  highlightClass,
  text,
}: {
  highlightClass: string;
  text: string;
}) {
  const renderInline = (value: string, keyPrefix: string): React.ReactNode[] => {
    const parts = value.split(
      /(<shade>[\s\S]+?<\/shade>|~~[\s\S]+?~~|\*\*[\s\S]+?\*\*|`[^`]+`|\*[^*\n]+\*)/g,
    );

    return parts.map((part, index) => {
        if (!part) return null;
        const key = `${keyPrefix}-${index}`;
        if (part.startsWith("<shade>") && part.endsWith("</shade>")) {
          return (
            <span className="rounded-md bg-zinc-400/45 px-1 text-zinc-950" key={key}>
              {renderInline(part.slice(7, -8), `${key}-shade`)}
            </span>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong className={`rounded-md px-1 font-black ${highlightClass}`} key={key}>
              {renderInline(part.slice(2, -2), `${key}-bold`)}
            </strong>
          );
        }
        if (part.startsWith("~~") && part.endsWith("~~")) {
          return (
            <span className="rounded-md bg-zinc-400/45 px-1 text-zinc-950" key={key}>
              {renderInline(part.slice(2, -2), `${key}-strike`)}
            </span>
          );
        }
        if (part.startsWith("`") && part.endsWith("`")) {
          return (
            <code className="rounded-md bg-black/10 px-1 py-0.5" key={key}>
              {part.slice(1, -1)}
            </code>
          );
        }
        if (part.startsWith("*") && part.endsWith("*")) {
          return <em key={key}>{renderInline(part.slice(1, -1), `${key}-em`)}</em>;
        }
        return <Fragment key={key}>{part}</Fragment>;
      });
  };

  return <>{renderInline(text, "inline")}</>;
}

function ExportModal({
  artistA,
  artistB,
  conversation,
  mode,
  provider,
  onClose,
}: {
  artistA: string;
  artistB: string;
  conversation: string;
  mode: BattleMode;
  provider?: AiProvider;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState(`${artistA} vs ${artistB}`);
  const [content, setContent] = useState("总结中");
  const [background, setBackground] = useState("#8CFF4F");
  const [exporting, setExporting] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLDivElement | null>(null);
  const shareUrl =
    typeof window === "undefined" ? "riotbus.local" : window.location.origin;
  const displayTitle = cleanExportTitle(title, `${artistA} vs ${artistB}`);
  const displayContent = loading
    ? "总结乱斗中。。。"
    : cleanExportContent(content);

  useEffect(() => {
    let ignore = false;

    async function generateExport() {
      try {
        const response = await fetch("/api/ai/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, artistA, artistB, conversation, provider }),
        });
        const data = (await response.json()) as {
          title?: string;
          content?: string;
        };
        if (!ignore) {
          setTitle(cleanExportTitle(data.title, `${artistA} vs ${artistB}`));
          setContent(cleanExportContent(data.content || "AI 没写出正文，稍后再试。"));
        }
      } catch {
        if (!ignore) {
          setContent("AI 总结暂时失败，稍后再试。");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    generateExport();

    return () => {
      ignore = true;
    };
  }, [artistA, artistB, conversation, mode]);

  async function exportShareImage() {
    setExporting(true);
    try {
      downloadShareImage({
        artistA,
        artistB,
        background,
        content: displayContent,
        mode,
        shareUrl,
        title: displayTitle,
      });
    } finally {
      window.setTimeout(() => setExporting(false), 450);
    }
  }

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const element = document.createElement("div");
    element.setAttribute("data-riotbus-export-root", "true");
    Object.assign(element.style, {
      bottom: "0",
      height: "100dvh",
      left: "0",
      position: "fixed",
      right: "0",
      top: "0",
      width: "100vw",
      zIndex: "2147483647",
    });

    document.body.appendChild(element);
    document.body.style.overflow = "hidden";
    setPortalElement(element);

    return () => {
      document.body.style.overflow = previousOverflow;
      element.remove();
    };
  }, []);

  if (!portalElement) return null;

  return createPortal(
    <div className="h-full w-full bg-black/24 p-4 backdrop-blur-md max-sm:p-2">
      <div className="glass-strong grid h-full w-full grid-cols-[minmax(0,1fr)_320px] gap-4 overflow-hidden rounded-[30px] p-4 max-md:auto-rows-max max-md:grid-cols-1 max-md:items-start max-md:overflow-y-auto max-sm:rounded-[22px] max-sm:p-2">
        <section className="min-h-0 rounded-[26px] border border-black/10 bg-white/28 p-3 max-md:h-auto">
          <div
            className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border-2 border-black p-[clamp(18px,2.1vw,30px)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-md:h-auto max-md:min-h-[680px] max-sm:min-h-[620px]"
            style={{ background }}
          >
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="display-font inline-flex rounded-full bg-black px-4 py-2 text-[clamp(12px,1.1vw,16px)] uppercase text-white">
                  RiotBus Report
                </p>
                <h2
                  className="display-font mt-4 max-w-3xl text-[clamp(34px,4.6vw,64px)] leading-[0.92]"
                  style={{
                    display: "-webkit-box",
                    maxHeight: "calc(3 * 0.92em)",
                    overflow: "hidden",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 3,
                  }}
                >
                  {displayTitle}
                </h2>
              </div>
              <div className="shrink-0 rounded-[22px] border-2 border-black bg-white/68 px-4 py-3 text-right font-black max-sm:hidden">
                <p className="text-[10px] uppercase">mode</p>
                <p className="display-font whitespace-nowrap text-xl">
                  {mode === "mean" ? "刻薄到底" : "清清白白"}
                </p>
              </div>
            </div>

            <div className="mt-5 min-h-0 flex-1 overflow-y-auto rounded-[24px] border border-black/15 bg-white/72 p-[clamp(18px,2vw,28px)] text-[clamp(15px,1.25vw,18px)] font-bold leading-relaxed">
              <MarkdownMessage content={displayContent} />
            </div>

            <div className="mt-4 grid shrink-0 grid-cols-[1fr_112px] gap-4 max-sm:grid-cols-[1fr_88px]">
              <div className="rounded-[22px] border border-black/15 bg-white/70 p-4 font-black">
                <p className="display-font text-[clamp(24px,2.4vw,34px)] leading-none">上车地址</p>
                <p className="mt-2 break-all text-[clamp(13px,1.15vw,16px)]">{shareUrl}</p>
                <p className="mt-2 text-xs text-black/55 max-sm:hidden">
                  二维码
                </p>
              </div>
              <div className="flex items-center justify-center rounded-[22px] border border-black/15 bg-white/78 p-3">
                <QrPlaceholder value={shareUrl} />
              </div>
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col rounded-[26px] border border-black/10 bg-white/32 p-5 max-md:min-h-[520px]">
          <button
            className="ml-auto flex size-12 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white/55"
            onClick={onClose}
            type="button"
          >
            <X strokeWidth={4} />
          </button>
          <div className="mt-6 rounded-[26px] border border-black/10 bg-white/42 p-5">
            <p className="display-font text-4xl leading-none">背景颜色</p>
            <p className="mt-2 text-sm font-bold text-black/62">
              选择底色
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {["#8CFF4F", "#FF7AC8", "#EAFF3D", "#505368"].map((color) => (
                <button
                  aria-label={`换成 ${color}`}
                  className={`h-20 rounded-[22px] border-2 transition ${
                    background === color
                      ? "border-black shadow-[0_8px_18px_rgba(0,0,0,0.16)]"
                      : "border-black/16"
                  }`}
                  key={color}
                  onClick={() => setBackground(color)}
                  style={{ background: color }}
                  type="button"
                />
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-[26px] border border-black/10 bg-white/42 p-5">
            <p className="display-font text-3xl leading-none">分析方式</p>
            <div className="mt-4 rounded-[18px] bg-white/65 p-3 text-sm font-black">
              <p>网站链接</p>
              <p className="mt-1 break-all text-xs text-black/62">{shareUrl}</p>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-[18px] bg-white/65 p-3 text-sm font-black">
              <QrPlaceholder value={shareUrl} size={56} />
              <p>二维码位置已预留，MVP 先用站点码样式占位。</p>
            </div>
          </div>

          <button
            className="display-font mt-auto flex w-full items-center justify-center rounded-[24px] border-2 border-black bg-[#2f7c2d] px-5 py-5 text-3xl text-black shadow-[0_12px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
            disabled={exporting}
            onClick={exportShareImage}
            type="button"
          >
            <Download className="mr-2" strokeWidth={3} />
            {exporting ? "生成中" : "生成PDF图"}
          </button>
          <p className="mt-3 text-center text-xs font-bold text-black/55">
            当前先保存 PNG 分享图；PDF 可在下一步接 jsPDF 或浏览器打印。
          </p>
        </section>
      </div>
    </div>,
    portalElement,
  );
}

function QrPlaceholder({
  value,
  size = 88,
}: {
  value: string;
  size?: number;
}) {
  const cells = Array.from({ length: 49 }, (_, index) => {
    const code = value.charCodeAt(index % Math.max(value.length, 1)) || 1;
    return (code + index * 7) % 5 < 2 || index % 8 === 0;
  });

  return (
    <div
      className="grid rounded-[12px] border-2 border-black bg-white p-1"
      style={{
        gap: 2,
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        height: size,
        width: size,
      }}
    >
      {cells.map((filled, index) => (
        <span
          className={filled ? "rounded-[2px] bg-black" : "rounded-[2px] bg-transparent"}
          key={index}
        />
      ))}
    </div>
  );
}

function cleanExportTitle(value: string | undefined, fallback: string) {
  const raw = (value || fallback)
    .replace(/^\s*标题[:：]\s*/u, "")
    .replace(/^\s*(正文|正文内容)[:：]\s*/u, "")
    .replace(/\s+/g, " ")
    .trim();
  const title = stripMarkdown(raw || fallback).trim() || fallback;

  return title.length > 32 ? `${title.slice(0, 31)}…` : title;
}

function cleanExportContent(value: string) {
  const cleaned = value
    .replace(/\\n/g, "\n")
    .replace(/^\s*(正文|正文内容)[:：]\s*/u, "")
    .replace(/\n\s*(正文|正文内容)[:：]\s*/gu, "\n")
    .replace(/(^|\n)\s*(总结|判词|数据|总结)[:：]\s*/gu, "$1")
    .trim();

  return cleaned.length > 260 ? `${cleaned.slice(0, 255)}…` : cleaned;
}

function downloadShareImage({
  artistA,
  artistB,
  background,
  content,
  mode,
  shareUrl,
  title,
}: {
  artistA: string;
  artistB: string;
  background: string;
  content: string;
  mode: BattleMode;
  shareUrl: string;
  title: string;
}) {
  const canvas = document.createElement("canvas");
  const width = 1200;
  const height = 1600;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) return;

  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  drawNoise(context, width, height);
  drawRoundedRect(context, 80, 80, width - 160, height - 160, 48, "rgba(255,255,245,0.82)", "#050505", 4);
  drawPill(context, 128, 128, 280, 64, "#050505", "RIOTBUS REPORT", "#ffffff", 24);

  context.fillStyle = "#050505";
  context.font = "900 86px Helvetica Neue, Arial, sans-serif";
  wrapCanvasText(context, title, 128, 270, 944, 92, 2);

  drawPill(
    context,
    128,
    450,
    mode === "mean" ? 210 : 230,
    58,
    mode === "mean" ? "#8CFF4F" : "#FF7AC8",
    mode === "mean" ? "刻薄到底" : "清清白白",
    "#050505",
    26,
  );

  context.fillStyle = "#050505";
  context.font = "800 30px Helvetica Neue, Arial, sans-serif";
  context.fillText(`${artistA} vs ${artistB}`, 128, 570);

  drawRoundedRect(context, 128, 620, 944, 650, 34, "rgba(255,255,255,0.72)", "rgba(0,0,0,0.14)", 2);
  context.fillStyle = "#111111";
  context.font = "700 30px Helvetica Neue, Arial, sans-serif";
  wrapCanvasText(context, stripMarkdown(content), 168, 690, 864, 46, 12);

  drawRoundedRect(context, 128, 1320, 694, 150, 30, "rgba(255,255,255,0.74)", "rgba(0,0,0,0.14)", 2);
  context.fillStyle = "#050505";
  context.font = "900 36px Helvetica Neue, Arial, sans-serif";
  context.fillText("上车地址", 168, 1380);
  context.font = "800 25px Helvetica Neue, Arial, sans-serif";
  wrapCanvasText(context, shareUrl, 168, 1430, 600, 34, 2);

  drawRoundedRect(context, 850, 1320, 222, 150, 30, "rgba(255,255,255,0.78)", "rgba(0,0,0,0.14)", 2);
  drawQrOnCanvas(context, shareUrl, 900, 1345, 100);
  context.font = "800 22px Helvetica Neue, Arial, sans-serif";
  context.fillStyle = "#050505";
  context.fillText("RiotBus", 908, 1468);

  const link = document.createElement("a");
  link.download = `riotbus-${slugify(`${artistA}-${artistB}`)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
  stroke?: string,
  lineWidth = 1,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fillStyle = fill;
  context.fill();
  if (stroke) {
    context.strokeStyle = stroke;
    context.lineWidth = lineWidth;
    context.stroke();
  }
}

function drawPill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  text: string,
  textColor: string,
  fontSize: number,
) {
  drawRoundedRect(context, x, y, width, height, height / 2, fill);
  context.fillStyle = textColor;
  context.font = `900 ${fontSize}px Helvetica Neue, Arial, sans-serif`;
  context.textBaseline = "middle";
  context.fillText(text, x + 26, y + height / 2 + 1);
  context.textBaseline = "alphabetic";
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number,
) {
  const chars = text.replace(/\s+/g, " ").split("");
  let line = "";
  let lines = 0;

  for (const char of chars) {
    const testLine = line + char;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(lines === maxLines - 1 ? `${line.slice(0, -1)}...` : line, x, y);
      y += lineHeight;
      lines += 1;
      line = char;
      if (lines >= maxLines) return;
    } else {
      line = testLine;
    }
  }

  if (line && lines < maxLines) {
    context.fillText(line, x, y);
  }
}

function drawQrOnCanvas(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
) {
  const cell = size / 7;
  context.fillStyle = "#ffffff";
  context.fillRect(x - 8, y - 8, size + 16, size + 16);
  context.fillStyle = "#050505";
  for (let index = 0; index < 49; index += 1) {
    const code = value.charCodeAt(index % Math.max(value.length, 1)) || 1;
    if ((code + index * 7) % 5 < 2 || index % 8 === 0) {
      context.fillRect(
        x + (index % 7) * cell + 2,
        y + Math.floor(index / 7) * cell + 2,
        cell - 4,
        cell - 4,
      );
    }
  }
}

function drawNoise(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
) {
  context.fillStyle = "rgba(0,0,0,0.018)";
  for (let index = 0; index < 1800; index += 1) {
    context.fillRect(Math.random() * width, Math.random() * height, 1, 1);
  }
}

function stripMarkdown(content: string) {
  return content
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/<shade>([\s\S]+?)<\/shade>/g, "$1")
    .replace(/~~([^~]+)~~/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\n+/g, " ");
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
