import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { formatCurrency, useProfile } from "@/lib/finance-store";
import { computeMetrics, projectFuture } from "@/lib/finance-calc";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Landmark, HeartPulse, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

const PIE_COLORS = ["#1e2a5e", "#c9a441", "#3a5ba0", "#5f7fbf", "#8ba7d1"];

function Dashboard() {
  const [profile] = useProfile();
  const metrics = useMemo(() => computeMetrics(profile), [profile]);
  const projections = useMemo(() => projectFuture(profile, 20), [profile]);
  const cur = profile.currency;

  const expensePie = profile.expenses.map((e) => ({ name: e.category, value: e.amount }));
  const netWorthMix = [
    { name: "Savings", value: profile.savings + profile.emergencyFund },
    { name: "Investments", value: profile.investments.reduce((s, i) => s + i.amount, 0) },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Your financial twin</p>
          <h1 className="mt-1 font-serif text-4xl text-primary">
            {profile.name ? `Hi, ${profile.name}` : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A live snapshot of your money as of today.
          </p>
        </div>
        <Link
          to="/app/profile"
          className="rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-accent"
        >
          Edit profile
        </Link>
      </header>

      {/* Health score hero */}
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthScoreCard score={metrics.healthScore} breakdown={metrics.scoreBreakdown} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard
            icon={<Wallet />}
            label="Net Worth"
            value={formatCurrency(metrics.netWorth, cur)}
            hint={`${formatCurrency(metrics.totalAssets, cur)} assets − ${formatCurrency(metrics.totalLiabilities, cur)} debt`}
            positive={metrics.netWorth >= 0}
          />
          <MetricCard
            icon={<PiggyBank />}
            label="Savings Rate"
            value={`${metrics.savingsRate.toFixed(1)}%`}
            hint="Of monthly income"
            positive={metrics.savingsRate >= 20}
          />
          <MetricCard
            icon={<Landmark />}
            label="Debt-to-Income"
            value={`${metrics.debtToIncome.toFixed(1)}%`}
            hint="EMI as % of income"
            positive={metrics.debtToIncome < 35}
          />
          <MetricCard
            icon={<HeartPulse />}
            label="Emergency Fund"
            value={`${metrics.emergencyMonths.toFixed(1)} mo`}
            hint="Months of expenses covered"
            positive={metrics.emergencyMonths >= 3}
          />
        </div>
      </section>

      {/* Cashflow */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly cash flow</h2>
            <span className={"text-sm font-medium " + (metrics.monthlyCashflow >= 0 ? "text-[color:var(--success)]" : "text-destructive")}>
              {metrics.monthlyCashflow >= 0 ? "Surplus" : "Deficit"}: {formatCurrency(Math.abs(metrics.monthlyCashflow), cur)}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <FlowRow label="Income" amount={metrics.totalIncome} cur={cur} type="in" />
            <FlowRow label="Expenses" amount={metrics.totalExpenses} cur={cur} type="out" />
            <FlowRow label="Loan EMIs" amount={metrics.totalEmi} cur={cur} type="out" />
            <FlowRow label="Investing / Saving" amount={profile.monthlyContribution} cur={cur} type="save" />
            <div className="mt-3 border-t border-border pt-3">
              <FlowRow label="Free cash" amount={metrics.monthlyCashflow} cur={cur} type={metrics.monthlyCashflow >= 0 ? "in" : "out"} bold />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Expense mix</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={expensePie} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {expensePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Cohort benchmark */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            How you compare — {cohort.ageBand} · {cohort.incomeBand} cohort
          </h2>
          <span className="text-xs text-muted-foreground">Percentiles from CFPB FWB survey</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PercentileBar label="Health Score"    value={ml.score}                  ptiles={cohort.percentiles.healthScore} />
          <PercentileBar label="Savings Rate"    value={metrics.savingsRate}       ptiles={cohort.percentiles.savingsRate} suffix="%" />
          <PercentileBar label="Debt-to-Income"  value={metrics.debtToIncome}      ptiles={cohort.percentiles.dti}          suffix="%" invert />
          <PercentileBar label="Emergency (mo)"  value={metrics.emergencyMonths}   ptiles={cohort.percentiles.emergencyMonths} />
        </div>
      </section>



      {/* Projections */}
      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              20-year projection
            </h2>
            <Link to="/app/simulator" className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-gold">
              Run a scenario <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projections}>
                <defs>
                  <linearGradient id="nw" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1e2a5e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1e2a5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="inv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a441" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c9a441" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => shortMoney(v)} />
                <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                <Area type="monotone" dataKey="netWorth" stroke="#1e2a5e" strokeWidth={2} fill="url(#nw)" name="Net Worth" />
                <Area type="monotone" dataKey="investments" stroke="#c9a441" strokeWidth={2} fill="url(#inv)" name="Investments" />
                <Legend iconType="line" wrapperStyle={{ fontSize: 12 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Asset composition</h2>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={netWorthMix} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {netWorthMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Total assets: {formatCurrency(metrics.totalAssets, cur)}
          </p>
        </div>
      </section>

      {/* Goals summary */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Goals</h2>
          <Link to="/app/goals" className="text-xs font-medium text-primary hover:text-gold">Manage →</Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {profile.goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.targetAmount) * 100);
            return (
              <div key={g.id} className="rounded-xl border border-border p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-medium text-primary">{g.name}</p>
                  <p className="text-xs text-muted-foreground">by {g.targetYear}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatCurrency(g.saved, cur)} / {formatCurrency(g.targetAmount, cur)}
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-gold" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1.5 text-right text-xs font-medium text-primary">{pct.toFixed(0)}%</p>
              </div>
            );
          })}
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

function MetricCard({ icon, label, value, hint, positive }: { icon: React.ReactNode; label: string; value: string; hint: string; positive: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary [&>svg]:h-4 [&>svg]:w-4">
          {icon}
        </div>
        {positive ? <TrendingUp className="h-4 w-4 text-[color:var(--success)]" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
      </div>
      <p className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-serif text-3xl text-primary">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function FlowRow({ label, amount, cur, type, bold }: { label: string; amount: number; cur: "INR" | "USD" | "EUR"; type: "in" | "out" | "save"; bold?: boolean }) {
  const color = type === "in" ? "text-[color:var(--success)]" : type === "out" ? "text-destructive" : "text-primary";
  const sign = type === "in" ? "+" : type === "out" ? "−" : "→";
  return (
    <div className={"flex items-center justify-between text-sm " + (bold ? "font-semibold" : "")}>
      <span className="text-muted-foreground">{label}</span>
      <span className={color}>{sign} {formatCurrency(Math.abs(amount), cur)}</span>
    </div>
  );
}

function HealthScoreCard({ score, breakdown }: { score: number; breakdown: { label: string; score: number; weight: number }[] }) {
  const rounded = Math.round(score);
  const rating = rounded >= 80 ? "Excellent" : rounded >= 65 ? "Strong" : rounded >= 50 ? "Fair" : rounded >= 35 ? "Needs work" : "At risk";
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (rounded / 100) * circumference;
  return (
    <div className="rounded-2xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
      <p className="text-xs font-medium uppercase tracking-widest text-gold">Financial Health Score</p>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle
              cx="80" cy="80" r="68"
              fill="none"
              stroke="#c9a441"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-5xl text-gold">{rounded}</span>
            <span className="text-xs text-primary-foreground/70">/ 100</span>
          </div>
        </div>
        <div>
          <p className="font-serif text-2xl text-gold">{rating}</p>
          <p className="mt-1 max-w-[10rem] text-xs text-primary-foreground/70">
            Weighted across 5 dimensions of your finances.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs">
              <span className="text-primary-foreground/80">{b.label}</span>
              <span className="text-gold">{Math.round(b.score)}</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-gold" style={{ width: `${b.score}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
