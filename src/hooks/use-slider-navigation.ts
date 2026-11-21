import { useState, useCallback, useEffect } from "react";

interface UseSliderNavigationProps {
  totalSlides: number;
  enableKeyboard?: boolean;
}

interface UseSliderNavigationReturn {
  currentIndex: number;
  goToNext: () => void;
  goToPrev: () => void;
  goToSlide: (index: number) => void;
  goToFirst: () => void;
  goToLast: () => void;
}

export function useSliderNavigation({
  totalSlides,
  enableKeyboard = true,
}: UseSliderNavigationProps): UseSliderNavigationReturn {
  const [currentIndex, setCurrentIndex] = useState(0);

  const maxIndex = Math.max(0, totalSlides - 1);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, maxIndex));
  }, [maxIndex]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToSlide = useCallback(
    (index: number) => {
      setCurrentIndex(Math.max(0, Math.min(index, maxIndex)));
    },
    [maxIndex],
  );

  const goToFirst = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const goToLast = useCallback(() => {
    setCurrentIndex(maxIndex);
  }, [maxIndex]);

  useEffect(() => {
    if (!enableKeyboard) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector("dialog[open]")) return;
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        (target.isContentEditable ||
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT")
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowRight":
        case "d":
        case "D":
          goToNext();
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          goToPrev();
          break;
        case "Home":
          goToFirst();
          break;
        case "End":
          goToLast();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboard, goToNext, goToPrev, goToFirst, goToLast]);

  return {
    currentIndex,
    goToNext,
    goToPrev,
    goToSlide,
    goToFirst,
    goToLast,
  };
}
