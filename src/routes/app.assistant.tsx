import { createFileRoute, Link, Outlet, useNavigate, useParams, useRouterState } from "@tanstack/react-router";
import { useThreads } from "@/lib/threads-store";
import { Plus, MessageSquare, Trash2 } from "lucide-react";

export const Route = createFileRoute("/app/assistant")({
  head: () => ({
    meta: [
      { title: "AI Assistant — FinTwin" },
      { name: "description", content: "Chat with your AI financial assistant." },
      { property: "og:title", content: "AI Assistant — FinTwin" },
      { property: "og:description", content: "Chat with your AI financial assistant." },
    ],
  }),
  component: AssistantLayout,
});

function AssistantLayout() {
  const { threads, hydrated, create, remove } = useThreads();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = useParams({ strict: false }).threadId as string | undefined;

  const newThread = () => {
    const t = create();
    navigate({ to: "/app/assistant/$threadId", params: { threadId: t.id } });
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-0px)] max-w-7xl gap-0 px-0 md:h-screen md:px-6 md:py-6">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex md:rounded-l-2xl md:border">
        <div className="border-b border-border p-4">
          <button
            onClick={newThread}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:shadow-elegant"
          >
            <Plus className="h-4 w-4" /> New chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {hydrated && threads.length === 0 && (
            <p className="p-3 text-xs text-muted-foreground">No conversations yet.</p>
          )}
          {threads.map((t) => {
            const active = activeId === t.id;
            return (
              <div
                key={t.id}
                className={
                  "group mb-1 flex items-center gap-2 rounded-lg px-2 py-2 text-sm " +
                  (active ? "bg-accent text-primary" : "hover:bg-accent/50")
                }
              >
                <Link
                  to="/app/assistant/$threadId"
                  params={{ threadId: t.id }}
                  className="flex min-w-0 flex-1 items-center gap-2"
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-gold" />
                  <span className="truncate">{t.title || "New conversation"}</span>
                </Link>
                <button
                  onClick={() => {
                    remove(t.id);
                    if (active) navigate({ to: "/app/assistant" });
                  }}
                  className="rounded p-1 opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </aside>
      <section className="flex min-w-0 flex-1 flex-col border-border bg-card md:rounded-r-2xl md:border md:border-l-0">
        {pathname === "/app/assistant" ? <EmptyState onNew={newThread} /> : <Outlet />}
      </section>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  const prompts = [
    "Can I afford to buy a ₹10L car right now?",
    "How do I improve my Financial Health Score?",
    "What if I lose my job for 6 months?",
    "Am I saving enough for retirement?",
  ];
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-hero shadow-elegant">
        <span className="font-serif text-2xl text-gold">F</span>
      </div>
      <h2 className="mt-5 font-serif text-3xl text-primary">Ask your financial twin</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        I know your income, savings, debts and goals. Ask me anything — I'll answer in plain language.
      </p>
      <div className="mt-6 grid max-w-2xl gap-2 sm:grid-cols-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={onNew}
            className="rounded-xl border border-border bg-background p-4 text-left text-sm text-primary transition-colors hover:border-gold/40 hover:bg-accent"
          >
            {p}
          </button>
        ))}
      </div>
      <button
        onClick={onNew}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-elegant"
      >
        <Plus className="h-4 w-4" /> Start a conversation
      </button>
    </div>
  );
}
