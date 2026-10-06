import type { TransitionBeforePreparationEvent } from "astro:transitions/client";
import {
  articleTransitionName,
  readingEntryDelay,
  READING_MOTION,
} from "../utils/reading-motion";
import { animateReading, prefersReducedMotion } from "./reading-motion";

let firstLoad = true;
let entrances: Animation[] = [];
let releaseTitle: (() => void) | null = null;

function finishEntrances() {
  for (const animation of entrances) {
    if (animation.playState !== "finished" && animation.playState !== "idle")
      animation.finish();
  }
  entrances = [];
}

document.addEventListener("astro:page-load", () => {
  // Router navigation already animates the reading surface: never double-enter.
  if (!firstLoad) return;
  firstLoad = false;
  let index = 0;
  for (const row of document.querySelectorAll<HTMLElement>(
    ".entry-row--blog",
  )) {
    const box = row.getBoundingClientRect();
    if (box.top >= innerHeight || box.bottom <= 0) continue;
    const animation = animateReading(
      row,
      [
        { opacity: 0.65, transform: "translateY(8px)" },
        { opacity: 1, transform: "none" },
      ],
      READING_MOTION.listIn,
    );
    if (animation) {
      animation.effect?.updateTiming({
        delay: readingEntryDelay(index++),
        fill: "backwards",
      });
      entrances.push(animation);
    }
  }
});

document.addEventListener("astro:before-preparation", (event) => {
  const navigation = event as TransitionBeforePreparationEvent;
  finishEntrances();
  releaseTitle?.();
  const link = navigation.sourceElement?.closest<HTMLAnchorElement>(
    "a[data-reading-link]",
  );
  const title = link?.matches("[data-reading-title]")
    ? link
    : link?.querySelector<HTMLElement>("[data-reading-title]");
  if (
    !title ||
    prefersReducedMotion() ||
    navigation.from.origin !== navigation.to.origin
  )
    return;

  // Only the activated title gets an identity. Related/series/previous links can
  // point to the same article; naming them all would invalidate the transition.
  const loader = navigation.loader;
  navigation.loader = async () => {
    await loader();
    if (navigation.signal.aborted || navigation.defaultPrevented) return;
    if (!navigation.newDocument.querySelector("h1[data-article-title]")) return;
    const previous = title.style.viewTransitionName;
    title.style.viewTransitionName = articleTransitionName(navigation.to.href);
    const release = () => {
      title.style.viewTransitionName = previous;
      navigation.signal.removeEventListener("abort", release);
      if (releaseTitle === release) releaseTitle = null;
    };
    releaseTitle = release;
    navigation.signal.addEventListener("abort", release, { once: true });
  };
});

document.addEventListener("astro:after-swap", () => releaseTitle?.());
