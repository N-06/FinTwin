export interface Expense {
  id: string;
  category: string;
  amount: number; // monthly
}

export interface Investment {
  id: string;
  name: string;
  amount: number; // current value
  expectedReturn: number; // % annual
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  emi: number; // monthly
  interestRate: number; // % annual
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  targetYear: number;
  saved: number;
}

export interface FinanceProfile {
  name: string;
  age: number;
  currency: "INR" | "USD" | "EUR";
  monthlyIncome: number;
  otherIncome: number;
  expenses: Expense[];
  savings: number; // liquid savings
  emergencyFund: number;
  investments: Investment[];
  loans: Loan[];
  goals: Goal[];
  monthlyContribution: number; // to investments/savings
  inflationRate: number;
}

export const DEFAULT_PROFILE: FinanceProfile = {
  name: "",
  age: 28,
  currency: "INR",
  monthlyIncome: 80000,
  otherIncome: 0,
  expenses: [
    { id: "e1", category: "Rent", amount: 18000 },
    { id: "e2", category: "Food", amount: 8000 },
    { id: "e3", category: "Transport", amount: 4000 },
    { id: "e4", category: "Utilities", amount: 3000 },
    { id: "e5", category: "Entertainment", amount: 3000 },
  ],
  savings: 120000,
  emergencyFund: 80000,
  investments: [
    { id: "i1", name: "Mutual Funds", amount: 250000, expectedReturn: 12 },
    { id: "i2", name: "Stocks", amount: 150000, expectedReturn: 14 },
  ],
  loans: [
    { id: "l1", name: "Personal Loan", balance: 200000, emi: 8000, interestRate: 11 },
  ],
  goals: [
    { id: "g1", name: "Buy a Home", targetAmount: 5000000, targetYear: new Date().getFullYear() + 7, saved: 400000 },
    { id: "g2", name: "Retirement", targetAmount: 20000000, targetYear: new Date().getFullYear() + 30, saved: 400000 },
  ],
  monthlyContribution: 15000,
  inflationRate: 6,
};

export interface Scenario {
  id: string;
  label: string;
  incomeDelta?: number; // absolute change to monthly income
  incomeMultiplier?: number; // 0 = job loss
  expenseDelta?: number;
  expenseMultiplier?: number;
  extraSavings?: number;
  newLoanEmi?: number;
  newLoanBalance?: number;
  inflationDelta?: number;
  oneTimeExpense?: number;
}
