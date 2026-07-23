import type { FinanceProfile, Scenario } from "./finance-types";

export interface Metrics {
  totalIncome: number;
  totalExpenses: number;
  totalEmi: number;
  monthlyCashflow: number;
  savingsRate: number; // %
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  debtToIncome: number; // %
  emergencyMonths: number;
  healthScore: number; // 0-100
  scoreBreakdown: { label: string; score: number; weight: number }[];
}

export function computeMetrics(p: FinanceProfile): Metrics {
  const totalIncome = p.monthlyIncome + p.otherIncome;
  const totalExpenses = p.expenses.reduce((s, e) => s + e.amount, 0);
  const totalEmi = p.loans.reduce((s, l) => s + l.emi, 0);
  const monthlyCashflow = totalIncome - totalExpenses - totalEmi - p.monthlyContribution;

  const savingsRate = totalIncome > 0 ? ((p.monthlyContribution + Math.max(0, monthlyCashflow)) / totalIncome) * 100 : 0;

  const totalAssets = p.savings + p.emergencyFund + p.investments.reduce((s, i) => s + i.amount, 0);
  const totalLiabilities = p.loans.reduce((s, l) => s + l.balance, 0);
  const netWorth = totalAssets - totalLiabilities;

  const debtToIncome = totalIncome > 0 ? (totalEmi / totalIncome) * 100 : 0;
  const emergencyMonths = totalExpenses > 0 ? p.emergencyFund / totalExpenses : 0;

  // Health score components (each 0-100)
  const sSavings = clamp((savingsRate / 30) * 100); // 30% target
  const sDti = clamp(100 - (debtToIncome / 40) * 100); // <40% good
  const sEmergency = clamp((emergencyMonths / 6) * 100);
  const sNetWorth = clamp(((netWorth / Math.max(1, totalIncome * 12)) / 3) * 100); // 3x annual income target
  const sCashflow = clamp(50 + (monthlyCashflow / Math.max(1, totalIncome)) * 200);

  const breakdown = [
    { label: "Savings Rate", score: sSavings, weight: 0.25 },
    { label: "Debt-to-Income", score: sDti, weight: 0.20 },
    { label: "Emergency Fund", score: sEmergency, weight: 0.20 },
    { label: "Net Worth", score: sNetWorth, weight: 0.20 },
    { label: "Cashflow", score: sCashflow, weight: 0.15 },
  ];
  const healthScore = breakdown.reduce((s, b) => s + b.score * b.weight, 0);

  return {
    totalIncome, totalExpenses, totalEmi, monthlyCashflow, savingsRate,
    totalAssets, totalLiabilities, netWorth, debtToIncome, emergencyMonths,
    healthScore, scoreBreakdown: breakdown,
  };
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n));
}

export function applyScenario(p: FinanceProfile, s: Scenario): FinanceProfile {
  const income = ((p.monthlyIncome + (s.incomeDelta ?? 0)) * (s.incomeMultiplier ?? 1));
  const expensesMult = s.expenseMultiplier ?? 1;
  const expenses = p.expenses.map((e) => ({ ...e, amount: e.amount * expensesMult + (s.expenseDelta ? s.expenseDelta / p.expenses.length : 0) }));
  const loans = [...p.loans];
  if (s.newLoanEmi && s.newLoanBalance) {
    loans.push({ id: "sim-loan", name: "New Loan", emi: s.newLoanEmi, balance: s.newLoanBalance, interestRate: 10 });
  }
  return {
    ...p,
    monthlyIncome: Math.max(0, income),
    expenses,
    loans,
    monthlyContribution: Math.max(0, p.monthlyContribution + (s.extraSavings ?? 0)),
    inflationRate: p.inflationRate + (s.inflationDelta ?? 0),
    savings: Math.max(0, p.savings - (s.oneTimeExpense ?? 0)),
  };
}

export interface ProjectionPoint {
  year: number;
  netWorth: number;
  savings: number;
  investments: number;
}

export function projectFuture(p: FinanceProfile, years = 20): ProjectionPoint[] {
  const points: ProjectionPoint[] = [];
  const m = computeMetrics(p);
  let savings = p.savings + p.emergencyFund;
  let invBalances = p.investments.map((i) => ({ amt: i.amount, r: i.expectedReturn / 100 }));
  let loanBalance = p.loans.reduce((s, l) => s + l.balance, 0);
  const monthlyInv = p.monthlyContribution;
  const inflation = p.inflationRate / 100;

  for (let y = 0; y <= years; y++) {
    const totalInv = invBalances.reduce((s, i) => s + i.amt, 0);
    points.push({
      year: new Date().getFullYear() + y,
      netWorth: Math.round(savings + totalInv - Math.max(0, loanBalance)),
      savings: Math.round(savings),
      investments: Math.round(totalInv),
    });
    // grow
    savings += Math.max(0, m.monthlyCashflow) * 12;
    invBalances = invBalances.map((i) => ({ ...i, amt: i.amt * (1 + i.r) + monthlyInv * 12 / invBalances.length }));
    loanBalance = Math.max(0, loanBalance - p.loans.reduce((s, l) => s + l.emi * 12 * 0.6, 0)); // rough principal
    // inflation adjusts expenses implicitly; not applied to keep nominal
    void inflation;
  }
  return points;
}
