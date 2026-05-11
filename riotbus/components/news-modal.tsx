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
        className="glass-strong grid w-full max-w-5xl grid-cols-[0.8fr_1.2fr] gap-8 rounded-[34px] p-8 max-md:grid-cols-1"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22 }}
      >
        <div>
          <div className="flex aspect-[4/5] items-center justify-center overflow-hidden rounded-[28px] border border-black/20 bg-white/30">
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
        <div className="relative pr-10">
          <button
            aria-label="Close news modal"
            className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-full bg-black/10 transition-transform hover:scale-105"
            onClick={onClose}
            type="button"
          >
            <X strokeWidth={4} />
          </button>
          <p className="display-font mt-8 text-5xl leading-none max-md:text-4xl">
            {banner.title}
          </p>
          <p className="mt-7 max-w-2xl text-2xl font-bold leading-snug">
            {banner.body}
          </p>
        </div>
      </motion.div>
    </div>
  );
}
