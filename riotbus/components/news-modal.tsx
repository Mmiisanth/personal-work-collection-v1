"use client";

import { X } from "lucide-react";
import { motion } from "framer-motion";
import type { Banner } from "@/lib/types";

export function NewsModal({
  banner,
  onClose,
}: {
  banner: Banner | null;
  onClose: () => void;
}) {
  if (!banner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/18 p-5 backdrop-blur-sm">
      <motion.div
        className="glass-strong grid w-full max-w-5xl grid-cols-[0.8fr_1.2fr] gap-8 rounded-[34px] p-8 max-md:grid-cols-1 max-md:max-h-[min(92dvh,860px)] max-md:overflow-y-auto max-md:p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div>
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[28px] border border-black/20 bg-white/30 max-md:aspect-[16/10]">
            <img
              alt={`${banner.title} detail image`}
              className="h-full w-full object-cover"
              src={banner.imageSrc}
            />
          </div>
          <a
            className="mt-5 block text-lg font-bold underline"
            href={banner.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {banner.sourceLabel}
          </a>
        </div>
        <div className="relative pr-10 max-md:pr-0">
          <button
            aria-label="Close news modal"
            className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-full bg-black/10 transition-transform hover:scale-105 max-md:right-0"
            onClick={onClose}
            type="button"
          >
            <X strokeWidth={4} />
          </button>
          <p className="display-font mt-8 text-5xl leading-none max-md:mt-4 max-md:text-[clamp(30px,8vw,42px)]">
            {banner.title}
          </p>
          <p className="mt-7 max-w-2xl text-2xl font-bold leading-snug max-md:mt-4 max-md:text-[clamp(16px,4.5vw,22px)]">
            {banner.body}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
