import { useEffect, useRef, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * Poll an async function on an interval.
 * - Executes immediately once
 * - Keeps last data and error state
 */
export function usePolling(fetcher, deps = [], intervalMs) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setIsLoading(true);
        const result = await fetcher();
        if (!cancelled) {
          setData(result);
          setError("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || "Failed to load.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    run();

    const ms = intervalMs ?? Number(process.env.REACT_APP_POLL_INTERVAL_MS || 5000);
    timerRef.current = setInterval(run, ms);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, isLoading };
}
