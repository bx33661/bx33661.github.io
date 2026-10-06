/** Native dialog focus trapping, scroll locking and route-swap cleanup. */
export function bindArticleDialog(
  dialog: HTMLDialogElement,
  signal: AbortSignal,
) {
  let opener: HTMLElement | null = null;
  let previousOverflow = "";
  let locked = false;
  const restore = (focus: boolean) => {
    if (!locked) return;
    locked = false;
    document.body.style.overflow = previousOverflow;
    if (focus && opener?.isConnected) opener.focus({ preventScroll: true });
    opener = null;
  };
  const close = () => {
    dialog.close();
    restore(true);
  };
  dialog.addEventListener("close", () => restore(true), { signal });
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
      if (dialog.open) dialog.close();
      restore(false);
    },
    { once: true },
  );
  return {
    open(source: HTMLElement) {
      if (dialog.open) return;
      opener = source;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      locked = true;
      document.body.style.overflow = "hidden";
    },
    close,
  };
}
