"use client";

import { type DependencyList, type RefObject, useLayoutEffect } from "react";
import gsap from "gsap";

type RevealOptions = {
  selector?: string;
  y?: number;
  scale?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  dependencies?: DependencyList;
};

export function useGsapReveal(
  rootRef: RefObject<HTMLElement | HTMLDivElement | null>,
  {
    selector = "[data-riot-reveal]",
    y = 18,
    scale = 0.985,
    stagger = 0.16,
    duration = 1.18,
    delay = 0,
    dependencies = [],
  }: RevealOptions = {},
) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const childTargets = gsap.utils.toArray<HTMLElement>(selector, root);
    const targets = root.matches(selector)
      ? [root, ...childTargets.filter((target) => target !== root)]
      : childTargets;
    if (!targets.length) return;

    const mm = gsap.matchMedia();

    mm.add(
      {
        all: "all",
        reduceMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => {
        const { reduceMotion } = context.conditions ?? {};
        const glassTargets = targets.filter(isGlassLikeElement);
        const solidTargets = targets.filter((target) => !isGlassLikeElement(target));
        const fromVars = {
          y: reduceMotion ? 0 : y,
          scale: reduceMotion ? 1 : scale,
          transformOrigin: "50% 54%",
          willChange: reduceMotion ? "auto" : "transform,opacity",
        };

        gsap.set(targets, fromVars);
        gsap.set(solidTargets, { autoAlpha: 0 });
        gsap.set(glassTargets, {
          opacity: reduceMotion ? 1 : 0.78,
          visibility: "inherit",
        });

        const timeline = gsap.timeline({
          defaults: {
            duration: reduceMotion ? 0 : duration,
            ease: "power3.out",
            overwrite: "auto",
          },
          delay: reduceMotion ? 0 : delay,
        });

        timeline
          .to(
            targets,
            {
              y: 0,
              scale: 1,
              stagger: reduceMotion ? 0 : stagger,
              clearProps: "transform,willChange",
            },
            0,
          )
          .to(
            solidTargets,
            {
              autoAlpha: 1,
              stagger: reduceMotion ? 0 : stagger,
              clearProps: "visibility,opacity",
            },
            0,
          )
          .to(
            glassTargets,
            {
              opacity: 1,
              stagger: reduceMotion ? 0 : stagger,
              clearProps: "opacity,visibility",
            },
            0,
          );

        return () => timeline.kill();
      },
    );

    return () => mm.revert();
  }, [delay, duration, rootRef, scale, selector, stagger, y, ...dependencies]);
}

function isGlassLikeElement(element: HTMLElement) {
  const className =
    typeof element.className === "string" ? element.className : String(element.className);
  const hasGlassDescendant = Array.from(element.querySelectorAll<HTMLElement>("*")).some(
    (child) => {
      const childClassName =
        typeof child.className === "string" ? child.className : String(child.className);
      return isGlassClassName(childClassName);
    },
  );

  return isGlassClassName(className) || hasGlassDescendant;
}

function isGlassClassName(className: string) {
  return [
    "glass",
    "backdrop-blur",
    "bg-white/",
    "bg-[#F1FFE5]",
    "bg-[#FFF0FA]",
    "bg-[#FFE1F3]",
  ].some((token) => className.includes(token));
}
