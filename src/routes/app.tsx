import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Wand2, Target, Sparkles, User, FileText } from "lucide-react";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "FinTwin — Dashboard" },
      { name: "description", content: "Your financial dashboard, simulator, goals and AI assistant." },
      { property: "og:title", content: "FinTwin — Dashboard" },
      { property: "og:description", content: "Your financial dashboard, simulator, goals and AI assistant." },
    ],
  }),
  component: AppLayout,
});

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };
const nav: NavItem[] = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/app/simulator", label: "Simulator", icon: Wand2 },
  { to: "/app/goals", label: "Goals", icon: Target },
  { to: "/app/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/app/profile", label: "Profile", icon: User },
  { to: "/app/report", label: "Report", icon: FileText },
];

function AppLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-gradient-surface md:flex">
        <Link to="/" className="flex items-center gap-2 px-6 py-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-hero">
            <span className="font-serif text-lg text-gold">F</span>
          </div>
          <span className="font-serif text-2xl text-primary">FinTwin</span>
        </Link>
        <nav className="flex flex-col gap-1 px-3">
          {nav.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors " +
                  (active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-accent hover:text-primary")
                }
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-4">
          <div className="rounded-xl bg-gradient-hero p-4 text-primary-foreground">
            <p className="text-xs uppercase tracking-widest text-gold">Tip</p>
            <p className="mt-1 text-sm">All data lives in your browser. No account needed.</p>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav pathname={pathname} />
        <main className="flex-1 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-1 overflow-x-auto border-b border-border bg-background/95 px-3 py-2 backdrop-blur md:hidden">
      {nav.map((n) => {
        const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            className={
              "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent")
            }
          >
            <n.icon className="h-3.5 w-3.5" />
            {n.label}
          </Link>
        );
      })}
    </div>
  );
}
