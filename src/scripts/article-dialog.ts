import { animateReading, prefersReducedMotion } from "./reading-motion";
import { READING_MOTION } from "../utils/reading-motion";

type DialogMotion = {
  enter: (source: HTMLElement) => void;
  exit: (source: HTMLElement | null) => Animation | null;
  cleanup: () => void;
};

// A lease belongs to the original body, including overlapping native dialogs.
const scrollLocks = new WeakMap<
  HTMLElement,
  { count: number; overflow: string }
>();
function lockScroll() {
  const body = document.body;
  const lock = scrollLocks.get(body) ?? {
    count: 0,
    overflow: body.style.overflow,
  };
  scrollLocks.set(body, lock);
  ++lock.count;
  body.style.overflow = "hidden";
  return () => {
    if (--lock.count === 0) {
      body.style.overflow = lock.overflow;
      scrollLocks.delete(body);
    }
  };
}

/** Native semantics stay in place until the exit animation really finishes. */
export function bindArticleDialog(
  dialog: HTMLDialogElement,
  signal: AbortSignal,
  motion?: DialogMotion,
) {
  let opener: HTMLElement | null = null;
  let releaseScroll: (() => void) | null = null;
  let animation: Animation | null = null;
  let closing = false;
  let generation = 0;
  const clearMotion = () => {
    animation?.cancel();
    animation = null;
    motion?.cleanup();
    closing = false;
    delete dialog.dataset.dialogPhase;
  };
  const restore = (focus: boolean) => {
    if (!releaseScroll) return;
    releaseScroll();
    releaseScroll = null;
    if (focus && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  };
  const close = () => {
    if (!dialog.open || closing) return;
    closing = true;
    const token = ++generation;
    animation?.cancel();
    dialog.dataset.dialogPhase = "closing";
    animation = prefersReducedMotion()
      ? null
      : motion
        ? motion.exit(opener)
        : animateReading(
            dialog,
            [
              { opacity: 1, transform: "none" },
              { opacity: 0, transform: "translateY(10px) scale(0.99)" },
            ],
            READING_MOTION.dialogOut,
            READING_MOTION.exitEase,
          );
    const finish = () => {
      if (token !== generation || signal.aborted) return;
      dialog.close();
      clearMotion();
      restore(true);
    };
    if (animation) void animation.finished.then(finish, finish);
    else finish();
  };
  dialog.addEventListener(
    "close",
    () => {
      // Native close events are queued; an old one must not close a reopened dialog.
      if (dialog.open) return;
      ++generation;
      clearMotion();
      restore(true);
    },
    { signal },
  );
  dialog.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Tab") return;
      // Native modality makes the background inert; wrap Tab as well so the
      // browser's chrome does not interrupt the dialog's keyboard cycle.
      const focusable = [
        ...dialog.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, textarea, [tabindex]",
        ),
      ].filter(
        (element) =>
          element.tabIndex >= 0 &&
          !element.matches(":disabled") &&
          element.getClientRects().length > 0,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    },
    { signal },
  );
  dialog.addEventListener(
    "cancel",
    (event) => {
      event.preventDefault();
      close();
    },
    { signal },
  );
  dialog.addEventListener(
    "click",
    (event) => {
      if (event.target === dialog) close();
    },
    { signal },
  );
  signal.addEventListener(
    "abort",
    () => {
      ++generation;
      clearMotion();
      if (dialog.open) dialog.close();
      restore(false);
    },
    { once: true },
  );
  return {
    open(source: HTMLElement) {
      if (dialog.open || !dialog.isConnected || signal.aborted) return;
      ++generation;
      clearMotion();
      restore(false);
      opener = source;
      dialog.showModal();
      releaseScroll = lockScroll();
      dialog.dataset.dialogPhase = "open";
      if (motion) motion.enter(source);
      else
        animation = animateReading(
          dialog,
          [
            { opacity: 0, transform: "translateY(16px) scale(0.985)" },
            { opacity: 1, transform: "none" },
          ],
          READING_MOTION.dialogIn,
        );
    },
    close,
  };
}
