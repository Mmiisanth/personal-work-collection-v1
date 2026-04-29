import { artists } from "@/data/artists";
import type { MetricKey } from "@/lib/types";

const metricLabels: Record<MetricKey, string> = {
  sales: "销量",
  streaming: "流媒体",
  awards: "奖项",
  reviews: "乐评",
};

export function DataTable({
  artistAId,
  artistBId,
  metrics,
}: {
  artistAId: string;
  artistBId: string;
  metrics: MetricKey[];
}) {
  const artistA = artists.find((artist) => artist.id === artistAId) ?? artists[0];
  const artistB = artists.find((artist) => artist.id === artistBId) ?? artists[1];

  return (
    <div className="glass rounded-[28px] p-6">
      <div className="mb-6 grid grid-cols-[0.8fr_1fr_1fr] items-end gap-4">
        <div />
        {[artistA, artistB].map((artist) => (
          <div className="text-center" key={artist.id}>
            <div
              className="mx-auto mb-3 size-20 rounded-full border-2 border-black/30"
              style={{ background: artist.avatarColor }}
            />
            <p className="display-font text-2xl">{artist.shortName}</p>
          </div>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-black/30">
        {metrics.map((metric) => (
          <div
            className="grid grid-cols-[0.8fr_1fr_1fr] border-b border-black/25 last:border-b-0"
            key={metric}
          >
            <div className="display-font bg-white/30 p-4 text-2xl">
              {metricLabels[metric]}
            </div>
            <div className="p-4 text-center text-xl font-black">
              {artistA.stats[metric] || "缺失"}
            </div>
            <div className="p-4 text-center text-xl font-black">
              {artistB.stats[metric] || "缺失"}
            </div>
          </div>
        ))}
        <div className="grid grid-cols-[0.8fr_2fr]">
          <div className="display-font bg-white/30 p-4 text-2xl">链接</div>
          <div className="grid gap-2 p-4 text-sm font-bold">
            <SourceLinks artistName={artistA.shortName} links={artistA.links} />
            <SourceLinks artistName={artistB.shortName} links={artistB.links} />
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
