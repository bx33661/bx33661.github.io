/** One delegated pointer listener + one coalesced frame for the whole directory. */
export function mountFriendInteractions() {
  const root = document.querySelector<HTMLElement>(".friends-main");
  if (!root) return () => {};
  const lifetime = new AbortController();
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const fine = matchMedia("(hover: hover) and (pointer: fine)");
  let card: HTMLElement | null = null;
  let frame = 0;
  let x = 0;
  let y = 0;
  const reset = () => {
    cancelAnimationFrame(frame); frame = 0;
    card?.style.removeProperty("--pointer-x");
    card?.style.removeProperty("--pointer-y");
    card = null;
  };
  const move = (event: PointerEvent) => {
    if (motion.matches || !fine.matches || event.pointerType === "touch") return;
    const target = event.target instanceof Element ? event.target.closest<HTMLElement>("a.fc") : null;
    if (!target || !root.contains(target)) { reset(); return; }
    if (card !== target) { reset(); card = target; }
    const rect = card.getBoundingClientRect();
    x = event.clientX - rect.left; y = event.clientY - rect.top;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      card?.style.setProperty("--pointer-x", `${x}px`);
      card?.style.setProperty("--pointer-y", `${y}px`);
    });
  };
  const options = { signal: lifetime.signal };
  root.addEventListener("pointermove", move, options);
  root.addEventListener("pointerleave", reset, options);
  motion.addEventListener("change", reset, options);
  fine.addEventListener("change", reset, options);
  return () => { lifetime.abort(); reset(); };
}
