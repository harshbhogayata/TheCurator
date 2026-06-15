/** Wrap a DOM/state update in the native View Transitions API when supported. */
export function withViewTransition(update: () => void | Promise<void>) {
  if (typeof document === "undefined") {
    void update();
    return;
  }

  if (document.startViewTransition) {
    document.startViewTransition(() => update());
    return;
  }

  void update();
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
