/** Spec-compliant word stack reveal animation engine */

export const WORD_STACK_TRANSITION =
  "opacity 0.35s ease, transform 0.42s cubic-bezier(0.22,1,0.36,1)";

export function wordStackOpacity(distanceFromActive: number): number {
  if (distanceFromActive === 0) return 1.0;
  if (distanceFromActive === 1) return 0.55;
  if (distanceFromActive === 2) return 0.28;
  return 0.12;
}

export type WordStackRevealOptions = {
  stage: HTMLElement;
  words: string[];
  wordIntervalMs: number;
  sceneDurationMs: number;
  onWordEnter?: (index: number) => void;
};

export function runWordStackReveal(opts: WordStackRevealOptions): () => void {
  const { stage, words, wordIntervalMs, sceneDurationMs, onWordEnter } = opts;
  const spans: HTMLSpanElement[] = [];
  let wordIndex = 0;
  let cleared = false;

  const clearAll = () => {
    if (cleared) return;
    cleared = true;
    spans.forEach((s) => s.remove());
    spans.length = 0;
  };

  const updateStackOpacity = () => {
    const activeIdx = spans.length - 1;
    spans.forEach((span, i) => {
      const dist = activeIdx - i;
      span.style.opacity = String(wordStackOpacity(dist));
    });
  };

  const showNext = () => {
    if (cleared) return;
    const word = words[wordIndex % words.length];

    updateStackOpacity();

    const span = document.createElement("span");
    span.className = "word-stack-item";
    span.textContent = word;
    span.style.cssText = [
      "display:block",
      "font-weight:900",
      "font-size:clamp(48px,8vw,120px)",
      "line-height:1.1",
      "letter-spacing:-0.04em",
      "color:var(--text)",
      `transition:${WORD_STACK_TRANSITION}`,
      "opacity:0",
      "transform:translateY(22px)",
      "margin:6px 0",
    ].join(";");
    stage.appendChild(span);
    spans.push(span);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        span.style.opacity = "1";
        span.style.transform = "translateY(0)";
        updateStackOpacity();
      });
    });

    onWordEnter?.(wordIndex);
    wordIndex++;

    if (wordIndex >= words.length) {
      clearInterval(interval);
      setTimeout(clearAll, wordIntervalMs + 400);
    }
  };

  showNext();
  const interval = setInterval(showNext, wordIntervalMs);
  const stopTimer = setTimeout(() => {
    clearInterval(interval);
    clearAll();
  }, sceneDurationMs - 50);

  return () => {
    clearInterval(interval);
    clearTimeout(stopTimer);
    clearAll();
  };
}
