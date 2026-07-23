/**
 * In-app inference of the Financial Health Score.
 *
 * The coefficients in `model.json` were fit against the CFPB Financial
 * Well-Being Survey (see `ml/README.md`). Preprocessing here mirrors the
 * standardization applied during training. The scorer is fully offline —
 * no network round-trip per prediction.
 *
 * Re-run `python ml/train.py` to regenerate `ml/artifacts/*.json`; those
 * artifacts are the source of truth for what runs here.
 */
import model from "../../ml/artifacts/model.json";
import benchmarks from "../../ml/artifacts/benchmarks.json";
import type { FinanceProfile } from "./finance-types";

type ModelSpec = {
  version: string;
  intercept: number;
  features: { name: string; mean: number; std: number; weight: number }[];
};

type Benchmarks = {
  version: string;
  cohorts: Array<{
    ageBand: string;
    incomeBand: string;
    percentiles: { savingsRate: number[]; dti: number[]; emergencyMonths: number[]; healthScore: number[] };
  }>;
};

const M = model as ModelSpec;
const B = benchmarks as Benchmarks;

export interface EngineeredFeatures {
  savingsRate: number;
  dti: number;
  emergencyMonths: number;
  netWorthToIncome: number;
  expenseToIncome: number;
  investmentRate: number;
  age: number;
}

export function engineerFeatures(p: FinanceProfile): EngineeredFeatures {
  const income = Math.max(1, p.monthlyIncome + p.otherIncome);
  const expenses = p.expenses.reduce((s, e) => s + e.amount, 0);
  const emi = p.loans.reduce((s, l) => s + l.emi, 0);
  const investments = p.investments.reduce((s, i) => s + i.amount, 0);
  const debts = p.loans.reduce((s, l) => s + l.balance, 0);
  const netWorth = p.savings + p.emergencyFund + investments - debts;

  return {
    savingsRate: ((p.monthlyContribution + Math.max(0, income - expenses - emi - p.monthlyContribution)) / income) * 100,
    dti: (emi / income) * 100,
    emergencyMonths: expenses > 0 ? p.emergencyFund / expenses : 0,
    netWorthToIncome: netWorth / (income * 12),
    expenseToIncome: expenses / income,
    investmentRate: p.monthlyContribution / income,
    age: p.age || 30,
  };
}

export interface Prediction {
  score: number;
  drivers: { name: string; label: string; contribution: number; value: number }[];
}

const FEATURE_LABELS: Record<string, string> = {
  savingsRate: "Savings rate",
  dti: "Debt-to-income",
  emergencyMonths: "Emergency fund coverage",
  netWorthToIncome: "Net worth vs. income",
  expenseToIncome: "Spending vs. income",
  investmentRate: "Investing rate",
  age: "Life stage",
};

export function predictScore(p: FinanceProfile): Prediction {
  const feats = engineerFeatures(p);
  const raw: Record<string, number> = feats as unknown as Record<string, number>;

  let score = M.intercept;
  const contribs: Prediction["drivers"] = [];
  for (const f of M.features) {
    const v = raw[f.name] ?? 0;
    const z = (v - f.mean) / (f.std || 1);
    const c = z * f.weight;
    score += c;
    contribs.push({
      name: f.name,
      label: FEATURE_LABELS[f.name] ?? f.name,
      contribution: c,
      value: v,
    });
  }
  score = Math.max(0, Math.min(100, score));
  contribs.sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  return { score, drivers: contribs };
}

export function cohortFor(p: FinanceProfile) {
  const income = (p.monthlyIncome + p.otherIncome) * 12;
  const ageBand =
    p.age < 25 ? "18-24" : p.age < 35 ? "25-34" : p.age < 45 ? "35-44" : p.age < 55 ? "45-54" : "55+";
  const incomeBand =
    income < 300000 ? "<3L" : income < 800000 ? "3-8L" : income < 2000000 ? "8-20L" : "20L+";
  return (
    B.cohorts.find((c) => c.ageBand === ageBand && c.incomeBand === incomeBand) ??
    B.cohorts[0]
  );
}

/** Return percentile (0-100) for `value` in the given cohort's distribution. */
export function percentileIn(distribution: number[], value: number): number {
  if (!distribution.length) return 50;
  let below = 0;
  for (const v of distribution) if (v <= value) below++;
  return Math.round((below / distribution.length) * 100);
}

export const MODEL_VERSION = M.version;
export const BENCHMARKS_VERSION = B.version;
