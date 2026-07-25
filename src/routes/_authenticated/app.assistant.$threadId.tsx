import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getThread, useThreads } from "@/lib/threads-store";
import { useProfile } from "@/lib/finance-store";
import { computeMetrics } from "@/lib/finance-calc";
import { Send, User, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/assistant/$threadId")({
  component: Chat,
});

function Chat() {
  const { threadId } = Route.useParams();
  const [profile] = useProfile();
  const metrics = useMemo(() => computeMetrics(profile), [profile]);
  const { save } = useThreads();
  const [initialMessages, setInitialMessages] = useState<UIMessage[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getThread(threadId);
    setInitialMessages(t?.messages ?? []);
    setReady(true);
  }, [threadId]);

  if (!ready) return <div className="flex-1" />;
  return (
    <ChatInner
      key={threadId}
      threadId={threadId}
      initialMessages={initialMessages}
      profile={profile}
      metrics={metrics}
      onPersist={(msgs) => save(threadId, msgs)}
    />
  );
}

function ChatInner({
  threadId, initialMessages, profile, metrics, onPersist,
}: {
  threadId: string;
  initialMessages: UIMessage[];
  profile: unknown;
  metrics: unknown;
  onPersist: (msgs: UIMessage[]) => void;
}) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { profile, metrics },
      }),
    [profile, metrics],
  );

  const { messages, sendMessage, status, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Store onPersist safely
  const onPersistRef = useRef(onPersist);
  useEffect(() => { onPersistRef.current = onPersist; }, [onPersist]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  useEffect(() => {
    // ONLY save when the stream is fully finished or idle.
    // Saving during streaming causes React 19 to crash with "Maximum update depth"
    // because Groq streams so fast it overwhelms the global state dispatcher.
    if (status === "ready" && messages.length > 0) {
      onPersistRef.current(messages);
    }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const busy = status === "submitted" || status === "streaming";

  const submit = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    await sendMessage({ text });
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Start by asking about a decision, a goal, or how to improve your score.
            </div>
          )}
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          {status === "submitted" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse text-gold" /> Thinking...
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {error.message || "Something went wrong."}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-border bg-background/60 p-4 backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-soft focus-within:border-gold"
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
            rows={1}
            placeholder="Ask about a decision, goal, or 'how am I doing?'"
            className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-40"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  return (
    <div className={"flex gap-3 " + (isUser ? "flex-row-reverse" : "")}>
      <div className={isUser ? "max-w-[80%] rounded-2xl bg-primary px-4 py-2.5 text-sm text-primary-foreground shadow-soft" : "max-w-[85%] text-sm text-foreground"}>
        {isUser ? (
          <p className="whitespace-pre-wrap">{text}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:font-serif prose-headings:text-primary prose-strong:text-primary prose-a:text-gold">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
