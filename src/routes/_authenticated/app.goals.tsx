import { createFileRoute } from "@tanstack/react-router";
import { useProfile, formatCurrency } from "@/lib/finance-store";
import { Plus, Trash2 } from "lucide-react";
import type { Goal } from "@/lib/finance-types";

export const Route = createFileRoute("/_authenticated/app/goals")({
  head: () => ({
    meta: [
      { title: "Goals — FinTwin" },
      { name: "description", content: "Track your financial goals and progress." },
      { property: "og:title", content: "Goals — FinTwin" },
      { property: "og:description", content: "Track your financial goals and progress." },
    ],
  }),
  component: Goals,
});

function Goals() {
  const [profile, update] = useProfile();
  const cur = profile.currency;

  const add = () => {
    const g: Goal = {
      id: `g_${Date.now().toString(36)}`,
      name: "",
      targetAmount: 0,
      targetYear: new Date().getFullYear() + 5,
      saved: 0,
    };
    update((p) => ({ ...p, goals: [...p.goals, g] }));
  };

  const remove = (id: string) => update((p) => ({ ...p, goals: p.goals.filter((g) => g.id !== id) }));
  const patch = (id: string, patch: Partial<Goal>) =>
    update((p) => ({ ...p, goals: p.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-gold">Life goals</p>
          <h1 className="mt-1 font-serif text-4xl text-primary">Where you're headed.</h1>
        </div>
        <button
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
        >
          <Plus className="h-4 w-4" /> Add goal
        </button>
      </header>

      <div className="mt-8 space-y-4">
        {profile.goals.map((g) => {
          const pct = Math.min(100, (g.saved / Math.max(1, g.targetAmount)) * 100);
          const yearsLeft = g.targetYear - new Date().getFullYear();
          const monthly = yearsLeft > 0 ? (g.targetAmount - g.saved) / (yearsLeft * 12) : 0;
          return (
            <div key={g.id} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <input
                  value={g.name}
                  placeholder="Goal name"
                  onChange={(e) => patch(g.id, { name: e.target.value })}
                  className="min-w-0 flex-1 border-none bg-transparent font-serif text-2xl text-primary placeholder:text-muted-foreground/50 focus:outline-none"
                />
                <button
                  onClick={() => remove(g.id)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Remove goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <NumField label="Target amount" value={g.targetAmount} onChange={(v) => patch(g.id, { targetAmount: v })} />
                <NumField label="Target year" value={g.targetYear} onChange={(v) => patch(g.id, { targetYear: v })} step={1} />
                <NumField label="Already saved" value={g.saved} onChange={(v) => patch(g.id, { saved: v })} />
              </div>
              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(g.saved, cur)} of {formatCurrency(g.targetAmount, cur)}</span>
                  <span className="font-medium text-primary">{pct.toFixed(0)}%</span>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full bg-gradient-gold transition-all" style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {yearsLeft > 0 ? (
                    <>Save <span className="font-semibold text-primary">{formatCurrency(monthly, cur)}/mo</span> for {yearsLeft} years to hit this goal.</>
                  ) : (
                    <>Target year has passed. Update the year to keep tracking.</>
                  )}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, step = 10000 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        step={step}
        value={value === 0 ? "" : value}
        placeholder="0"
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="mt-1.5 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30"
      />
    </label>
  );
}
