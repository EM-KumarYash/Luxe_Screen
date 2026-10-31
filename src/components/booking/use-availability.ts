"use client";

import { useCallback, useEffect, useState } from "react";

import { apiFetch, errorMessage } from "@/lib/api-client";
import type { AvailabilityDTO } from "@/types";

type Result = { key: string; data: AvailabilityDTO | null; error: string | null };

/** Fetches live slot availability for a location and date (never cached). */
export function useAvailability(location: string, date: string, enabled: boolean) {
  const key = `${location}|${date}`;
  const [result, setResult] = useState<Result>({ key: "", data: null, error: null });
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!enabled || !location || !date) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ location, date });
    apiFetch<AvailabilityDTO>(`/api/slots?${params}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: errorMessage(error) });
      });
    return () => controller.abort();
  }, [key, location, date, enabled, version]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const current = result.key === key;

  return {
    data: current ? result.data : null,
    error: current ? result.error : null,
    loading: enabled && !current,
    refresh,
  };
}
