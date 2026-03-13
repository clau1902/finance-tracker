import { useEffect } from "react";

/**
 * Calls `fn` on a repeating interval while the tab is visible.
 * Pauses when the tab is hidden to avoid unnecessary requests.
 */
export function useAutoRefresh(fn: () => void, intervalMs: number) {
  useEffect(() => {
    const tick = () => {
      if (!document.hidden) fn();
    };

    const id = setInterval(tick, intervalMs);
    return () => clearInterval(id);
  }, [fn, intervalMs]);
}
