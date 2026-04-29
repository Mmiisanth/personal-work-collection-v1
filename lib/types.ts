export type BattleMode = "mean" | "neutral";

export type MetricKey = "sales" | "streaming" | "awards" | "reviews";

export type Artist = {
  id: string;
  name: string;
  shortName: string;
  avatarColor: string;
  stats: Record<MetricKey, string>;
  links: {
    spotify?: string;
    grammy?: string;
    aoty?: string;
    rym?: string;
    cm?: string;
  };
};

export type Banner = {
  id: string;
  title: string;
  dek: string;
  body: string;
  sourceLabel: string;
  sourceUrl: string;
  color: string;
};
