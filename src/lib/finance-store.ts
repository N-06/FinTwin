import { useCallback, useEffect, useState } from "react";
import { DEFAULT_PROFILE, type FinanceProfile } from "./finance-types";

const KEY = "fintwin.profile.v1";

function read(): FinanceProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

let listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function useProfile(): [FinanceProfile, (updater: (p: FinanceProfile) => FinanceProfile) => void, () => void] {
  const [profile, setProfile] = useState<FinanceProfile>(DEFAULT_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(read());
    setHydrated(true);
    const l = () => setProfile(read());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const update = useCallback((updater: (p: FinanceProfile) => FinanceProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(next));
      queueMicrotask(emit);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    if (typeof window !== "undefined") localStorage.removeItem(KEY);
    setProfile(DEFAULT_PROFILE);
    queueMicrotask(emit);
  }, []);

  // return hydrated-aware profile
  return [hydrated ? profile : DEFAULT_PROFILE, update, reset];
}

export function formatCurrency(n: number, currency: "INR" | "USD" | "EUR" = "INR"): string {
  const locale = currency === "INR" ? "en-IN" : currency === "EUR" ? "de-DE" : "en-US";
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${currency} ${Math.round(n).toLocaleString()}`;
  }
}
