import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, LineChart, Sparkles, Target, Shield, Wand2, FileText, Brain, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/hooks/useTheme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinTwin — Your AI Financial Twin" },
      { name: "description", content: "Build a digital twin of your financial life. Simulate life decisions, see an ML-derived Financial Health Score, and get AI guidance." },
      { property: "og:title", content: "FinTwin — Your AI Financial Twin" },
      { property: "og:description", content: "Build a digital twin of your financial life. ML-scored, AI-guided, private to you." },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setSignedIn(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s?.user));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-surface text-foreground">
      <Nav signedIn={signedIn} />
      <Hero signedIn={signedIn} />
      <Features />
      <ModelStrip />
      <CTA signedIn={signedIn} />
      <Footer />
    </div>
  );
}

function Nav({ signedIn }: { signedIn: boolean | null }) {
  const { isDark, toggle } = useTheme();
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-soft">
            <span className="font-serif text-sm tracking-tight text-gold">ft.</span>
          </div>
          <span className="font-serif text-2xl tracking-tight text-primary">FinTwin</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-primary">Features</a>
          <a href="#model" className="hover:text-primary">How it scores</a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {signedIn ? (
            <Link
              to="/app"
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
            >
              Open dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link to="/auth" className="hidden rounded-full px-3 py-2 text-sm font-medium text-primary hover:bg-accent md:inline-flex">
                Sign in
              </Link>
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
              >
                Get started <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Hero({ signedIn }: { signedIn: boolean | null }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-16 pt-20 text-center md:pt-32">
        <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5 text-gold" /> AI + ML-powered personal finance
        </span>
        <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-primary md:text-7xl">
          Meet your
          <br />
          <span className="italic text-gold">financial twin.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          A living digital model of your money. Track net worth, simulate life's biggest what-ifs,
          and get an ML-derived Financial Health Score benchmarked against real survey data.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to={signedIn ? "/app" : "/auth"}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
          >
            {signedIn ? "Open my twin" : "Build my twin"} <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href="#model"
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-6 py-3 text-sm font-medium text-primary hover:bg-accent"
          >
            How the score works
          </a>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const items = [
    { icon: LineChart, title: "Financial Health Score", desc: "0–100 score from a model trained on the CFPB Financial Well-Being Survey." },
    { icon: Wand2, title: "What-If Simulator", desc: "Design any scenario — a raise, a car, a home loan — and see the impact instantly." },
    { icon: Sparkles, title: "AI Financial Assistant", desc: "Chat threads that know your numbers and explain them in plain language." },
    { icon: Target, title: "Goal Tracking", desc: "Set life goals and track your path to each." },
    { icon: Shield, title: "Emergency Coverage", desc: "See how many months your safety net covers if income stops today." },
    { icon: FileText, title: "Downloadable Report", desc: "Export a beautifully formatted snapshot of your full financial life." },
  ];
  return (
    <section id="features" className="border-t border-border/60 bg-background/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-gold">What's inside</p>
          <h2 className="mt-2 font-serif text-4xl text-primary">Everything your money needs, in one place.</h2>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-transform hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-primary">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-primary">{it.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ModelStrip() {
  return (
    <section id="model" className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl bg-gradient-hero p-10 text-primary-foreground dark:text-primary shadow-elegant">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/20">
              <Brain className="h-5 w-5 text-gold" />
            </div>
            <p className="text-xs font-medium uppercase tracking-widest text-gold">The model</p>
          </div>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl">
            Trained on real survey data, scored in your browser.
          </h2>
          <p className="mt-4 text-primary-foreground/80 dark:text-primary/80">
            Your Financial Health Score is produced by a gradient-boosted regressor trained on the
            CFPB Financial Well-Being Survey (~6,400 U.S. adults), then distilled into a compact
            model that runs offline in your browser. No numbers leave your device to be scored.
          </p>
          <ul className="mt-6 grid gap-3 text-sm text-primary-foreground/80 dark:text-primary/80 sm:grid-cols-2">
            <li>• Ensemble comparison: RandomForest · XGBoost · LightGBM · CatBoost</li>
            <li>• Hyperparameter tuning with Optuna</li>
            <li>• SHAP-based driver attribution per user</li>
            <li>• Cohort percentiles by age × income</li>
          </ul>
          <p className="mt-6 text-xs text-primary-foreground/60 dark:text-primary/60">
            Full pipeline reproducible with <code className="rounded bg-black/10 dark:bg-white/10 px-1 py-0.5">python ai/train.py</code>
          </p>
        </div>
      </div>
    </section>
  );
}

function CTA({ signedIn }: { signedIn: boolean | null }) {
  const nav = useNavigate();
  return (
    <section className="border-t border-border/60 py-20">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <h2 className="font-serif text-4xl text-primary">Ready to meet your twin?</h2>
        <p className="mt-3 text-muted-foreground">Free, private, and yours in under two minutes.</p>
        <button
          onClick={() => nav({ to: signedIn ? "/app" : "/auth" })}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
        >
          {signedIn ? "Open dashboard" : "Create my twin"} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
      @ 2026 FinTwin
    </footer>
  );
}
