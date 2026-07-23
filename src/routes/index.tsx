import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, LineChart, Sparkles, Target, Shield, Wand2, FileText } from "lucide-react";
import heroImg from "@/assets/fintwin-hero.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinTwin — Your AI Financial Twin" },
      { name: "description", content: "Build a digital twin of your financial life. Simulate life decisions, see your Financial Health Score, and get AI guidance instantly." },
      { property: "og:title", content: "FinTwin — Your AI Financial Twin" },
      { property: "og:description", content: "Build a digital twin of your financial life. Simulate life decisions, see your Financial Health Score, and get AI guidance." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-gradient-surface text-foreground">
      <Nav />
      <Hero />
      <Features />
      <ScenarioStrip />
      <CTA />
      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-soft">
            <span className="font-serif text-lg text-gold">F</span>
          </div>
          <span className="font-serif text-2xl tracking-tight text-primary">FinTwin</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#features" className="hover:text-primary">Features</a>
          <a href="#simulator" className="hover:text-primary">Simulator</a>
          <a href="#assistant" className="hover:text-primary">AI Assistant</a>
        </nav>
        <Link
          to="/app"
          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft transition-all hover:shadow-elegant"
        >
          Launch app <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 pb-16 pt-20 md:grid-cols-2 md:pt-28">
        <div className="flex flex-col justify-center">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 text-gold" /> AI-powered personal finance
          </span>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] text-primary md:text-7xl">
            Meet your
            <br />
            <span className="italic text-gold">financial twin.</span>
          </h1>
          <p className="mt-6 max-w-lg text-lg text-muted-foreground">
            A living digital model of your money. Track your net worth, simulate life's biggest
            what-ifs, and get AI-powered guidance — all in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
            >
              Build my twin <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/app/simulator"
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-accent"
            >
              Try the simulator
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-6 text-sm">
            <Stat k="6+" v="Health metrics" />
            <Stat k="10+" v="Life scenarios" />
            <Stat k="24/7" v="AI guidance" />
          </div>
        </div>
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-8 rounded-3xl bg-gradient-hero opacity-10 blur-3xl" />
          <img
            src={heroImg}
            alt="Illustrated financial twin — silhouette filled with charts, coins, and light"
            width={1600}
            height={1200}
            className="relative w-full max-w-lg animate-float rounded-2xl"
          />
        </div>
      </div>
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="font-serif text-3xl text-primary">{k}</div>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{v}</div>
    </div>
  );
}

function Features() {
  const items = [
    { icon: LineChart, title: "Financial Health Score", desc: "One number that captures your complete financial picture across 5 dimensions." },
    { icon: Wand2, title: "What-If Simulator", desc: "Buy a car, lose a job, get a raise — instantly see how it changes your future." },
    { icon: Sparkles, title: "AI Financial Assistant", desc: "Chat with an assistant that knows your numbers and answers in plain language." },
    { icon: Target, title: "Goal Tracking", desc: "Set life goals — a home, retirement, a sabbatical — and track your path to each." },
    { icon: Shield, title: "Emergency Coverage", desc: "See exactly how many months your safety net will last if income stops today." },
    { icon: FileText, title: "Downloadable Report", desc: "Export a beautifully formatted snapshot of your full financial life." },
  ];
  return (
    <section id="features" className="border-t border-border bg-background py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-widest text-gold">Everything you need</p>
          <h2 className="mt-3 font-serif text-4xl text-primary md:text-5xl">
            Your money, understood.
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.title}
              className="group rounded-2xl border border-border bg-card p-7 shadow-soft transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <it.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-primary">{it.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScenarioStrip() {
  const scenarios = [
    "What if I buy a car?",
    "What if I lose my job?",
    "What if I get a 20% raise?",
    "What if inflation hits 10%?",
    "What if I save ₹10,000 more?",
    "What if I take a home loan?",
  ];
  return (
    <section id="simulator" className="relative overflow-hidden bg-gradient-hero py-24 text-primary-foreground">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-sm font-medium uppercase tracking-widest text-gold">What-If Simulator</p>
        <h2 className="mt-3 max-w-3xl font-serif text-4xl md:text-6xl">
          Rehearse your <span className="italic text-gold">future decisions</span> before you make them.
        </h2>
        <div className="mt-12 flex flex-wrap gap-3">
          {scenarios.map((s) => (
            <span
              key={s}
              className="rounded-full border border-gold/30 bg-white/5 px-4 py-2 text-sm backdrop-blur transition-colors hover:bg-white/10"
            >
              {s}
            </span>
          ))}
        </div>
        <Link
          to="/app/simulator"
          className="mt-12 inline-flex items-center gap-2 rounded-full bg-gradient-gold px-6 py-3 text-sm font-semibold text-primary shadow-gold transition-transform hover:-translate-y-0.5"
        >
          Try a scenario <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="assistant" className="bg-background py-24">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-surface p-12 text-center shadow-elegant">
        <h2 className="font-serif text-4xl text-primary md:text-5xl">
          Ready to meet your twin?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Set up your profile in under two minutes — no signup required. Everything lives in your browser.
        </p>
        <Link
          to="/app"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground shadow-elegant transition-transform hover:-translate-y-0.5"
        >
          Launch FinTwin <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-background py-10 text-sm text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-serif text-lg text-primary">FinTwin</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <p>Built for smarter financial decisions.</p>
      </div>
    </footer>
  );
}
