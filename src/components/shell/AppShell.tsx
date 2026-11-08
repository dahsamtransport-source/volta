import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { ChevronsRight, ChevronsLeft, Menu, Search, Wifi, WifiOff, Database, CloudOff, LogOut, UserCircle2 } from "lucide-react";
import { MODULES, GROUP_LABEL } from "@/app/modules";
import { useSession } from "@/data/session";
import { can, ROLE_LABEL } from "@/lib/auth/roles";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { access } = useSession();
  const loc = useLocation();
  const groups = (["ops", "catalog", "system"] as const).map((g) => ({
    g,
    items: MODULES.filter((m) => m.group === g && (!m.requires || m.requires === "view" || can(access, m.requires) || access.status !== "granted")),
  }));
  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="التنقل الرئيسي">
      {groups.map(({ g, items }) => (
        <div key={g} className="mb-4">
          {!collapsed && <div className="px-3 pb-1.5 text-[11px] font-medium tracking-wide text-sidebar-muted">{GROUP_LABEL[g]}</div>}
          <ul className="space-y-0.5">
            {items.map((m) => {
              const active = m.path === "/" ? loc.pathname === "/" : loc.pathname.startsWith(m.path);
              const locked = m.requires && m.requires !== "view" && !can(access, m.requires);
              return (
                <li key={m.path}>
                  <Link
                    to={m.path}
                    onClick={onNavigate}
                    title={collapsed ? m.label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                      active ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_-3px_0_0_var(--amber)]" : "text-sidebar-muted hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      locked && "opacity-60",
                    )}
                  >
                    <m.icon className="size-4 shrink-0" aria-hidden />
                    {!collapsed && <span className="truncate">{m.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
      <img src="/favicon.png" alt="" width={28} height={28} className="rounded-md" />
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-sidebar-foreground">لحج زيوت</div>
          <div className="text-[10px] text-sidebar-muted" dir="ltr">Lahj Oil Field Sales</div>
        </div>
      )}
    </div>
  );
}

export function StatusPills() {
  const { keyCheck, online } = useSession();
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className={cn("hidden items-center gap-1 rounded-full border px-2 py-1 sm:inline-flex", keyCheck.ok ? "border-primary/30 text-primary" : "border-amber/60 text-amber-foreground bg-amber/15")}>
        <Database className="size-3.5" /> {keyCheck.ok ? "مُعَدّ" : "غير متصل"}
      </span>
      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-1", online ? "text-muted-foreground" : "border-destructive/40 text-destructive")}>
        {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        <span className="hidden md:inline">{online ? "متصل بالشبكة" : "بدون شبكة"}</span>
      </span>
      <Link to="/sync" className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-muted-foreground hover:bg-muted" title="المزامنة غير مفعّلة بعد">
        <CloudOff className="size-3.5" /> <span className="hidden md:inline">المزامنة: غير مفعّلة</span>
      </Link>
    </div>
  );
}

function UserMenu() {
  const { user, access, signOut } = useSession();
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted" aria-label="قائمة المستخدم">
        <UserCircle2 className="size-5 text-primary" />
        <span className="hidden max-w-32 truncate lg:inline">{user?.email ?? "زائر"}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          {access.status === "granted" ? `الدور: ${ROLE_LABEL[access.role]}` : "لا توجد صلاحية مفعّلة"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem onClick={() => signOut()}><LogOut className="size-4" /> تسجيل الخروج</DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild><Link to="/setup">تسجيل الدخول / الإعداد</Link></DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-16" : "w-60")}>
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <button onClick={() => setCollapsed((c) => !c)} className="m-2 flex items-center justify-center gap-2 rounded-md py-2 text-xs text-sidebar-muted hover:bg-sidebar-accent" aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}>
          {collapsed ? <ChevronsLeft className="size-4" /> : <><ChevronsRight className="size-4" /> طي القائمة</>}
        </button>
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="flex w-64 flex-col border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">القائمة</SheetTitle>
          <Brand collapsed={false} />
          <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur md:px-5">
          <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Menu className="size-5" /></button>
          <label className="relative max-w-md flex-1">
            <span className="sr-only">بحث شامل</span>
            <Search className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" placeholder="بحث في المنشآت، الفرص، العروض…" className="h-9 w-full rounded-md border bg-card pr-8 pl-3 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
          </label>
          <select aria-label="المديرية" className="hidden h-9 rounded-md border bg-card px-2 text-sm md:block" disabled>
            <option>كل المديريات</option>
          </select>
          <div className="ms-auto flex items-center gap-1"><StatusPills /><UserMenu /></div>
        </header>
        <main className="flex-1 p-3 md:p-5">{children}</main>
      </div>
    </div>
  );
}