import { useState, type ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import {
  ArrowUpLeft, ChevronsLeft, ChevronsRight, Menu, Search, Wifi, WifiOff,
  Database, RefreshCw, LogOut, UserCircle2, X,
} from "lucide-react";
import { MODULES, GROUP_LABEL } from "@/app/modules";
import { useSession } from "@/data/session";
import { can, ROLE_LABEL } from "@/lib/auth/roles";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function allowedModules(access: ReturnType<typeof useSession>["access"]) {
  return MODULES.filter((module) => !module.requires || module.requires === "view" || access.status !== "granted" || can(access, module.requires));
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { access } = useSession();
  const loc = useLocation();
  const visibleModules = allowedModules(access);
  const groups = (["ops", "catalog", "system"] as const).map((g) => ({
    g,
    items: visibleModules.filter((m) => m.group === g),
  }));

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="التنقل الرئيسي">
      {groups.map(({ g, items }) => items.length > 0 && (
        <div key={g} className="mb-4">
          {!collapsed && <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-sidebar-muted">{GROUP_LABEL[g]}</div>}
          <ul className="space-y-1">
            {items.map((m) => {
              const active = m.path === "/" ? loc.pathname === "/" : loc.pathname.startsWith(m.path);
              return (
                <li key={m.path}>
                  <Link
                    to={m.path}
                    onClick={onNavigate}
                    title={collapsed ? m.label : undefined}
                    className={cn(
                      "group flex min-h-10 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition duration-150",
                      active ? "bg-sidebar-accent text-sidebar-foreground shadow-[inset_-3px_0_0_var(--amber)]" : "text-sidebar-muted hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                    )}
                  >
                    <m.icon className="size-4 shrink-0 transition-transform group-hover:scale-110" aria-hidden />
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
    <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
      <img src="/volta-icon.svg" alt="" width={34} height={34} className="rounded-xl shadow-md" />
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <div className="text-base font-bold tracking-wide text-sidebar-foreground">VOLTA</div>
          <div className="mt-1 text-[10px] text-sidebar-muted">Lahj Oil Field Sales</div>
        </div>
      )}
    </div>
  );
}

export function StatusPills() {
  const { keyCheck, online } = useSession();
  return (
    <div className="flex items-center gap-1.5 text-[11px]">
      <span className={cn("hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 sm:inline-flex", keyCheck.ok ? "border-primary/20 text-primary" : "border-amber/50 bg-amber/10 text-amber-foreground")}>
        <Database className="size-3.5" /> {keyCheck.ok ? "قاعدة البيانات مُهيأة" : "يلزم الإعداد"}
      </span>
      <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5", online ? "border-success/20 text-success" : "border-destructive/30 text-destructive")}>
        {online ? <Wifi className="size-3.5" /> : <WifiOff className="size-3.5" />}
        <span className="hidden sm:inline">{online ? "متصل" : "دون اتصال"}</span>
      </span>
      <Link to="/sync" className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground" title="مركز المزامنة">
        <RefreshCw className="size-3.5" /><span className="hidden md:inline">المزامنة</span>
      </Link>
    </div>
  );
}

function UserMenu() {
  const { user, access, signOut } = useSession();
  const identity = user?.phone ?? user?.email ?? "مستخدم";
  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger className="inline-flex min-h-10 items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm transition hover:bg-muted" aria-label="قائمة المستخدم">
        <UserCircle2 className="size-5 text-primary" />
        <span className="hidden max-w-36 truncate text-xs font-medium lg:inline" dir="ltr">{identity}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="space-y-1 text-xs font-normal">
          <span className="block truncate" dir="ltr">{identity}</span>
          <span className="block text-muted-foreground">{access.status === "granted" ? \`الدور: \${ROLE_LABEL[access.role]}\` : "لا توجد صلاحية مفعّلة"}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {user ? (
          <DropdownMenuItem onClick={() => void signOut()}><LogOut className="size-4" /> تسجيل الخروج</DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild><Link to="/setup">تسجيل الدخول</Link></DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GlobalSearch() {
  const [term, setTerm] = useState("");
  const { access } = useSession();
  const matches = term.trim()
    ? allowedModules(access).filter((m) => m.label.includes(term.trim()) || m.en.toLowerCase().includes(term.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="relative hidden max-w-lg flex-1 sm:block">
      <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setTerm("");
          if (event.key === "Enter" && matches[0]) setTerm("");
        }}
        placeholder="بحث سريع في أقسام النظام…"
        aria-label="بحث سريع في أقسام النظام"
        className="h-10 w-full rounded-xl border bg-card/80 pr-9 pl-9 text-sm outline-none transition focus:border-primary/40 focus:ring-2 focus:ring-ring/20"
      />
      {term && (
        <button type="button" onClick={() => setTerm("")} className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted" aria-label="مسح البحث">
          <X className="size-3.5" />
        </button>
      )}
      {matches.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border bg-popover p-1.5 shadow-xl">
          {matches.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setTerm("")} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition hover:bg-accent">
              <item.icon className="size-4 text-primary" />
              <span className="flex-1">{item.label}</span>
              <ArrowUpLeft className="size-3.5 text-muted-foreground" />
            </Link>
          ))}
        </div>
      )}
      {term.trim() && matches.length === 0 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border bg-popover p-3 text-xs text-muted-foreground shadow-lg">لا توجد أقسام مطابقة لعبارة البحث.</div>
      )}
    </div>
  );
}

const QUICK_PATHS = ["/", "/visits", "/establishments", "/sales"] as const;

function MobileQuickNav() {
  const location = useLocation();
  return (
    <nav className="mobile-quick-nav fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 gap-1 rounded-2xl border border-white/60 bg-card/90 p-1.5 shadow-xl backdrop-blur-xl lg:hidden" aria-label="التنقل السريع">
      {QUICK_PATHS.map((path) => {
        const module = MODULES.find((item) => item.path === path)!;
        const active = path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);
        return (
          <Link key={path} to={path} className={cn("flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-semibold transition", active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted")}>
            <module.icon className="size-4" />
            <span>{module.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div dir="rtl" className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-[4.5rem]" : "w-64")}>
        <Brand collapsed={collapsed} />
        <NavList collapsed={collapsed} />
        <div className="mx-3 mb-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 p-3">
          {!collapsed && <><div className="text-xs font-semibold text-sidebar-foreground">VOLTA Field System</div><div className="mt-1 text-[10px] leading-5 text-sidebar-muted">منصة موحدة لإدارة المبيعات والزيارات الميدانية.</div></>}
          <button onClick={() => setCollapsed((current) => !current)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] text-sidebar-muted transition hover:bg-sidebar-accent hover:text-sidebar-foreground" aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"}>
            {collapsed ? <ChevronsLeft className="size-4" /> : <><ChevronsRight className="size-4" /> طي القائمة</>}
          </button>
        </div>
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="flex w-[min(84vw,20rem)] flex-col border-sidebar-border bg-sidebar p-0">
          <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
          <Brand collapsed={false} />
          <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur-xl md:px-5">
          <button className="rounded-xl p-2 transition hover:bg-muted lg:hidden" onClick={() => setMobileOpen(true)} aria-label="فتح القائمة"><Menu className="size-5" /></button>
          <div className="font-bold tracking-wide text-primary sm:hidden">VOLTA</div>
          <GlobalSearch />
          <div className="ms-auto flex min-w-0 items-center gap-1 sm:gap-2">
            <StatusPills />
            <UserMenu />
          </div>
        </header>
        <main className="min-w-0 flex-1 px-3 py-4 pb-24 md:px-5 md:py-5 lg:pb-6">{children}</main>
      </div>
      <MobileQuickNav />
    </div>
  );
}
