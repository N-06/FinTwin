import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import type { FinanceProfile } from "@/lib/finance-types";
import { ArrowRight, ArrowLeft, Plus, Trash2, Check, Sparkles, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/_authenticated/app/onboarding")({
  head: () => ({
    meta: [
      { title: "Set up your financial twin — FinTwin" },
      { name: "description", content: "Enter your income, expenses, savings, investments, loans and goals to build your digital financial twin." },
      { property: "og:title", content: "Set up your financial twin — FinTwin" },
      { property: "og:description", content: "Build your digital financial twin in a few steps." },
    ],
  }),
  component: Onboarding,
});

const STEPS = ["You", "Income", "Expenses", "Savings & investments", "Loans", "Goals"] as const;

function Onboarding() {
  const [profile, update] = useProfile();
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { isDark, toggle } = useTheme();

  const finish = () => {
    update((p) => ({ ...p, onboardingComplete: true }));
    setTimeout(() => navigate({ to: "/app" }), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-primary"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="mx-auto max-w-3xl px-6 py-10">
        <header>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3 text-gold" /> Onboarding
          </span>
          <h1 className="mt-3 font-serif text-4xl text-primary">Build your financial twin.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything is private to your account. You can edit it later on the Profile page.
          </p>
        </header>

        <ol className="mt-6 flex flex-wrap gap-2 text-xs">
          {STEPS.map((label, i) => (
            <li
              key={label}
              className={
                "rounded-full border px-3 py-1 " +
                (i === step
                  ? "border-primary bg-primary text-primary-foreground"
                  : i < step
                    ? "border-gold/40 bg-accent/60 text-primary"
                    : "border-border text-muted-foreground")
              }
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft md:p-8">
          {step === 0 && <StepYou profile={profile} update={update} />}
          {step === 1 && <StepIncome profile={profile} update={update} />}
          {step === 2 && <StepExpenses profile={profile} update={update} />}
          {step === 3 && <StepSavings profile={profile} update={update} />}
          {step === 4 && <StepLoans profile={profile} update={update} />}
          {step === 5 && <StepGoals profile={profile} update={update} />}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-40"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              onClick={finish}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-hero px-6 py-2.5 text-sm font-medium text-white shadow-elegant">
              <Check className="h-3.5 w-3.5 text-gold" /> Finish & open dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

type Updater = (fn: (p: FinanceProfile) => FinanceProfile) => void;

function StepYou({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-primary">About you</h2>
      <p className="mt-1 text-sm text-muted-foreground">A few basics we use to personalize your twin and benchmark you against a similar cohort.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Txt label="Name" value={profile.name} onChange={(v) => update((p) => ({ ...p, name: v }))}
          placeholder="e.g. Alex Kumar"
          help="How you'd like the app to greet you. Only visible to you." />
        <Num label="Age" value={profile.age} step={1} min={0}
          onChange={(v) => update((p) => ({ ...p, age: v }))}
          placeholder="e.g. 28"
          help="Used to compare you to the right age cohort in benchmarks." />
        <Num label="Inflation assumption" value={profile.inflationRate} step={0.5} suffix="%"
          onChange={(v) => update((p) => ({ ...p, inflationRate: v }))}
          placeholder="e.g. 6"
          help="Expected yearly rise in prices. India ~6%, US ~3%. Used in long-term projections." />
      </div>
    </div>
  );
}

function StepIncome({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-primary">Monthly income</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter what actually lands in your account each month — after tax, not gross.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Num label="Salary (take-home)" value={profile.monthlyIncome}
          onChange={(v) => update((p) => ({ ...p, monthlyIncome: v }))}
          placeholder="e.g. 80000"
          help="Your net monthly salary after tax and PF deductions." />
        <Num label="Other income" value={profile.otherIncome}
          onChange={(v) => update((p) => ({ ...p, otherIncome: v }))}
          placeholder="e.g. 15000"
          help="Rent received, freelance, dividends, side hustle. Enter 0 if none." />
      </div>
    </div>
  );
}

function StepExpenses({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-primary">Monthly expenses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Add each recurring category with its rough monthly amount. Category name on the left, rupees on the right.</p>
        </div>
        <AddBtn onClick={() => update((p) => ({ ...p, expenses: [...p.expenses, { id: `e_${Date.now()}`, category: "", amount: 0 }] }))} />
      </div>
      <div className="mt-4 space-y-2">
        {profile.expenses.length === 0 && <EmptyHint text="Tap +Add to start. Common ones: Rent, Groceries, Transport, Utilities, Subscriptions, Dining out." />}
        {profile.expenses.map((e) => (
          <RowShell key={e.id} onDelete={() => update((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== e.id) }))}>
            <Txt compact placeholder="Category — e.g. Rent" value={e.category} onChange={(v) => update((p) => ({ ...p, expenses: p.expenses.map((x) => x.id === e.id ? { ...x, category: v } : x) }))} />
            <Num compact placeholder="Amount / month" value={e.amount} onChange={(v) => update((p) => ({ ...p, expenses: p.expenses.map((x) => x.id === e.id ? { ...x, amount: v } : x) }))} />
          </RowShell>
        ))}
      </div>
      <p className="mt-3 text-right text-sm text-muted-foreground">
        Total: <span className="font-semibold text-primary">{formatCurrency(profile.expenses.reduce((s, e) => s + e.amount, 0), profile.currency)}/mo</span>
      </p>
    </div>
  );
}

function StepSavings({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-primary">Savings & investments</h2>
      <p className="mt-1 text-sm text-muted-foreground">Where your money lives today, and how much you keep adding each month.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <Num label="Liquid savings" value={profile.savings} onChange={(v) => update((p) => ({ ...p, savings: v }))}
          placeholder="e.g. 150000"
          help="Cash in savings/checking accounts you can spend immediately. Do not include your emergency fund." />
        <Num label="Emergency fund" value={profile.emergencyFund} onChange={(v) => update((p) => ({ ...p, emergencyFund: v }))}
          placeholder="e.g. 200000"
          help="Money set aside only for emergencies — kept in a safe, liquid account. Aim for 3–6 months of expenses." />
        <Num label="Monthly investing / saving" value={profile.monthlyContribution} onChange={(v) => update((p) => ({ ...p, monthlyContribution: v }))}
          placeholder="e.g. 20000"
          help="Total you put into SIPs, stocks, PF, RDs, etc. every month." />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Investment accounts</h3>
          <p className="mt-1 text-xs text-muted-foreground">Name · current value · expected annual return (%). Skip if you have none.</p>
        </div>
        <AddBtn onClick={() => update((p) => ({ ...p, investments: [...p.investments, { id: `i_${Date.now()}`, name: "", amount: 0, expectedReturn: 10 }] }))} />
      </div>
      <div className="mt-3 space-y-2">
        {profile.investments.length === 0 && <EmptyHint text="Common: Mutual Funds (~12%), Stocks (~13%), PF/EPF (~8%), Fixed Deposits (~7%)." />}
        {profile.investments.map((i) => (
          <RowShell key={i.id} onDelete={() => update((p) => ({ ...p, investments: p.investments.filter((x) => x.id !== i.id) }))}>
            <Txt compact placeholder="Name — e.g. Mutual Funds" value={i.name} onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, name: v } : x) }))} />
            <Num compact placeholder="Current value" value={i.amount} onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, amount: v } : x) }))} />
            <Num compact placeholder="Return" value={i.expectedReturn} step={0.5} suffix="%" onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, expectedReturn: v } : x) }))} />
          </RowShell>
        ))}
      </div>
    </div>
  );
}

function StepLoans({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-primary">Loans</h2>
          <p className="mt-1 text-sm text-muted-foreground">Name · outstanding balance · monthly EMI · interest rate (%). Skip if you have none.</p>
        </div>
        <AddBtn onClick={() => update((p) => ({ ...p, loans: [...p.loans, { id: `l_${Date.now()}`, name: "", balance: 0, emi: 0, interestRate: 10 }] }))} />
      </div>
      <div className="mt-4 space-y-2">
        {profile.loans.length === 0 && <EmptyHint text="Common: Home loan, Car loan, Personal loan, Education loan, Credit card debt." />}
        {profile.loans.map((l) => (
          <RowShell key={l.id} onDelete={() => update((p) => ({ ...p, loans: p.loans.filter((x) => x.id !== l.id) }))}>
            <Txt compact placeholder="Name — e.g. Home loan" value={l.name} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, name: v } : x) }))} />
            <Num compact placeholder="Balance left" value={l.balance} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, balance: v } : x) }))} />
            <Num compact placeholder="EMI / month" value={l.emi} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, emi: v } : x) }))} />
            <Num compact placeholder="Rate" value={l.interestRate} step={0.25} suffix="%" onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, interestRate: v } : x) }))} />
          </RowShell>
        ))}
      </div>
    </div>
  );
}

function StepGoals({ profile, update }: { profile: FinanceProfile; update: Updater }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl text-primary">Goals</h2>
          <p className="mt-1 text-sm text-muted-foreground">Goal name · target amount · target year · already saved. Even rough numbers help the AI plan.</p>
        </div>
        <AddBtn onClick={() => update((p) => ({ ...p, goals: [...p.goals, { id: `g_${Date.now()}`, name: "", targetAmount: 0, targetYear: new Date().getFullYear() + 5, saved: 0 }] }))} />
      </div>
      <div className="mt-4 space-y-2">
        {profile.goals.length === 0 && <EmptyHint text="Examples: Buy a home, Retirement, Kid's education, Emergency fund top-up, Sabbatical." />}
        {profile.goals.map((g) => (
          <RowShell key={g.id} onDelete={() => update((p) => ({ ...p, goals: p.goals.filter((x) => x.id !== g.id) }))}>
            <Txt compact placeholder="Goal — e.g. Buy a home" value={g.name} onChange={(v) => update((p) => ({ ...p, goals: p.goals.map((x) => x.id === g.id ? { ...x, name: v } : x) }))} />
            <Num compact placeholder="Target amount" value={g.targetAmount} onChange={(v) => update((p) => ({ ...p, goals: p.goals.map((x) => x.id === g.id ? { ...x, targetAmount: v } : x) }))} />
            <Num compact placeholder="Target year" value={g.targetYear} step={1} onChange={(v) => update((p) => ({ ...p, goals: p.goals.map((x) => x.id === g.id ? { ...x, targetYear: v } : x) }))} />
            <Num compact placeholder="Saved so far" value={g.saved} onChange={(v) => update((p) => ({ ...p, goals: p.goals.map((x) => x.id === g.id ? { ...x, saved: v } : x) }))} />
          </RowShell>
        ))}
      </div>
    </div>
  );
}

function AddBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent"
    >
      <Plus className="h-3.5 w-3.5" /> Add
    </button>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function RowShell({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-end gap-2 rounded-lg border border-border p-3">
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr_1fr]">{children}</div>
      <button onClick={onDelete} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function Txt({ label, value, onChange, compact, placeholder, help }: { label?: string; value: string; onChange: (v: string) => void; compact?: boolean; placeholder?: string; help?: string }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>}
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={(label ? "mt-1.5 " : "") + "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" + (compact ? " py-1.5" : "")}
      />
      {help && <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{help}</span>}
    </label>
  );
}

function Num({ label, value, onChange, step = 1000, compact, suffix, placeholder, help, min }: { label?: string; value: number; onChange: (v: number) => void; step?: number; compact?: boolean; suffix?: string; placeholder?: string; help?: string; min?: number }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>}
      <div className="relative">
        <input
          type="number"
          step={step}
          min={min}
          value={value === 0 ? "" : value}
          placeholder={placeholder ?? "0"}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={(label ? "mt-1.5 " : "") + "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" + (compact ? " py-1.5" : "") + (suffix ? " pr-8" : "")}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
      {help && <span className="mt-1 block text-[11px] leading-snug text-muted-foreground">{help}</span>}
    </label>
  );
}
