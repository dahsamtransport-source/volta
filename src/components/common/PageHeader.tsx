import type { ReactNode } from "react";

export function PageHeader({ title, en, description, actions }: { title: string; en?: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 animate-rise">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {title} {en && <span className="ms-1 text-xs font-normal text-muted-foreground" dir="ltr">{en}</span>}
        </h1>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}