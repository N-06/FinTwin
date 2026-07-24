import { createFileRoute, redirect, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, ArrowRight, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { z } from "zod";

const searchSchema = z.object({ next: z.string().optional() });

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — FinTwin" },
      { name: "description", content: "Sign in or create a FinTwin account to build your financial twin." },
      { property: "og:title", content: "Sign in — FinTwin" },
      { property: "og:description", content: "Sign in or create your FinTwin account." },
    ],
  }),
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: search.next ?? "/app" });
  },
  component: AuthPage,
});

function AuthPage() {
  const search = useSearch({ from: "/auth" });
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const next = search.next ?? "/app";

  useEffect(() => setErr(null), [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        // Auto-confirm is on → session should exist. If somehow not, force sign-in.
        if (!data.session) {
          const { error: e2 } = await supabase.auth.signInWithPassword({ email, password });
          if (e2) throw e2;
        }
        if (name) {
          await supabase.from("profiles").upsert({ id: data.user!.id, name });
        }
        navigate({ to: "/app/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: next });
      }
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const { isDark, toggle } = useTheme();
  return (
    <div className="min-h-screen bg-gradient-surface">
      {/* Theme toggle — fixed top-right */}
      <button
        onClick={toggle}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        className="fixed right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-primary"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero shadow-soft">
            <span className="font-serif text-sm tracking-tight text-gold">ft.</span>
          </div>
          <span className="font-serif text-2xl text-primary">FinTwin</span>
        </Link>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-accent/50 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3 w-3 text-gold" />
            {mode === "signin" ? "Welcome back" : "Create your twin"}
          </span>
          <h1 className="mt-3 font-serif text-3xl text-primary">
            {mode === "signin" ? "Sign in." : "Sign up."}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signin" ? "Continue building your financial twin." : "Your data is private and stays in your account."}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label="Name">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  className="input"
                />
              </Field>
            )}
            <Field label="Email">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="input"
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="input"
              />
            </Field>

            {err && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="mt-6 w-full text-center text-sm text-muted-foreground hover:text-primary"
          >
            {mode === "signin"
              ? "New here? Create an account →"
              : "Already have an account? Sign in →"}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          margin-top: 0.375rem;
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid hsl(var(--input));
          background: hsl(var(--background));
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        .input:focus { border-color: hsl(var(--gold, 43 55% 52%)); box-shadow: 0 0 0 3px rgba(201,164,65,.2); }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
