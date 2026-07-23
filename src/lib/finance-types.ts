export interface Expense {
  id: string;
  category: string;
  amount: number;
}

export interface Investment {
  id: string;
  name: string;
  amount: number;
  expectedReturn: number;
}

export interface Loan {
  id: string;
  name: string;
  balance: number;
  emi: number;
  interestRate: number;
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
  savings: number;
  emergencyFund: number;
  investments: Investment[];
  loans: Loan[];
  goals: Goal[];
  monthlyContribution: number;
  inflationRate: number;
  onboardingComplete: boolean;
}

// Empty profile — no fake numbers. Populated once the user enters data.
export const EMPTY_PROFILE: FinanceProfile = {
  name: "",
  age: 0,
  currency: "INR",
  monthlyIncome: 0,
  otherIncome: 0,
  expenses: [],
  savings: 0,
  emergencyFund: 0,
  investments: [],
  loans: [],
  goals: [],
  monthlyContribution: 0,
  inflationRate: 6,
  onboardingComplete: false,
};

export interface Scenario {
  id: string;
  label: string;
  incomeDelta?: number;
  incomeMultiplier?: number;
  expenseDelta?: number;
  expenseMultiplier?: number;
  extraSavings?: number;
  newLoanEmi?: number;
  newLoanBalance?: number;
  inflationDelta?: number;
  oneTimeExpense?: number;
}
