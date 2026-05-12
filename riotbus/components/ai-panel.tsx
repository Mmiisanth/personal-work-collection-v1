"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Send, X } from "lucide-react";
import { toPng } from "html-to-image";
import QRCode from "qrcode";
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
  const posterRef = useRef<HTMLDivElement | null>(null);
  const shareUrl = "https://riotbus.onrender.com";
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
      const node = posterRef.current;
      if (!node) return;
      await document.fonts?.ready;
      await waitForPosterAssets(node);
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: background,
      });
      await downloadDataUrl(dataUrl, `riotbus-${slugify(`${artistA}-${artistB}`)}.png`);
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
          <PosterCard
            background={background}
            displayContent={displayContent}
            displayTitle={displayTitle}
            mode={mode}
            posterRef={posterRef}
            shareUrl={shareUrl}
          />
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
            <p className="display-font text-3xl leading-none">分享方式</p>
            <div className="mt-4 rounded-[18px] bg-white/72 p-3 text-sm font-black">
              <p className="break-all text-base leading-snug">link: {shareUrl}</p>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <button
                className="display-font flex w-full items-center justify-center whitespace-nowrap rounded-[24px] border-2 border-black bg-[#2f7c2d] px-5 py-5 text-[clamp(22px,2vw,30px)] text-black shadow-[0_12px_24px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
                disabled={exporting}
                onClick={exportShareImage}
                type="button"
              >
                <Download className="mr-2" strokeWidth={3} />
                {exporting ? "生成中" : "生成宣传图"}
              </button>
            </div>
          </div>

          <p className="mt-3 text-center text-xs font-bold text-black/55">
            手机优先走系统分享保存图片，电脑会直接下载图片文件。
          </p>
        </section>
      </div>
    </div>,
    portalElement,
  );
}

function PosterCard({
  background,
  displayContent,
  displayTitle,
  mode,
  posterRef,
  shareUrl,
}: {
  background: string;
  displayContent: string;
  displayTitle: string;
  mode: BattleMode;
  posterRef: React.RefObject<HTMLDivElement | null>;
  shareUrl: string;
}) {
  return (
    <div
      ref={posterRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-[26px] border-2 border-black p-[clamp(14px,1.8vw,24px)] shadow-[0_24px_60px_rgba(0,0,0,0.18)] max-md:h-auto max-md:min-h-[680px] max-sm:min-h-[620px]"
      style={{ background }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="display-font inline-flex rounded-full bg-black px-4 py-2 text-[clamp(12px,1.1vw,15px)] uppercase text-white">
            RiotBus Report
          </p>
          <h2
            className="display-font mt-3 max-w-3xl text-[clamp(30px,4.1vw,56px)] leading-[0.9]"
            style={{
              display: "-webkit-box",
              maxHeight: "calc(3 * 0.9em)",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 3,
            }}
          >
            {displayTitle}
          </h2>
        </div>
        <div className="shrink-0 rounded-[22px] border-2 border-black bg-white/68 px-4 py-3 font-black text-center max-sm:hidden">
          <p className="text-[10px] uppercase">mode</p>
          <p className="display-font whitespace-nowrap text-xl leading-none">
            {mode === "mean" ? "刻薄到底" : "清清白白"}
          </p>
        </div>
      </div>

      <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-black/15 bg-white/72 p-[clamp(16px,1.8vw,24px)] text-[clamp(15px,1.25vw,19px)] font-bold leading-[1.42]">
        <div className="min-h-0 flex-1 overflow-hidden">
          <MarkdownMessage content={displayContent} />
        </div>
        <div className="mt-4 shrink-0 border-t border-black/10 pt-4">
          <div className="grid grid-cols-[minmax(0,1fr)_184px] items-stretch gap-4 max-sm:grid-cols-1">
            <div className="flex h-full min-h-[184px] min-w-0 rounded-[22px] border-2 border-black bg-white p-3 max-sm:min-h-0">
              <div className="flex h-full w-full flex-col rounded-[18px] border border-black/10 bg-white px-5 py-4 font-black text-black">
                <p className="display-font text-[clamp(20px,2vw,28px)] leading-none">
                  上车地址
                </p>
                <p className="mt-2 break-all text-[clamp(14px,1.15vw,16px)] leading-snug">
                  link: {shareUrl}
                </p>
                <div className="mt-4 flex-1 rounded-[18px] border border-black/10 bg-[radial-gradient(circle_at_18%_14%,rgba(0,0,0,0.16)_1px,transparent_1.7px),radial-gradient(circle_at_72%_26%,rgba(0,0,0,0.12)_1px,transparent_1.7px)] bg-[length:14px_14px] bg-white/95 p-4">
                  <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-[clamp(16px,1.25vw,20px)] leading-none text-black/90 max-sm:grid-cols-1">
                    {[
                      "明星黑话 battle",
                      "数据查询",
                      "新闻速递",
                      "一键生成海报",
                    ].map((item) => (
                      <p className="flex items-center gap-2" key={item}>
                        <span className="inline-flex size-2 shrink-0 rounded-full bg-black" />
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex h-full justify-end max-sm:h-auto max-sm:justify-start">
              <div className="flex h-full min-h-[184px] items-center justify-center rounded-[22px] border-2 border-black bg-white p-3 max-sm:min-h-0">
                <QrCodeSvg value={shareUrl} size={156} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QrCodeSvg({
  value,
  size = 88,
}: {
  value: string;
  size?: number;
}) {
  const [dataUrl, setDataUrl] = useState<string>("");

  useEffect(() => {
    let ignore = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: "M",
      margin: 1,
      color: {
        dark: "#050505",
        light: "#FFFFFF",
      },
      width: size * 4,
    })
      .then((url) => {
        if (!ignore) setDataUrl(url);
      })
      .catch(() => {
        if (!ignore) setDataUrl("");
      });

    return () => {
      ignore = true;
    };
  }, [size, value]);

  return (
    <div
      className="overflow-hidden rounded-[12px] border-2 border-black bg-white p-1 box-border"
      style={{
        height: size,
        width: size,
      }}
    >
      {dataUrl ? (
        <img alt="分享二维码" className="h-full w-full" src={dataUrl} />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[10px] font-black">
          QR
        </div>
      )}
    </div>
  );
}

function cleanExportTitle(value: string | undefined, fallback: string) {
  const trimmed = (value || "").trim();
  return trimmed || fallback;
}

function cleanExportContent(value: string | undefined) {
  const trimmed = (value || "").trim();
  return trimmed || "AI 没写出正文，稍后再试。";
}

async function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

async function waitForPosterAssets(node: HTMLElement) {
  const images = Array.from(node.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          image.addEventListener("load", () => resolve(), { once: true });
          image.addEventListener("error", () => resolve(), { once: true });
        }),
    ),
  );
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
