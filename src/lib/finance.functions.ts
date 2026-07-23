import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { EMPTY_PROFILE, type FinanceProfile } from "./finance-types";

export const loadProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<FinanceProfile> => {
    const { supabase, userId } = context;
    const [p, f, ex, inv, ln, g] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("financials").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("expenses").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("investments").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("loans").select("*").eq("user_id", userId).order("created_at"),
      supabase.from("goals").select("*").eq("user_id", userId).order("created_at"),
    ]);
    return {
      ...EMPTY_PROFILE,
      name: p.data?.name ?? "",
      age: p.data?.age ?? 0,
      currency: (p.data?.currency as FinanceProfile["currency"]) ?? "INR",
      inflationRate: Number(p.data?.inflation_rate ?? 6),
      onboardingComplete: !!p.data?.onboarding_complete,
      monthlyIncome: Number(f.data?.monthly_income ?? 0),
      otherIncome: Number(f.data?.other_income ?? 0),
      savings: Number(f.data?.savings ?? 0),
      emergencyFund: Number(f.data?.emergency_fund ?? 0),
      monthlyContribution: Number(f.data?.monthly_contribution ?? 0),
      expenses: (ex.data ?? []).map((r) => ({ id: r.id, category: r.category, amount: Number(r.amount) })),
      investments: (inv.data ?? []).map((r) => ({
        id: r.id, name: r.name, amount: Number(r.amount), expectedReturn: Number(r.expected_return),
      })),
      loans: (ln.data ?? []).map((r) => ({
        id: r.id, name: r.name, balance: Number(r.balance), emi: Number(r.emi), interestRate: Number(r.interest_rate),
      })),
      goals: (g.data ?? []).map((r) => ({
        id: r.id, name: r.name, targetAmount: Number(r.target_amount), targetYear: r.target_year, saved: Number(r.saved),
      })),
    };
  });

export const syncProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: FinanceProfile) => data)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    await supabase.from("profiles").upsert({
      id: userId,
      name: data.name,
      age: data.age || null,
      currency: data.currency,
      inflation_rate: data.inflationRate,
      onboarding_complete: data.onboardingComplete,
      updated_at: new Date().toISOString(),
    });

    await supabase.from("financials").upsert({
      user_id: userId,
      monthly_income: data.monthlyIncome,
      other_income: data.otherIncome,
      savings: data.savings,
      emergency_fund: data.emergencyFund,
      monthly_contribution: data.monthlyContribution,
      updated_at: new Date().toISOString(),
    });

    // Replace-all children — small tables, keeps client logic trivial.
    await Promise.all([
      supabase.from("expenses").delete().eq("user_id", userId),
      supabase.from("investments").delete().eq("user_id", userId),
      supabase.from("loans").delete().eq("user_id", userId),
      supabase.from("goals").delete().eq("user_id", userId),
    ]);

    if (data.expenses.length) {
      await supabase.from("expenses").insert(
        data.expenses.map((e) => ({ user_id: userId, category: e.category, amount: e.amount })),
      );
    }
    if (data.investments.length) {
      await supabase.from("investments").insert(
        data.investments.map((i) => ({
          user_id: userId, name: i.name, amount: i.amount, expected_return: i.expectedReturn,
        })),
      );
    }
    if (data.loans.length) {
      await supabase.from("loans").insert(
        data.loans.map((l) => ({
          user_id: userId, name: l.name, balance: l.balance, emi: l.emi, interest_rate: l.interestRate,
        })),
      );
    }
    if (data.goals.length) {
      await supabase.from("goals").insert(
        data.goals.map((g) => ({
          user_id: userId, name: g.name, target_amount: g.targetAmount,
          target_year: g.targetYear, saved: g.saved,
        })),
      );
    }
    return { ok: true };
  });

export const resetProfileFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await Promise.all([
      supabase.from("expenses").delete().eq("user_id", userId),
      supabase.from("investments").delete().eq("user_id", userId),
      supabase.from("loans").delete().eq("user_id", userId),
      supabase.from("goals").delete().eq("user_id", userId),
    ]);
    await supabase.from("financials").update({
      monthly_income: 0, other_income: 0, savings: 0, emergency_fund: 0, monthly_contribution: 0,
    }).eq("user_id", userId);
    await supabase.from("profiles").update({
      name: "", age: null, onboarding_complete: false,
    }).eq("id", userId);
    return { ok: true };
  });
