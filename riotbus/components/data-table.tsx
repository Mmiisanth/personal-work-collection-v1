import { artists } from "@/data/artists";
import { ArtistAvatar } from "@/components/artist-avatar";
import { getArtistDisplayName } from "@/lib/artist-display";
import type { BattleMode, MetricKey } from "@/lib/types";

const metricLabels: Record<MetricKey, string> = {
  sales: "销量",
  streaming: "流媒",
  awards: "奖项",
  reviews: "乐评",
};

export function DataTable({
  artistAId,
  artistBId,
  metrics,
  mode,
}: {
  artistAId: string;
  artistBId: string;
  metrics: MetricKey[];
  mode: BattleMode;
}) {
  const artistA = artists.find((artist) => artist.id === artistAId) ?? artists[0];
  const artistB = artists.find((artist) => artist.id === artistBId) ?? artists[1];
  const artistADisplayName = getArtistDisplayName(artistA, mode);
  const artistBDisplayName = getArtistDisplayName(artistB, mode);
  const isMean = mode === "mean";
  const cardBg = isMean ? "bg-[#F1FFE5]/78" : "bg-[#FFF0FA]/82";
  const cellBg = isMean ? "bg-white/32" : "bg-[#FFF6FC]/62";

  return (
    <div className={`rounded-[28px] border border-white/75 p-6 shadow-[0_22px_54px_rgba(0,0,0,0.12)] backdrop-blur-[12px] ${cardBg}`}>
      <div className="mb-6 grid grid-cols-[0.8fr_1fr_1fr] items-end gap-4">
        <div />
        {[artistA, artistB].map((artist) => (
          <div className="text-center" key={artist.id}>
            <ArtistAvatar artist={artist} className="mx-auto mb-3 size-20" mode={mode} />
            <p className="display-font text-2xl">{getArtistDisplayName(artist, mode)}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/30">
        {metrics.map((metric) => (
          <div
            className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-black/25 last:border-b-0"
            key={metric}
          >
            <div className={`display-font break-keep p-4 text-[clamp(22px,2.1vw,30px)] leading-tight ${cellBg}`}>
              {metricLabels[metric]}
            </div>
            <div className={`flex items-center justify-center p-4 text-center text-[clamp(16px,1.45vw,22px)] font-black leading-tight ${cellBg}`}>
              {artistA.stats[metric] || "缺失"}
            </div>
            <div className={`flex items-center justify-center p-4 text-center text-[clamp(16px,1.45vw,22px)] font-black leading-tight ${cellBg}`}>
              {artistB.stats[metric] || "缺失"}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[0.8fr_2fr]">
          <div className={`display-font p-4 text-2xl ${cellBg}`}>链接</div>
          <div className={`grid gap-2 p-4 text-sm font-bold ${cellBg}`}>
            <SourceLinks artistName={artistADisplayName} links={artistA.links} />
            <SourceLinks artistName={artistBDisplayName} links={artistB.links} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SourceLinks({
  artistName,
  links,
}: {
  artistName: string;
  links: Record<string, string | undefined>;
}) {
  return (
    <div>
      <span className="mr-2 text-black/55">{artistName}</span>
      {Object.entries(links).map(([source, href]) =>
        href?.startsWith("http") ? (
          <a
            className="mr-3 underline"
            href={href}
            key={source}
            rel="noreferrer"
            target="_blank"
          >
            {source}
          </a>
        ) : (
          <span className="mr-3" key={source}>
            {source}: {href}
          </span>
        ),
      )}
    </div>
  );
}
