import { Info } from "lucide-react";

export function InfoTip({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={"group relative inline-flex align-middle " + className}>
      <button
        type="button"
        aria-label="What is this?"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-gold/40"
        tabIndex={0}
      >
        <Info className="h-3.5 w-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 rounded-lg border border-border bg-popover px-3 py-2 text-xs font-normal leading-relaxed text-popover-foreground opacity-0 shadow-elegant transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
