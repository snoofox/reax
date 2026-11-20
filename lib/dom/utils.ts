import type { Cleanup } from "../reactivity/scope";

export function runCleanups(cleanups: Cleanup[]): void {
  for (const fn of cleanups) {
    try {
      fn();
    } catch (err) {
      console.error("[reax] cleanup error:", err);
    }
  }
}

export function clearBetween(start: Node, end: Node): void {
  if (!start.parentNode) return;
  while (start.nextSibling && start.nextSibling !== end) {
    start.parentNode.removeChild(start.nextSibling);
  }
}
