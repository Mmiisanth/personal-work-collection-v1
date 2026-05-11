"use client";

import { useState } from "react";
import type { Artist, BattleMode } from "@/lib/types";

type ArtistAvatarProps = {
  artist: Artist;
  className?: string;
  mode: BattleMode;
  selected?: boolean;
};

export function ArtistAvatar({
  artist,
  className = "size-16",
  mode,
  selected = false,
}: ArtistAvatarProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = artist.avatars[mode];
  const showImage = failedSrc !== src;

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2 transition-transform ${className} ${
        selected ? "border-black/70" : "border-black/25"
      }`}
      style={{ background: artist.avatarColor }}
    >
      {showImage ? (
        <img
          alt={`${artist.name} ${mode} avatar`}
          className="h-full w-full object-cover"
          decoding="async"
          loading="lazy"
          onError={() => setFailedSrc(src)}
          src={src}
        />
      ) : (
        <span className="display-font text-[0.72em] leading-none text-black/72">
          {artist.shortName.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
