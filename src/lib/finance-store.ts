import { useCallback, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { EMPTY_PROFILE, type FinanceProfile } from "./finance-types";
import { loadProfile, syncProfile, resetProfileFn } from "./finance.functions";

const PROFILE_KEY = ["profile"] as const;

export function useProfile(): [
  FinanceProfile,
  (updater: (p: FinanceProfile) => FinanceProfile) => void,
  () => void,
  { isLoading: boolean },
] {
  const qc = useQueryClient();
  const load = useServerFn(loadProfile);
  const sync = useServerFn(syncProfile);
  const doReset = useServerFn(resetProfileFn);

  const { data, isLoading } = useQuery({
    queryKey: PROFILE_KEY,
    queryFn: () => load(),
    staleTime: 30_000,
  });

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const update = useCallback(
    (updater: (p: FinanceProfile) => FinanceProfile) => {
      qc.setQueryData<FinanceProfile>(PROFILE_KEY, (prev) => updater(prev ?? EMPTY_PROFILE));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        const current = qc.getQueryData<FinanceProfile>(PROFILE_KEY) ?? EMPTY_PROFILE;
        sync({ data: current }).catch((e) => console.error("sync failed", e));
      }, 700);
    },
    [qc, sync],
  );

  const reset = useCallback(() => {
    qc.setQueryData(PROFILE_KEY, EMPTY_PROFILE);
    doReset().catch((e) => console.error("reset failed", e));
  }, [qc, doReset]);

  return [data ?? EMPTY_PROFILE, update, reset, { isLoading }];
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
