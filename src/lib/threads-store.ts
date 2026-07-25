import { useCallback, useEffect, useState } from "react";
import type { UIMessage } from "ai";

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: UIMessage[];
}

const KEY = "fintwin.threads.v1";

function readAll(): Thread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Thread[]) : [];
  } catch {
    return [];
  }
}

function writeAll(threads: Thread[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(threads));
  window.dispatchEvent(new Event("fintwin-threads"));
}

export function useThreads() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setThreads(readAll());
    setHydrated(true);
    const h = () => setThreads(readAll());
    window.addEventListener("fintwin-threads", h);
    return () => window.removeEventListener("fintwin-threads", h);
  }, []);

  const create = useCallback((): Thread => {
    const t: Thread = {
      id: `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      title: "New conversation",
      updatedAt: Date.now(),
      messages: [],
    };
    const next = [t, ...readAll()];
    writeAll(next);
    return t;
  }, []);

  const remove = useCallback((id: string) => {
    writeAll(readAll().filter((t) => t.id !== id));
  }, []);

  const save = useCallback((id: string, messages: UIMessage[]) => {
    const all = readAll();
    const idx = all.findIndex((t) => t.id === id);
    if (idx < 0) return;
    const firstUser = messages.find((m) => m.role === "user");
    const title =
      firstUser
        ? firstUser.parts
          .map((p) => (p.type === "text" ? p.text : ""))
          .join(" ")
          .slice(0, 60) || all[idx].title
        : all[idx].title;
    all[idx] = { ...all[idx], messages, title, updatedAt: Date.now() };
    all.sort((a, b) => b.updatedAt - a.updatedAt);
    writeAll(all);
  }, []);

  return { threads: hydrated ? threads : [], hydrated, create, remove, save };
}

export function getThread(id: string): Thread | undefined {
  return readAll().find((t) => t.id === id);
}
