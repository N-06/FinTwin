import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import { applyScenario, computeMetrics, projectFuture } from "@/lib/finance-calc";
import type { Scenario } from "@/lib/finance-types";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { Car, Briefcase, TrendingUp, Flame, PiggyBank, Home, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/simulator")({
  head: () => ({
    meta: [
      { title: "What-If Simulator — FinTwin" },
      { name: "description", content: "Simulate life scenarios and see how they change your financial future." },
      { property: "og:title", content: "What-If Simulator — FinTwin" },
      { property: "og:description", content: "Simulate life scenarios and see how they change your financial future." },
    ],
  }),
  component: Simulator,
});

const PRESETS: (Scenario & { icon: React.ComponentType<{ className?: string }>; description: string })[] = [
  { id: "car", label: "Buy a car (₹8L)", icon: Car, description: "₹8,000/mo EMI for 5 years", newLoanEmi: 17000, newLoanBalance: 800000, oneTimeExpense: 100000 },
  { id: "job_loss", label: "Lose my job", icon: Briefcase, description: "Income drops to 0", incomeMultiplier: 0 },
  { id: "raise", label: "Get a 20% raise", icon: TrendingUp, description: "Monthly income up 20%", incomeMultiplier: 1.2 },
  { id: "inflation", label: "Inflation +4%", icon: Flame, description: "Expenses grow faster", expenseMultiplier: 1.08, inflationDelta: 4 },
  { id: "extra_save", label: "Save ₹10,000 more", icon: PiggyBank, description: "Extra monthly investing", extraSavings: 10000 },
  { id: "home", label: "Take a home loan", icon: Home, description: "₹40L loan @ ~₹35k EMI", newLoanEmi: 35000, newLoanBalance: 4000000 },
];

function Simulator() {
  const [profile] = useProfile();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [custom, setCustom] = useState<Scenario>({ id: "custom", label: "Custom", incomeDelta: 0, extraSavings: 0, expenseDelta: 0, newLoanEmi: 0, newLoanBalance: 0, inflationDelta: 0 });

  const baseMetrics = useMemo(() => computeMetrics(profile), [profile]);
  const simulated = useMemo(() => (scenario ? applyScenario(profile, scenario) : profile), [profile, scenario]);
  const simMetrics = useMemo(() => computeMetrics(simulated), [simulated]);

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
          Pick a scenario or design your own. Your dashboard updates instantly to show the impact.
        </p>
      </header>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PRESETS.map((p) => {
          const active = scenario?.id === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setScenario(active ? null : p)}
              className={
                "group rounded-2xl border p-5 text-left shadow-soft transition-all hover:-translate-y-0.5 " +
                (active
                  ? "border-gold bg-gradient-hero text-primary-foreground shadow-elegant"
                  : "border-border bg-card text-foreground hover:border-gold/40")
              }
            >
              <div className={"flex h-9 w-9 items-center justify-center rounded-lg " + (active ? "bg-gold text-primary" : "bg-accent text-primary")}>
                <p.icon className="h-4 w-4" />
              </div>
              <p className={"mt-3 text-sm font-semibold " + (active ? "text-primary-foreground" : "text-primary")}>{p.label}</p>
              <p className={"mt-0.5 text-xs " + (active ? "text-primary-foreground/70" : "text-muted-foreground")}>{p.description}</p>
            </button>
          );
        })}
      </section>

      {/* Custom */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Custom scenario</h2>
          {scenario && (
            <button
              onClick={() => setScenario(null)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-accent"
            >
              <RotateCcw className="h-3 w-3" /> Reset
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <NumberField label="Income change (monthly)" value={custom.incomeDelta ?? 0} onChange={(v) => setCustom({ ...custom, incomeDelta: v })} />
          <NumberField label="Extra monthly savings" value={custom.extraSavings ?? 0} onChange={(v) => setCustom({ ...custom, extraSavings: v })} />
          <NumberField label="Extra monthly expense" value={custom.expenseDelta ?? 0} onChange={(v) => setCustom({ ...custom, expenseDelta: v })} />
          <NumberField label="New loan EMI (monthly)" value={custom.newLoanEmi ?? 0} onChange={(v) => setCustom({ ...custom, newLoanEmi: v })} />
          <NumberField label="New loan balance" value={custom.newLoanBalance ?? 0} onChange={(v) => setCustom({ ...custom, newLoanBalance: v })} />
          <NumberField label="Inflation change (%)" value={custom.inflationDelta ?? 0} onChange={(v) => setCustom({ ...custom, inflationDelta: v })} step={0.5} />
        </div>
        <button
          onClick={() => setScenario({ ...custom, label: "Custom scenario" })}
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
        >
          Apply custom scenario
        </button>
      </section>

      {/* Impact */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Delta label="Health Score" base={baseMetrics.healthScore} sim={simMetrics.healthScore} unit="" cur={cur} />
        <Delta label="Net Worth (today)" base={baseMetrics.netWorth} sim={simMetrics.netWorth} unit="money" cur={cur} />
        <Delta label="Monthly Cashflow" base={baseMetrics.monthlyCashflow} sim={simMetrics.monthlyCashflow} unit="money" cur={cur} />
        <Delta label="Debt-to-Income" base={baseMetrics.debtToIncome} sim={simMetrics.debtToIncome} unit="%" cur={cur} invertGood />
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Net worth projection — baseline vs scenario
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
              <Line type="monotone" dataKey="scenario" name={scenario?.label ?? "Scenario"} stroke="#c9a441" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
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

function NumberField({ label, value, onChange, step = 1000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}

function Delta({ label, base, sim, unit, cur, invertGood }: { label: string; base: number; sim: number; unit: "money" | "%" | ""; cur: "INR" | "USD" | "EUR"; invertGood?: boolean }) {
  const diff = sim - base;
  const good = invertGood ? diff < 0 : diff > 0;
  const fmt = (v: number) => unit === "money" ? formatCurrency(v, cur) : unit === "%" ? `${v.toFixed(1)}%` : v.toFixed(1);
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-2xl text-primary">{fmt(sim)}</p>
      <p className="text-xs text-muted-foreground">Baseline: {fmt(base)}</p>
      <p className={"mt-2 text-xs font-medium " + (Math.abs(diff) < 0.01 ? "text-muted-foreground" : good ? "text-[color:var(--success)]" : "text-destructive")}>
        {diff >= 0 ? "▲" : "▼"} {fmt(Math.abs(diff))}
      </p>
    </div>
  );
}
