import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Activity, ArrowUpLeft, Building2, CalendarCheck, FileText, MapPinned,
  Receipt, RefreshCw, Target, Users, Wifi, WifiOff,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getClient } from "@/data/client";
import { useSession } from "@/data/session";
import { AccessGate } from "@/components/data/AccessGate";
import { StateNotice } from "@/components/common/StateNotice";

type DailyPoint = { day: string; visits: number; sales: number };
type DashboardMetrics = {
  establishments: number | null;
  visitsWeek: number | null;
  opportunities: number | null;
  quotes: number | null;
  salesMonth: number | null;
  overdue: number | null;
  trend: DailyPoint[];
  chartReady: boolean;
  updatedAt: string;
};

async function loadMetrics(): Promise<DashboardMetrics> {
  const client = getClient();
  if (!client) throw new Error("تعذر الاتصال بقاعدة البيانات.");

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const nowIso = now.toISOString();

  const [
    establishments, visits, opportunities, quotes, sales, overdue,
    visitRows, saleRows,
  ] = await Promise.all([
    client.from("establishments").select("id", { count: "exact", head: true }),
    client.from("visits").select("id", { count: "exact", head: true }).gte("visited_at", weekStart.toISOString()),
    client.from("opportunities").select("id", { count: "exact", head: true }),
    client.from("quotes").select("id", { count: "exact", head: true }),
    client.from("sales").select("id", { count: "exact", head: true }).gte("sold_at", monthStart),
    client.from("visits").select("id", { count: "exact", head: true }).not("follow_up_at", "is", null).lt("follow_up_at", nowIso),
    client.from("visits").select("visited_at").gte("visited_at", weekStart.toISOString()).order("visited_at", { ascending: true }).limit(2000),
    client.from("sales").select("sold_at").gte("sold_at", weekStart.toISOString()).order("sold_at", { ascending: true }).limit(2000),
  ]);

  const countOrNull = (result: { count: number | null; error: { message: string } | null }) =>
    result.error ? null : result.count ?? 0;

  const dateKey = (value: string | Date) => { const date = value instanceof Date ? value : new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; };
  const days: DailyPoint[] = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const key = dateKey(date);
    return {
      day: new Intl.DateTimeFormat("ar-YE", { weekday: "short" }).format(date),
      visits: 0,
      sales: 0,
      ...(visitRows.error || saleRows.error ? {} : {}),
      _key: key,
    } as DailyPoint & { _key: string };
  }).map((point) => {
    const key = (point as DailyPoint & { _key?: string })._key ?? "";
    return {
      day: point.day,
      visits: visitRows.error ? 0 : (visitRows.data ?? []).filter((row) => dateKey(row.visited_at) === key).length,
      sales: saleRows.error ? 0 : (saleRows.data ?? []).filter((row) => dateKey(row.sold_at) === key).length,
    };
  });

  return {
    establishments: countOrNull(establishments),
    visitsWeek: countOrNull(visits),
    opportunities: countOrNull(opportunities),
    quotes: countOrNull(quotes),
    salesMonth: countOrNull(sales),
    overdue: countOrNull(overdue),
    trend: days,
    chartReady: !visitRows.error && !saleRows.error && days.some((day) => day.visits + day.sales > 0),
    updatedAt: now.toISOString(),
  };
}

function Sparkline({ values }: { values: number[] }) {
  if (!values.some((value) => value > 0)) return null;
  const max = Math.max(1, ...values);
  const points = values.map((value, index) => {
    const x = values.length < 2 ? 50 : (index / (values.length - 1)) * 100;
    const y = 26 - (value / max) * 22;
    return \`\${x},\${y}\`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24 text-primary" role="img" aria-label="اتجاه النشاط خلال آخر سبعة أيام">
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const KPI_CARDS = [
  { key: "establishments", title: "المنشآت المسجلة", icon: Building2, tone: "navy", hint: "قاعدة العملاء والمنشآت" },
  { key: "visitsWeek", title: "الزيارات خلال 7 أيام", icon: CalendarCheck, tone: "copper", hint: "الزيارات المسجلة فعلياً" },
  { key: "opportunities", title: "الفرص البيعية", icon: Target, tone: "blue", hint: "كل الفرص المسجلة" },
  { key: "quotes", title: "عروض الأسعار", icon: FileText, tone: "copper", hint: "العروض في النظام" },
  { key: "salesMonth", title: "عمليات البيع هذا الشهر", icon: Receipt, tone: "green", hint: "حسب تاريخ البيع" },
  { key: "overdue", title: "متابعات متأخرة", icon: Activity, tone: "red", hint: "مواعيد متابعة تجاوزت وقتها" },
] as const;

const VALUE_KEY: Record<(typeof KPI_CARDS)[number]["key"], keyof DashboardMetrics> = {
  establishments: "establishments",
  visitsWeek: "visitsWeek",
  opportunities: "opportunities",
  quotes: "quotes",
  salesMonth: "salesMonth",
  overdue: "overdue",
};

function MetricCard({ card, value, trend }: {
  card: (typeof KPI_CARDS)[number];
  value: number | null;
  trend?: number[];
}) {
  const Icon = card.icon;
  return (
    <article className="kpi-card group rounded-2xl border bg-card/90 p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <div className={\`kpi-icon kpi-icon-\${card.tone}\`}>
          <Icon className="size-5" aria-hidden />
        </div>
        {trend && <Sparkline values={trend} />}
      </div>
      <div className="mt-4 text-xs font-medium text-muted-foreground">{card.title}</div>
      <div className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
        {value === null ? "—" : value.toLocaleString("en-US")}
      </div>
      <div className="mt-1 text-[11px] text-muted-foreground">{value === null ? "تعذر تحميل المؤشر" : card.hint}</div>
    </article>
  );
}

function QuickAction({ to, icon: Icon, title, description }: {
  to: "/" | "/visits" | "/establishments" | "/quotes" | "/sales";
  icon: typeof MapPinned;
  title: string;
  description: string;
}) {
  return (
    <Link to={to} className="group flex items-center gap-3 rounded-xl border bg-card/70 p-3 transition hover:border-primary/30 hover:bg-accent/50">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{description}</span>
      </span>
      <ArrowUpLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-1 group-hover:text-primary" />
    </Link>
  );
}

function DashboardContent() {
  const { online, access } = useSession();
  const query = useQuery({
    queryKey: ["volta", "dashboard", access.status === "granted" ? access.role : "anonymous"],
    queryFn: loadMetrics,
    enabled: access.status === "granted",
    staleTime: 30_000,
    refetchInterval: online ? 60_000 : false,
    retry: 1,
  });

  const data = query.data;
  const visitTrend = data?.trend.map((point) => point.visits);
  const salesTrend = data?.trend.map((point) => point.sales);

  return (
    <div className="space-y-5">
      <section className="dashboard-hero relative overflow-hidden rounded-3xl p-5 text-white shadow-xl md:p-7">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] text-white/85">
              <span className="size-1.5 rounded-full bg-emerald-300" />
              نظام المبيعات الميدانية · لحج
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">مركز قيادة VOLTA</h1>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/75">رؤية تشغيلية موحدة للمنشآت والزيارات والفرص وعروض الأسعار والمبيعات، من المكتب أو الهاتف.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs">
              {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}
              {online ? "متصل بالشبكة" : "وضع دون اتصال"}
            </span>
            <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching || !online} className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-900 transition hover:bg-white/90 disabled:opacity-50">
              <RefreshCw className={\`size-4 \${query.isFetching ? "animate-spin" : ""}\`} />
              تحديث البيانات
            </button>
          </div>
        </div>
        <div className="hero-grid" aria-hidden />
      </section>

      {query.isError && (
        <div className="glass-panel">
          <StateNotice kind="error" title="تعذر تحميل مؤشرات لوحة التحكم">{query.error instanceof Error ? query.error.message : "تحقق من اتصال قاعدة البيانات ثم أعد المحاولة."}</StateNotice>
        </div>
      )}
      {query.isPending && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {KPI_CARDS.map((card) => <div key={card.key} className="h-36 animate-pulse rounded-2xl border bg-card/70" />)}
        </div>
      )}
      {data && (
        <section aria-label="مؤشرات الأداء">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-base font-bold">مؤشرات الأداء الرئيسية</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">تُحسب من بيانات قاعدة VOLTA وفق صلاحية حسابك.</p>
            </div>
            <span className="text-[11px] text-muted-foreground">آخر تحديث: {new Intl.DateTimeFormat("ar-YE", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.updatedAt))}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {KPI_CARDS.map((card) => (
              <MetricCard
                key={card.key}
                card={card}
                value={data[VALUE_KEY[card.key]] as number | null}
                trend={card.key === "visitsWeek" ? visitTrend : card.key === "salesMonth" ? salesTrend : undefined}
              />
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.85fr)]">
        <section className="glass-panel min-w-0 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">حركة الميدان</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">عدد الزيارات وعمليات البيع خلال آخر سبعة أيام</p>
            </div>
            <span className="rounded-full border px-2.5 py-1 text-[10px] text-muted-foreground">7 أيام</span>
          </div>
          {query.isPending ? <div className="h-64 animate-pulse rounded-xl bg-muted/60" /> :
            data?.chartReady ? (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--amber)" stopOpacity={0.24} />
                        <stop offset="100%" stopColor="var(--amber)" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: "var(--border)", background: "var(--card)", fontSize: 12 }} />
                    <Area type="monotone" dataKey="visits" name="الزيارات" stroke="var(--primary)" strokeWidth={2.5} fill="url(#visitsFill)" />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="var(--amber)" strokeWidth={2.5} fill="url(#salesFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <StateNotice kind="empty" title="لا يوجد نشاط كافٍ لعرض الرسم بعد">سيظهر الرسم تلقائياً عند تسجيل زيارات أو مبيعات فعلية. لا نعرض بيانات تجريبية.</StateNotice>
            )}
        </section>

        <section className="glass-panel p-4 md:p-5">
          <div className="mb-3">
            <h2 className="text-base font-bold">إنجاز سريع</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">انتقل مباشرة إلى المهمة المطلوبة.</p>
          </div>
          <div className="space-y-2">
            <QuickAction to="/visits" icon={CalendarCheck} title="تسجيل زيارة" description="حفظ الزيارة مع الموقع عند الموافقة" />
            <QuickAction to="/establishments" icon={Building2} title="إدارة المنشآت" description="العثور على عميل أو تحديث بياناته" />
            <QuickAction to="/quotes" icon={FileText} title="عروض الأسعار" description="متابعة العروض والردود" />
            <QuickAction to="/sales" icon={Receipt} title="المبيعات" description="متابعة عمليات البيع المعتمدة" />
          </div>
        </section>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card/65 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><MapPinned className="size-4 text-primary" /> تغطية المديريات</div>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">تتبّع نطاق التغطية من وحدة المديريات وتوزيع المندوبين. لا تُعرض إحداثيات غير مؤكدة على الخريطة.</p>
          <Link to="/districts" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">فتح المديريات <ArrowUpLeft className="size-3.5" /></Link>
        </div>
        <div className="rounded-2xl border bg-card/65 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold"><Users className="size-4 text-primary" /> أداء فريق المبيعات</div>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">تابع المندوبين وتوزيع المناطق من لوحة المشرف، بينما تبقى تفاصيل الصلاحيات محمية حسب الدور.</p>
          <Link to="/representatives" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">فتح المندوبين <ArrowUpLeft className="size-3.5" /></Link>
        </div>
      </section>
    </div>
  );
}

export function OverviewDashboard() {
  return (
    <AccessGate>
      <DashboardContent />
    </AccessGate>
  );
}
