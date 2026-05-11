import type { Artist, BattleMode } from "@/lib/types";

export function getArtistDisplayName(artist: Artist, mode: BattleMode) {
  return artist.displayNames[mode] || artist.shortName;
}
