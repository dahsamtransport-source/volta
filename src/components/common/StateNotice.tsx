import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Inbox, Lock, PlugZap, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Kind = "empty" | "setup" | "denied" | "error" | "loading";
const ICON = { empty: Inbox, setup: PlugZap, denied: Lock, error: AlertTriangle, loading: Loader2 };

export function StateNotice({ kind, title, children, compact }: { kind: Kind; title: string; children?: ReactNode; compact?: boolean }) {
  const Icon = ICON[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"} className={cn("flex flex-col items-center justify-center text-center", compact ? "py-6" : "py-14")}>
      <div className={cn("mb-3 grid size-10 place-items-center rounded-full", kind === "error" ? "bg-destructive/10 text-destructive" : kind === "setup" ? "bg-amber/20 text-amber-foreground" : "bg-accent text-accent-foreground")}>
        <Icon className={cn("size-5", kind === "loading" && "animate-spin")} />
      </div>
      <div className="text-sm font-medium">{title}</div>
      {children && <div className="mt-1 max-w-md text-xs text-muted-foreground">{children}</div>}
      {kind === "setup" && <Link to="/setup" className="mt-3 text-xs font-medium text-primary underline-offset-4 hover:underline">فتح صفحة الإعداد</Link>}
    </div>
  );
}