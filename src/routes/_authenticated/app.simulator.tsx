import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import { applyScenario, computeMetrics, projectFuture } from "@/lib/finance-calc";
import { predictScore } from "@/lib/ml-scorer";
import type { Scenario } from "@/lib/finance-types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Wand2, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — FinTwin" },
      { name: "description", content: "Design any life scenario and see how it changes your financial future." },
      { property: "og:title", content: "What-If Simulator — FinTwin" },
      { property: "og:description", content: "Design any life scenario and see how it changes your financial future." },
    ],
  }),
  component: Simulator,
});

const BLANK: Scenario = {
  id: "custom",
  label: "",
  incomeDelta: 0,
  incomeMultiplier: 1,
  extraSavings: 0,
  expenseDelta: 0,
  expenseMultiplier: 1,
  newLoanEmi: 0,
  newLoanBalance: 0,
  inflationDelta: 0,
  oneTimeExpense: 0,
};

function Simulator() {
  const [profile] = useProfile();
  const [draft, setDraft] = useState<Scenario>(BLANK);
  const [applied, setApplied] = useState<Scenario | null>(null);

  const baseMetrics = useMemo(() => computeMetrics(profile), [profile]);
  const baseScore = useMemo(() => predictScore(profile).score, [profile]);
  const simulated = useMemo(() => (applied ? applyScenario(profile, applied) : profile), [profile, applied]);
  const simMetrics = useMemo(() => computeMetrics(simulated), [simulated]);
  const simScore = useMemo(() => predictScore(simulated).score, [simulated]);

  const baseProj = useMemo(() => projectFuture(profile, 20), [profile]);
  const simProj = useMemo(() => projectFuture(simulated, 20), [simulated]);
  const combined = baseProj.map((p, i) => ({ year: p.year, base: p.netWorth, scenario: simProj[i]?.netWorth ?? 0 }));

  const cur = profile.currency;

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header>
        <p className="text-xs font-medium uppercase tracking-widest text-gold">What-If Simulator</p>
        <h1 className="mt-1 font-serif text-4xl text-primary">Rehearse your next move.</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Build any scenario — a raise, a loan, a career break — then apply it and watch every
          metric on this page update against your baseline.
        </p>
      </header>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Design your scenario</h2>
          {applied && (
            <button
              onClick={() => { setApplied(null); setDraft(BLANK); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TxtField label="Scenario name" value={draft.label} onChange={(v) => setDraft({ ...draft, label: v })} />
          <NumField label="Income change (₹/mo)" value={draft.incomeDelta ?? 0} onChange={(v) => setDraft({ ...draft, incomeDelta: v })} />
          <NumField label="Income multiplier" value={draft.incomeMultiplier ?? 1} step={0.05} onChange={(v) => setDraft({ ...draft, incomeMultiplier: v })} help="0.5 = half salary, 0 = job loss" isMultiplier />
          <NumField label="Extra monthly savings (₹)" value={draft.extraSavings ?? 0} onChange={(v) => setDraft({ ...draft, extraSavings: v })} />
          <NumField label="Extra monthly expenses (₹)" value={draft.expenseDelta ?? 0} onChange={(v) => setDraft({ ...draft, expenseDelta: v })} />
          <NumField label="Expense multiplier" value={draft.expenseMultiplier ?? 1} step={0.05} onChange={(v) => setDraft({ ...draft, expenseMultiplier: v })} help="1.1 = 10% inflation shock" isMultiplier />
          <NumField label="New loan EMI (₹/mo)" value={draft.newLoanEmi ?? 0} onChange={(v) => setDraft({ ...draft, newLoanEmi: v })} />
          <NumField label="New loan balance (₹)" value={draft.newLoanBalance ?? 0} onChange={(v) => setDraft({ ...draft, newLoanBalance: v })} />
          <NumField label="One-time expense (₹)" value={draft.oneTimeExpense ?? 0} onChange={(v) => setDraft({ ...draft, oneTimeExpense: v })} help="e.g. down payment, medical bill" />
          <NumField label="Inflation change (%)" value={draft.inflationDelta ?? 0} step={0.5} onChange={(v) => setDraft({ ...draft, inflationDelta: v })} />
        </div>

        <button
          onClick={() => setApplied({ ...draft })}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
        >
          <Wand2 className="h-4 w-4" /> Apply scenario
        </button>
      </section>

      {/* Impact deltas */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Delta label="Health Score (ML)" base={baseScore} sim={simScore} unit="" cur={cur} />
        <Delta label="Net Worth (today)" base={baseMetrics.netWorth} sim={simMetrics.netWorth} unit="money" cur={cur} />
        <Delta label="Monthly Cashflow" base={baseMetrics.monthlyCashflow} sim={simMetrics.monthlyCashflow} unit="money" cur={cur} />
        <Delta label="Debt-to-Income" base={baseMetrics.debtToIncome} sim={simMetrics.debtToIncome} unit="%" cur={cur} invertGood />
        <Delta label="Emergency (months)" base={baseMetrics.emergencyMonths} sim={simMetrics.emergencyMonths} unit="" cur={cur} />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Net worth projection — baseline vs {applied?.label ?? "scenario"}
        </h2>
        <div className="mt-4 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combined}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => shortMoney(v)} />
              <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
              <Legend iconType="line" wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="base" name="Baseline" stroke="#1e2a5e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="scenario" name={applied?.label ?? "Scenario"} stroke="#c9a441" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {!applied && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Design a scenario above and click Apply to see the projection change.
          </p>
        )}
      </section>
    </div>
  );
}

function shortMoney(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (abs >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}k`;
  return `${v}`;
}

function TxtField({ label, value, onChange, placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder || "Custom scenario"}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1000, help, isMultiplier }: { label: string; value: number; onChange: (v: number) => void; step?: number; help?: string; isMultiplier?: boolean }) {
  const isEmpty = isMultiplier ? value === 1 : value === 0;
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={isEmpty ? "" : value}
        placeholder={isMultiplier ? "1" : "0"}
        onChange={(e) => onChange(Number(e.target.value) || (isMultiplier ? 1 : 0))}
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
      {help && <span className="mt-1 block text-[11px] text-muted-foreground">{help}</span>}
    </label>
  );
}

function Delta({ label, base, sim, unit, cur, invertGood }: { label: string; base: number; sim: number; unit: "money" | "%" | ""; cur: "INR" | "USD" | "EUR"; invertGood?: boolean }) {
  const diff = sim - base;
  const good = invertGood ? diff < 0 : diff > 0;
  const flat = Math.abs(diff) < 0.01;
  const fmt = (v: number) => unit === "money" ? formatCurrency(v, cur) : unit === "%" ? `${v.toFixed(1)}%` : v.toFixed(1);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl text-primary">{fmt(sim)}</p>
      <p className="text-xs text-muted-foreground">Baseline: {fmt(base)}</p>
      <p className={"mt-2 inline-flex items-center gap-1 text-xs font-medium " + (flat ? "text-muted-foreground" : good ? "text-[color:var(--success)]" : "text-destructive")}>
        {flat ? "—" : good ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {fmt(Math.abs(diff))}
      </p>
    </div>
  );
}
