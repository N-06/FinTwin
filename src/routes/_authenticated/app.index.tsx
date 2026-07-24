import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { formatCurrency, useProfile } from "@/lib/finance-store";
import { computeMetrics, projectFuture } from "@/lib/finance-calc";
import { predictScore, cohortFor, percentileIn, MODEL_VERSION } from "@/lib/ml-scorer";
import {
  ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Landmark, HeartPulse, ArrowRight, Brain, BookOpen } from "lucide-react";
import { InfoTip } from "@/components/InfoTip";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Dashboard,
});

const PIE_COLORS = ["#1e2a5e", "#c9a441", "#3a5ba0", "#5f7fbf", "#8ba7d1"];

function Dashboard() {
  const [profile, , , { isLoading }] = useProfile();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !profile.onboardingComplete) {
      navigate({ to: "/app/onboarding" });
    }
  }, [isLoading, profile.onboardingComplete, navigate]);

  const metrics = useMemo(() => computeMetrics(profile), [profile]);
  const projections = useMemo(() => projectFuture(profile, 20), [profile]);
  const ml = useMemo(() => predictScore(profile), [profile]);
  const cohort = useMemo(() => cohortFor(profile), [profile]);
  const cur = profile.currency;

  const expensePie = profile.expenses.map((e) => ({ name: e.category, value: e.amount }));
  const netWorthMix = [
    { name: "Savings", value: profile.savings + profile.emergencyFund },
    { name: "Investments", value: profile.investments.reduce((s, i) => s + i.amount, 0) },
  ];

  if (isLoading || !profile.onboardingComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading your twin…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Your financial twin</p>
          <h1 className="mt-1 font-serif text-4xl text-primary">
            {profile.name ? `Hi, ${profile.name}` : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">A live snapshot of your money as of today.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/app/glossary"
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-accent/50 px-3 py-2 text-xs font-medium text-primary hover:bg-accent"
          >
            <BookOpen className="h-3.5 w-3.5 text-gold" /> Glossary
          </Link>
          <Link
            to="/app/profile"
            className="rounded-full border border-primary/20 bg-background px-4 py-2 text-sm font-medium text-primary hover:bg-accent"
          >
            Edit profile
          </Link>
        </div>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <HealthScoreCard score={ml.score} drivers={ml.drivers.slice(0, 5)} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <MetricCard icon={<Wallet />} label="Net Worth" value={formatCurrency(metrics.netWorth, cur)}
            hint={`${formatCurrency(metrics.totalAssets, cur)} assets − ${formatCurrency(metrics.totalLiabilities, cur)} debt`}
            positive={metrics.netWorth >= 0}
            tip="Everything you own (savings, emergency fund, investments) minus everything you owe (loan balances). Rising net worth = real financial progress." />
          <MetricCard icon={<PiggyBank />} label="Savings Rate" value={`${metrics.savingsRate.toFixed(1)}%`}
            hint="Of monthly income" positive={metrics.savingsRate >= 20}
            tip="Share of your income you invest or save each month. 20%+ is strong, 10–20% is decent, under 10% leaves little room to build wealth." />
          <MetricCard icon={<Landmark />} label="Debt-to-Income" value={`${metrics.debtToIncome.toFixed(1)}%`}
            hint="EMI as % of income" positive={metrics.debtToIncome < 35}
            tip="Portion of your income already promised to loan EMIs. Under 35% is healthy; above 43% typically blocks new loans." />
          <MetricCard icon={<HeartPulse />} label="Emergency Fund" value={`${metrics.emergencyMonths.toFixed(1)} mo`}
            hint="Months of expenses covered" positive={metrics.emergencyMonths >= 3}
            tip="How many months your emergency cash could cover your expenses. Aim for 3 months minimum, 6 months comfortable." />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            How you compare — {cohort.ageBand} · {cohort.incomeBand} cohort
            <InfoTip text="Each bar shows your value and its percentile vs people in your age × income group. 70th percentile means you're doing better than 70% of that cohort. Debt-to-Income is inverted — lower is better." />
          </h2>
          <span className="text-xs text-muted-foreground">Percentiles from CFPB FWB survey</span>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            How you compare — {cohort.ageBand} · {cohort.incomeBand} cohort
          </h2>
          <span className="text-xs text-muted-foreground">Percentiles from CFPB FWB survey</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <PercentileBar label="Health Score"   value={ml.score}                ptiles={cohort.percentiles.healthScore} />
          <PercentileBar label="Savings Rate"   value={metrics.savingsRate}     ptiles={cohort.percentiles.savingsRate} suffix="%" />
          <PercentileBar label="Debt-to-Income" value={metrics.debtToIncome}    ptiles={cohort.percentiles.dti} suffix="%" invert />
          <PercentileBar label="Emergency (mo)" value={metrics.emergencyMonths} ptiles={cohort.percentiles.emergencyMonths} />
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Monthly cash flow <InfoTip text="Income at the top, then everything that leaves — expenses, EMIs, and money you send to savings/investments. The bottom row is what's left unassigned." /></h2>
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
            {expensePie.length === 0 ? (
              <EmptyChart text="Add expenses on the Profile page" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensePie} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {expensePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">20-year projection</h2>
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
            {netWorthMix.every((n) => n.value === 0) ? (
              <EmptyChart text="No assets recorded yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={netWorthMix} dataKey="value" innerRadius={45} outerRadius={80} paddingAngle={2}>
                    {netWorthMix.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v, cur)} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Total assets: {formatCurrency(metrics.totalAssets, cur)}
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Goals</h2>
          <Link to="/app/goals" className="text-xs font-medium text-primary hover:text-gold">Manage →</Link>
        </div>
        {profile.goals.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No goals yet. <Link to="/app/goals" className="font-medium text-primary hover:text-gold">Add your first →</Link>
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {profile.goals.map((g) => {
              const pct = g.targetAmount > 0 ? Math.min(100, (g.saved / g.targetAmount) * 100) : 0;
              return (
                <div key={g.id} className="rounded-xl border border-border p-4">
                  <div className="flex items-baseline justify-between">
                    <p className="font-medium text-primary">{g.name || "Untitled goal"}</p>
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

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
      {text}
    </div>
  );
}

function PercentileBar({ label, value, ptiles, suffix = "", invert }: { label: string; value: number; ptiles: number[]; suffix?: string; invert?: boolean }) {
  const p = percentileIn(ptiles, value);
  const displayP = invert ? 100 - p : p;
  const tone = displayP >= 70 ? "text-[color:var(--success,#7bc47f)]" : displayP >= 40 ? "text-gold" : "text-destructive";
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-baseline justify-between">
        <p className="font-serif text-2xl text-primary">{value.toFixed(1)}{suffix}</p>
        <p className={"text-xs font-semibold " + tone}>{displayP}th ptile</p>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={"h-full " + (displayP >= 70 ? "bg-[color:var(--success,#7bc47f)]" : displayP >= 40 ? "bg-gold" : "bg-destructive")} style={{ width: `${displayP}%` }} />
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, hint, positive, tip }: { icon: React.ReactNode; label: string; value: string; hint: string; positive: boolean; tip?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</div>
        {positive ? <TrendingUp className="h-4 w-4 text-[color:var(--success)]" /> : <TrendingDown className="h-4 w-4 text-destructive" />}
      </div>
      <p className="mt-4 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}{tip && <InfoTip text={tip} />}
      </p>
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

function HealthScoreCard({ score, drivers }: { score: number; drivers: { label: string; contribution: number }[] }) {
  const rounded = Math.round(score);
  const rating = rounded >= 80 ? "Excellent" : rounded >= 65 ? "Strong" : rounded >= 50 ? "Fair" : rounded >= 35 ? "Needs work" : "At risk";
  const circumference = 2 * Math.PI * 68;
  const offset = circumference - (rounded / 100) * circumference;
  const maxAbs = Math.max(1, ...drivers.map((d) => Math.abs(d.contribution)));
  return (
    <div className="rounded-2xl bg-gradient-hero p-6 text-primary-foreground shadow-elegant">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-gold">Financial Health Score</p>
        <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-gold">
          <Brain className="h-3 w-3" /> ML · v{MODEL_VERSION}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-6">
        <div className="relative h-40 w-40">
          <svg viewBox="0 0 160 160" className="h-40 w-40 -rotate-90">
            <circle cx="80" cy="80" r="68" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
            <circle cx="80" cy="80" r="68" fill="none" stroke="#c9a441" strokeWidth="10" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.8s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-5xl text-gold">{rounded}</span>
            <span className="text-xs text-primary-foreground/70">/ 100</span>
          </div>
        </div>
        <div>
          <p className="font-serif text-2xl text-gold">{rating}</p>
          <p className="mt-1 max-w-[10rem] text-xs text-primary-foreground/70">
            Predicted from your engineered features.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-2">
        <p className="text-[10px] font-medium uppercase tracking-widest text-gold/80">Top drivers</p>
        {drivers.map((d) => {
          const positive = d.contribution >= 0;
          const pct = (Math.abs(d.contribution) / maxAbs) * 100;
          return (
            <div key={d.label}>
              <div className="flex items-center justify-between text-xs">
                <span className="text-primary-foreground/80">{d.label}</span>
                <span className={positive ? "text-[#7bc47f]" : "text-[#f5a3a3]"}>
                  {positive ? "+" : "−"}{Math.abs(d.contribution).toFixed(1)}
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className={"h-full " + (positive ? "bg-gold" : "bg-[#f5a3a3]")} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
