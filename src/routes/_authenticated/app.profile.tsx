import { createFileRoute } from "@tanstack/react-router";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import type { Expense, Investment, Loan } from "@/lib/finance-types";
import { Plus, Trash2, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — FinTwin" },
      { name: "description", content: "Set up your income, expenses, savings, investments and loans." },
      { property: "og:title", content: "Profile — FinTwin" },
      { property: "og:description", content: "Set up your income, expenses, savings, investments and loans." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [profile, update, reset] = useProfile();
  const cur = profile.currency;

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Profile setup</p>
          <h1 className="mt-1 font-serif text-4xl text-primary">Your financial life.</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything below is saved locally in your browser.
          </p>
        </div>
        <button
          onClick={() => {
            if (confirm("Reset all data to defaults?")) reset();
          }}
          className="inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </header>

      <Section title="About you">
        <div className="grid gap-4 md:grid-cols-3">
          <TxtField label="Name" value={profile.name} onChange={(v) => update((p) => ({ ...p, name: v }))} />
          <NumField label="Age" value={profile.age} step={1} onChange={(v) => update((p) => ({ ...p, age: v }))} />
          <NumField label="Inflation (%)" value={profile.inflationRate} step={0.5} onChange={(v) => update((p) => ({ ...p, inflationRate: v }))} />
        </div>
      </Section>

      <Section title="Income">
        <div className="grid gap-4 md:grid-cols-2">
          <NumField label="Monthly salary" value={profile.monthlyIncome} onChange={(v) => update((p) => ({ ...p, monthlyIncome: v }))} />
          <NumField label="Other monthly income" value={profile.otherIncome} onChange={(v) => update((p) => ({ ...p, otherIncome: v }))} />
        </div>
      </Section>

      <Section title="Expenses (monthly)" action={
        <AddButton onClick={() =>
          update((p) => ({ ...p, expenses: [...p.expenses, { id: `e_${Date.now()}`, category: "New expense", amount: 1000 }] }))
        } />
      }>
        <div className="space-y-2">
          {profile.expenses.map((e) => (
            <ListRow key={e.id} onDelete={() => update((p) => ({ ...p, expenses: p.expenses.filter((x) => x.id !== e.id) }))}>
              <TxtField compact value={e.category} onChange={(v) => update((p) => ({ ...p, expenses: p.expenses.map((x) => x.id === e.id ? { ...x, category: v } as Expense : x) }))} />
              <NumField compact value={e.amount} onChange={(v) => update((p) => ({ ...p, expenses: p.expenses.map((x) => x.id === e.id ? { ...x, amount: v } as Expense : x) }))} />
            </ListRow>
          ))}
        </div>
        <p className="mt-3 text-right text-sm text-muted-foreground">
          Total: <span className="font-semibold text-primary">{formatCurrency(profile.expenses.reduce((s, e) => s + e.amount, 0), cur)}/mo</span>
        </p>
      </Section>

      <Section title="Savings">
        <div className="grid gap-4 md:grid-cols-3">
          <NumField label="Liquid savings" value={profile.savings} onChange={(v) => update((p) => ({ ...p, savings: v }))} />
          <NumField label="Emergency fund" value={profile.emergencyFund} onChange={(v) => update((p) => ({ ...p, emergencyFund: v }))} />
          <NumField label="Monthly investing / saving" value={profile.monthlyContribution} onChange={(v) => update((p) => ({ ...p, monthlyContribution: v }))} />
        </div>
      </Section>

      <Section title="Investments" action={
        <AddButton onClick={() =>
          update((p) => ({ ...p, investments: [...p.investments, { id: `i_${Date.now()}`, name: "New investment", amount: 10000, expectedReturn: 10 }] }))
        } />
      }>
        <div className="space-y-2">
          {profile.investments.map((i) => (
            <ListRow key={i.id} onDelete={() => update((p) => ({ ...p, investments: p.investments.filter((x) => x.id !== i.id) }))}>
              <TxtField compact value={i.name} onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, name: v } as Investment : x) }))} />
              <NumField compact value={i.amount} onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, amount: v } as Investment : x) }))} />
              <NumField compact value={i.expectedReturn} step={0.5} suffix="%" onChange={(v) => update((p) => ({ ...p, investments: p.investments.map((x) => x.id === i.id ? { ...x, expectedReturn: v } as Investment : x) }))} />
            </ListRow>
          ))}
        </div>
      </Section>

      <Section title="Loans" action={
        <AddButton onClick={() =>
          update((p) => ({ ...p, loans: [...p.loans, { id: `l_${Date.now()}`, name: "New loan", balance: 100000, emi: 5000, interestRate: 10 }] }))
        } />
      }>
        <div className="space-y-2">
          {profile.loans.map((l) => (
            <ListRow key={l.id} onDelete={() => update((p) => ({ ...p, loans: p.loans.filter((x) => x.id !== l.id) }))}>
              <TxtField compact value={l.name} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, name: v } as Loan : x) }))} />
              <NumField compact value={l.balance} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, balance: v } as Loan : x) }))} />
              <NumField compact value={l.emi} onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, emi: v } as Loan : x) }))} />
              <NumField compact value={l.interestRate} step={0.25} suffix="%" onChange={(v) => update((p) => ({ ...p, loans: p.loans.map((x) => x.id === l.id ? { ...x, interestRate: v } as Loan : x) }))} />
            </ListRow>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl text-primary">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background px-3 py-1.5 text-xs font-medium text-primary hover:bg-accent"
    >
      <Plus className="h-3.5 w-3.5" /> Add
    </button>
  );
}

function ListRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  return (
    <div className="flex items-end gap-2 rounded-lg border border-border p-3">
      <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_1fr]">{children}</div>
      <button
        onClick={onDelete}
        className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        aria-label="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function TxtField({ label, value, onChange, compact }: { label?: string; value: string; onChange: (v: string) => void; compact?: boolean }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          (label ? "mt-1.5 " : "") +
          "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" +
          (compact ? " py-1.5" : "")
        }
      />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1000, compact, suffix }: { label?: string; value: number; onChange: (v: number) => void; step?: number; compact?: boolean; suffix?: string }) {
  return (
    <label className="block">
      {label && <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>}
      <div className="relative">
        <input
          type="number"
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={
            (label ? "mt-1.5 " : "") +
            "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30" +
            (compact ? " py-1.5" : "") +
            (suffix ? " pr-8" : "")
          }
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}
