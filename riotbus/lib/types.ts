export type BattleMode = "mean" | "neutral";

export type MetricKey = "sales" | "streaming" | "awards" | "reviews";

export type Artist = {
  id: string;
  name: string;
  shortName: string;
  displayNames: Record<BattleMode, string>;
  avatarColor: string;
  avatars: {
    mean: string;
    neutral: string;
  };
  stats: Record<MetricKey, string>;
  links: {
    grammy?: string;
    aoty?: string;
    rym?: string;
    RC?: string;
    cmSales?: string;
    cmSpotifyFollowers?: string;
  };
};

export type Banner = {
  id: string;
  title: string;
  dek: string;
  body: string;
  imageSrc: string;
  sourceLabel: string;
  sourceUrl: string;
  color: string;
};

export type AiProvider = {
  baseUrl: string;
  apiKey: string;
  model: string;
};
