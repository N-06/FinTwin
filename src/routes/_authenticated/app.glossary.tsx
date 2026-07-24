import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/glossary")({
  head: () => ({
    meta: [
      { title: "Glossary — FinTwin" },
      { name: "description", content: "Plain-English definitions of every metric, chart, and score used in FinTwin." },
      { property: "og:title", content: "Glossary — FinTwin" },
      { property: "og:description", content: "Understand your Financial Health Score, savings rate, DTI, cash flow, and every chart on your dashboard." },
    ],
  }),
  component: Glossary,
});

type Entry = { term: string; short: string; long: string; formula?: string; good?: string };

const METRICS: Entry[] = [
  {
    term: "Financial Health Score",
    short: "A 0–100 score that summarizes your overall money health.",
    long: "Predicted by a machine-learning model trained on the CFPB Financial Well-Being Survey. It combines savings rate, debt load, emergency cushion, net worth vs income, and investing rate into a single number so you can track progress over time.",
    good: "80+ Excellent · 65–79 Strong · 50–64 Fair · 35–49 Needs work · <35 At risk",
  },
  {
    term: "Net Worth",
    short: "Everything you own minus everything you owe.",
    long: "Assets include savings, emergency fund, and investments. Liabilities are the outstanding balances on your loans. A rising net worth over time is the clearest sign of financial progress.",
    formula: "Net Worth = (Savings + Emergency Fund + Investments) − Loan Balances",
  },
  {
    term: "Savings Rate",
    short: "The percentage of your monthly income you keep instead of spend.",
    long: "Includes what you deliberately save or invest each month. A higher rate means faster progress toward goals and more resilience if income drops.",
    formula: "Savings Rate = (Monthly Investing/Saving ÷ Total Monthly Income) × 100",
    good: "20%+ is strong, 10–20% is decent, <10% leaves little room to grow wealth.",
  },
  {
    term: "Debt-to-Income (DTI)",
    short: "How much of your monthly income goes to loan EMIs.",
    long: "Lenders use this to decide if you can take on more debt. Lower is safer; higher DTI means most of your paycheck is already promised to loans before you spend on anything else.",
    formula: "DTI = (Total Monthly EMIs ÷ Total Monthly Income) × 100",
    good: "Under 35% is healthy. Above 43% typically blocks new loans.",
  },
  {
    term: "Emergency Fund (months)",
    short: "How many months of expenses your emergency cash could cover.",
    long: "The buffer that keeps a job loss, medical bill, or big repair from turning into debt. Kept in a liquid, safe account — not invested.",
    formula: "Months = Emergency Fund ÷ Total Monthly Expenses",
    good: "3 months is the minimum, 6 months is comfortable, 9–12 months for variable income.",
  },
  {
    term: "Monthly Cash Flow",
    short: "What's left each month after expenses, EMIs, and investing.",
    long: "A positive number (surplus) means you can save more or accelerate goals. A negative number (deficit) means you're drawing down savings or adding debt to cover the month.",
    formula: "Cash Flow = Income − Expenses − Loan EMIs − Investing",
  },
  {
    term: "Net-Worth-to-Income",
    short: "Your net worth expressed as a multiple of your annual income.",
    long: "A benchmark of wealth-building progress relative to what you earn. Grows naturally with age; a common rule of thumb is 1× by 30, 3× by 40, 6× by 50.",
    formula: "Ratio = Net Worth ÷ (Monthly Income × 12)",
  },
  {
    term: "Investment Rate",
    short: "Portion of income actively invested for the long term.",
    long: "Different from total savings rate — this isolates money going into growth assets like mutual funds, stocks, or retirement accounts, which historically outpace inflation.",
    formula: "Investment Rate = Monthly Investing ÷ Total Monthly Income",
  },
  {
    term: "Inflation Assumption",
    short: "The yearly rise in prices you expect over the long run.",
    long: "Used to convert future rupees into today's purchasing power in projections. India's long-run average is ~6%; the US is closer to 3%. Higher inflation makes future goals more expensive.",
  },
];

const CHARTS: Entry[] = [
  {
    term: "How you compare (Percentile bars)",
    short: "Where you rank vs a similar age × income cohort.",
    long: "Each bar shows your value and what percentile it falls into for people in your cohort (e.g. 25–34, ₹3–8L income). 70th percentile means you're doing better than 70% of that group. For Debt-to-Income the scale is inverted — lower debt is better.",
  },
  {
    term: "Monthly cash flow (rows)",
    short: "Where your money goes each month.",
    long: "Income at the top, then everything that leaves — expenses, loan EMIs, and money you route into savings/investments. The bottom row is free cash: what's left unassigned.",
  },
  {
    term: "Expense mix (donut)",
    short: "Which categories eat the biggest share of your spending.",
    long: "Each slice is one recurring category you entered. Use it to spot the 1–2 categories worth trimming for the biggest impact.",
  },
  {
    term: "20-year projection (area chart)",
    short: "Where your net worth and investments could land over time.",
    long: "Compounds your current investing rate at your expected returns, adjusts for inflation, and pays down loans on schedule. It's a directional forecast, not a promise — use the Simulator to test how life changes shift the curve.",
  },
  {
    term: "Asset composition (donut)",
    short: "How your total assets split between cash and investments.",
    long: "Too much in cash means inflation eats your buying power; too little means no safety net. A healthy mix depends on your age, goals, and risk tolerance.",
  },
  {
    term: "Top drivers (Health Score card)",
    short: "Which inputs are pushing your score up or down the most.",
    long: "Green bars help your score, red bars hurt it. Focus improvements on the biggest red bars for the fastest gain.",
  },
];

function Glossary() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/app" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>
      <header className="mt-4">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-xs font-medium text-primary">
          <BookOpen className="h-3 w-3 text-gold" /> Glossary
        </span>
        <h1 className="mt-3 font-serif text-4xl text-primary">Every term, in plain English.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          What each metric means, how it's calculated, and what a healthy number looks like.
        </p>
      </header>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Scores & metrics</h2>
        <div className="mt-4 grid gap-4">
          {METRICS.map((e) => <Card key={e.term} entry={e} />)}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Charts on your dashboard</h2>
        <div className="mt-4 grid gap-4">
          {CHARTS.map((e) => <Card key={e.term} entry={e} />)}
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Something still unclear? Ask the <Link to="/app/assistant" className="font-medium text-primary hover:text-gold">AI Assistant</Link> — it explains any number using your own data.
      </p>
    </div>
  );
}

function Card({ entry }: { entry: Entry }) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h3 className="font-serif text-xl text-primary">{entry.term}</h3>
      <p className="mt-1 text-sm font-medium text-primary/80">{entry.short}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entry.long}</p>
      {entry.formula && (
        <p className="mt-3 rounded-lg bg-accent/60 px-3 py-2 font-mono text-xs text-primary">{entry.formula}</p>
      )}
      {entry.good && (
        <p className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider text-gold">Healthy range · </span>{entry.good}
        </p>
      )}
    </article>
  );
}
