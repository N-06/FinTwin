import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import { computeMetrics, projectFuture } from "@/lib/finance-calc";
import { Download, Printer } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/report")({
  head: () => ({
    meta: [
      { title: "Financial Report — FinTwin" },
      { name: "description", content: "Download a full snapshot of your financial life." },
      { property: "og:title", content: "Financial Report — FinTwin" },
      { property: "og:description", content: "Download a full snapshot of your financial life." },
    ],
  }),
  component: Report,
});

function Report() {
  const [profile] = useProfile();
  const metrics = useMemo(() => computeMetrics(profile), [profile]);
  const proj = useMemo(() => projectFuture(profile, 10), [profile]);
  const cur = profile.currency;

  const download = () => {
    const lines: string[] = [];
    const push = (s = "") => lines.push(s);
    push("FINTWIN — FINANCIAL REPORT");
    push("Generated: " + new Date().toLocaleString());
    push("=".repeat(48));
    push(`Name: ${profile.name || "—"}`);
    push(`Age: ${profile.age}`);
    push("");
    push("HEALTH SCORE: " + Math.round(metrics.healthScore) + " / 100");
    metrics.scoreBreakdown.forEach((b) => push(`  • ${b.label}: ${Math.round(b.score)}`));
    push("");
    push("KEY METRICS");
    push(`  Net worth:       ${formatCurrency(metrics.netWorth, cur)}`);
    push(`  Total assets:    ${formatCurrency(metrics.totalAssets, cur)}`);
    push(`  Total debts:     ${formatCurrency(metrics.totalLiabilities, cur)}`);
    push(`  Monthly income:  ${formatCurrency(metrics.totalIncome, cur)}`);
    push(`  Monthly expenses:${formatCurrency(metrics.totalExpenses, cur)}`);
    push(`  Loan EMIs:       ${formatCurrency(metrics.totalEmi, cur)}`);
    push(`  Cashflow:        ${formatCurrency(metrics.monthlyCashflow, cur)}`);
    push(`  Savings rate:    ${metrics.savingsRate.toFixed(1)}%`);
    push(`  Debt-to-Income:  ${metrics.debtToIncome.toFixed(1)}%`);
    push(`  Emergency fund:  ${metrics.emergencyMonths.toFixed(1)} months`);
    push("");
    push("GOALS");
    profile.goals.forEach((g) => {
      const pct = (g.saved / Math.max(1, g.targetAmount)) * 100;
      push(`  • ${g.name} — ${formatCurrency(g.saved, cur)} / ${formatCurrency(g.targetAmount, cur)} (${pct.toFixed(0)}%) by ${g.targetYear}`);
    });
    push("");
    push("10-YEAR NET WORTH PROJECTION");
    proj.forEach((p) => push(`  ${p.year}: ${formatCurrency(p.netWorth, cur)}`));

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fintwin-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 print:max-w-full print:p-0">
      <header className="flex flex-wrap items-end justify-between gap-3 print:hidden">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Report</p>
          <h1 className="mt-1 font-serif text-4xl text-primary">Your financial snapshot.</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={download}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
          >
            <Download className="h-4 w-4" /> Download .txt
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-accent"
          >
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
        </div>
      </header>

      <article className="mt-6 rounded-2xl border border-border bg-card p-8 shadow-soft print:border-0 print:shadow-none">
        <div className="border-b border-border pb-4">
          <p className="font-serif text-3xl text-primary">FinTwin — Financial Report</p>
          <p className="text-sm text-muted-foreground">
            {profile.name || "Anonymous"} • Generated {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Kv label="Financial Health Score" value={`${Math.round(metrics.healthScore)} / 100`} />
          <Kv label="Net Worth" value={formatCurrency(metrics.netWorth, cur)} />
          <Kv label="Total Assets" value={formatCurrency(metrics.totalAssets, cur)} />
          <Kv label="Total Debts" value={formatCurrency(metrics.totalLiabilities, cur)} />
          <Kv label="Monthly Cashflow" value={formatCurrency(metrics.monthlyCashflow, cur)} />
          <Kv label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`} />
          <Kv label="Debt-to-Income" value={`${metrics.debtToIncome.toFixed(1)}%`} />
          <Kv label="Emergency Fund" value={`${metrics.emergencyMonths.toFixed(1)} months`} />
        </div>

        <h2 className="mt-8 font-serif text-xl text-primary">Score breakdown</h2>
        <div className="mt-3 space-y-2">
          {metrics.scoreBreakdown.map((b) => (
            <div key={b.label} className="flex items-center justify-between border-b border-border py-2 text-sm">
              <span>{b.label}</span>
              <span className="font-semibold text-primary">{Math.round(b.score)} / 100</span>
            </div>
          ))}
        </div>

        <h2 className="mt-8 font-serif text-xl text-primary">Goals</h2>
        <div className="mt-3 space-y-2">
          {profile.goals.map((g) => {
            const pct = (g.saved / Math.max(1, g.targetAmount)) * 100;
            return (
              <div key={g.id} className="border-b border-border py-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{g.name}</span>
                  <span className="text-muted-foreground">{formatCurrency(g.saved, cur)} / {formatCurrency(g.targetAmount, cur)} • by {g.targetYear}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-gold" style={{ width: `${Math.min(100, pct)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        <h2 className="mt-8 font-serif text-xl text-primary">10-year net worth projection</h2>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2">Year</th>
              <th className="py-2 text-right">Net Worth</th>
              <th className="py-2 text-right">Investments</th>
            </tr>
          </thead>
          <tbody>
            {proj.map((p) => (
              <tr key={p.year} className="border-b border-border/60">
                <td className="py-2">{p.year}</td>
                <td className="py-2 text-right">{formatCurrency(p.netWorth, cur)}</td>
                <td className="py-2 text-right">{formatCurrency(p.investments, cur)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-2xl text-primary">{value}</p>
    </div>
  );
}
