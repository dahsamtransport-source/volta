import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Activity, AlertTriangle, ArrowLeft, Boxes, Building2, CalendarClock,
 CheckCircle2, ClipboardList, Droplets, Fuel, Gauge,
  MapPinned, Package, RefreshCw, ShieldCheck, Sun, Users, Wifi, WifiOff,
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { getClient } from "@/data/client";
import { useSession } from "@/data/session";
import { AccessGate } from "@/components/data/AccessGate";
import { StateNotice } from "@/components/common/StateNotice";

export const Route = createFileRoute("/command-center")({
  head: () => ({
    meta: [
      { title: "مركز القيادة | VOLTA" },
      { name: "description", content: "مركز قيادة العمليات الميدانية لشركة فولتا للطاقة والزيوت." },
      { name: "theme-color", content: "#0A192F" },
    ],
  }),
  component: CommandCenterRoute,
});

type VisitPoint = { id: string | number; visited_at: string };
type SalePoint = { id: string | number; sold_at: string };
type TrendPoint = { day: string; visits: number; sales: number };

type CommandMetrics = {
  establishments: number | null;
  representatives: number | null;
  visitsWeek: number | null;
  salesMonth: number | null;
  opportunities: number | null;
  products: number | null;
  overdue: number | null;
  trend: TrendPoint[];
  activity: VisitPoint[];
  trendAvailable: boolean;
  activityAvailable: boolean;
  updatedAt: string;
};

function dateKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function buildCommandTrend(visits: VisitPoint[], sales: SalePoint[], now = new Date()): TrendPoint[] {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = dateKey(day);
    return {
      day: new Intl.DateTimeFormat("ar-YE", { weekday: "short" }).format(day),
      visits: visits.filter((row) => dateKey(row.visited_at) === key).length,
      sales: sales.filter((row) => dateKey(row.sold_at) === key).length,
    };
  });
}

async function loadCommandMetrics(): Promise<CommandMetrics> {
  const client = getClient();
  if (!client) throw new Error("قاعدة البيانات غير مهيأة.");
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const [establishments, representatives, visits, sales, opportunities, products, overdue, visitRows, saleRows] =
    await Promise.all([
      client.from("establishments").select("id", { count: "exact", head: true }),
      client.from("representatives").select("id", { count: "exact", head: true }),
      client.from("visits").select("id", { count: "exact", head: true }).gte("visited_at", weekStart.toISOString()),
      client.from("sales").select("id", { count: "exact", head: true }).gte("sold_at", monthStart),
      client.from("opportunities").select("id", { count: "exact", head: true }),
      client.from("products").select("id", { count: "exact", head: true }),
      client.from("visits").select("id", { count: "exact", head: true }).not("follow_up_at", "is", null).lt("follow_up_at", now.toISOString()),
      client.from("visits").select("id,visited_at").gte("visited_at", weekStart.toISOString()).order("visited_at", { ascending: false }).limit(500),
      client.from("sales").select("id,sold_at").gte("sold_at", weekStart.toISOString()).order("sold_at", { ascending: true }).limit(500),
    ]);
  const count = (result: { count: number | null; error: { message: string } | null }) =>
    result.error ? null : result.count ?? 0;
  const visitData = (visitRows.data ?? []) as VisitPoint[];
  const saleData = (saleRows.data ?? []) as SalePoint[];
  return {
    establishments: count(establishments),
    representatives: count(representatives),
    visitsWeek: count(visits),
    salesMonth: count(sales),
    opportunities: count(opportunities),
    products: count(products),
    overdue: count(overdue),
    trend: buildCommandTrend(visitData, saleData, now),
    activity: visitData.slice(0, 5),
    trendAvailable: !visitRows.error && !saleRows.error,
    activityAvailable: !visitRows.error,
    updatedAt: now.toISOString(),
  };
}

function MetricCard({ title, value, note, icon: Icon, tone }: {
  title: string;
  value: number | null;
  note: string;
  icon: typeof Building2;
  tone: "blue" | "gold" | "green" | "red";
}) {
  return (
    <article className="vc-kpi rounded-2xl border p-4 transition duration-200 hover:-translate-y-1">
      <div className="flex items-start justify-between gap-3">
        <span className={"vc-kpi-icon vc-kpi-" + tone}><Icon className="size-5" aria-hidden /></span>
        <span className="text-[10px] text-slate-400">بيانات النظام</span>
      </div>
      <p className="mt-4 text-xs font-medium text-slate-300">{title}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight text-white tabular-nums">{value === null ? "—" : value.toLocaleString("en-US")}</p>
      <p className="mt-1 text-[11px] text-slate-400">{value === null ? "تعذر التحقق من المؤشر" : note}</p>
    </article>
  );
}

function Panel({ title, subtitle, children, action }: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="vc-panel min-w-0 rounded-2xl border p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-[11px] leading-5 text-slate-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function ActivityFeed({ rows }: { rows: VisitPoint[] }) {
  if (!rows.length) {
    return <div className="vc-empty rounded-xl border border-dashed p-5 text-center text-xs leading-6 text-slate-400">لا توجد زيارات مسجلة خلال الفترة المعروضة. ستظهر آخر التحديثات هنا بعد تسجيلها فعلياً.</div>;
  }
  return (
    <ol className="space-y-3">
      {rows.map((row) => (
        <li key={row.id} className="flex items-start gap-3">
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><CheckCircle2 className="size-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-xs font-semibold text-slate-100">تم تسجيل زيارة ميدانية</span>
            <time className="mt-1 block text-[10px] text-slate-400" dateTime={row.visited_at}>
              {new Intl.DateTimeFormat("ar-YE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(row.visited_at))}
            </time>
          </span>
          <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">مسجلة</span>
        </li>
      ))}
    </ol>
  );
}

function MapPlaceholder() {
  return (
    <div className="vc-map relative min-h-[270px] overflow-hidden rounded-xl border">
      <svg className="absolute inset-0 size-full" viewBox="0 0 720 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <defs>
          <pattern id="vc-map-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#4B83A6" strokeOpacity=".22" strokeWidth="1" />
          </pattern>
          <linearGradient id="vc-map-glow" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="#00AEEF" stopOpacity=".16" />
            <stop offset="1" stopColor="#F59E0B" stopOpacity=".05" />
          </linearGradient>
        </defs>
        <rect width="720" height="360" fill="#0B2038" />
        <rect width="720" height="360" fill="url(#vc-map-grid)" />
        <path d="M-20 280 C90 190 150 340 250 230 S430 120 530 220 S660 260 760 120" fill="none" stroke="#2B5974" strokeWidth="2" strokeOpacity=".7" />
        <path d="M-10 120 C110 190 160 60 260 140 S440 300 550 130 S670 60 750 150" fill="none" stroke="#426A72" strokeWidth="1.5" strokeOpacity=".45" />
        <path d="M60 40 C150 80 230 25 330 70 S470 165 650 50" fill="none" stroke="#436C83" strokeWidth="1" strokeOpacity=".45" />
        <rect width="720" height="360" fill="url(#vc-map-glow)" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#071629]/65 p-5 text-center backdrop-blur-[1px]">
        <span className="grid size-12 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-300"><MapPinned className="size-6" /></span>
        <p className="mt-3 text-sm font-bold text-white">الخريطة الحية غير مفعّلة بعد</p>
        <p className="mt-1 max-w-md text-[11px] leading-6 text-slate-300">لن نضع مواقع أو مسارات افتراضية. يلزم مفتاح Mapbox وإحداثيات GPS موثوقة من سجلات الزيارات أو أجهزة المندوبين.</p>
        <Link to="/districts" className="mt-3 inline-flex items-center gap-2 rounded-lg border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-200 transition hover:bg-sky-400/20">
          فتح المديريات <ArrowLeft className="size-3.5" />
        </Link>
      </div>
      <span className="absolute right-3 top-3 rounded-full border border-amber-300/20 bg-amber-400/10 px-2.5 py-1 text-[9px] text-amber-200">GPS غير مربوط</span>
    </div>
  );
}

function InventoryStatus({ products }: { products: number | null }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="vc-bottle-wrap mx-auto grid h-40 w-28 shrink-0 place-items-center sm:mx-0" data-threejs-mount="inventory-bottle" aria-label="مساحة مخصصة لنموذج زجاجة زيت ثلاثي الأبعاد">
        {/* Three.js can mount here after adding a pinned dependency and validating the production bundle. */}
        <svg viewBox="0 0 120 190" className="h-40 w-28" role="img" aria-label="شكل توضيحي لعبوة زيت، دون تمثيل لكمية المخزون">
          <defs>
            <linearGradient id="vc-bottle-glass" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#7897AE" stopOpacity=".28" />
              <stop offset=".28" stopColor="#E2F3FF" stopOpacity=".18" />
              <stop offset=".62" stopColor="#527A95" stopOpacity=".5" />
              <stop offset="1" stopColor="#1D3D5A" stopOpacity=".8" />
            </linearGradient>
            <linearGradient id="vc-bottle-cap" x1="0" x2="1">
              <stop offset="0" stopColor="#A66C16" />
              <stop offset=".5" stopColor="#F4C65B" />
              <stop offset="1" stopColor="#8D5710" />
            </linearGradient>
          </defs>
          <path d="M43 10h34v13H43z" fill="url(#vc-bottle-cap)" stroke="#F8D887" strokeOpacity=".5" />
          <path d="M47 23h26v20l15 15c5 5 8 12 8 20v83c0 12-8 21-20 21H44c-12 0-20-9-20-21V78c0-8 3-15 8-20l15-15z" fill="url(#vc-bottle-glass)" stroke="#9CC7E2" strokeOpacity=".75" strokeWidth="2" />
          <path d="M35 77c0-8 3-14 9-20l12-12h8l12 12c6 6 9 12 9 20v63H35z" fill="none" stroke="#BFE5FA" strokeOpacity=".4" />
          <path d="M36 102h48v34H36z" rx="4" fill="#F59E0B" fillOpacity=".18" stroke="#F7BD4C" strokeOpacity=".7" />
          <path d="M42 112h36" stroke="#FFD783" strokeOpacity=".75" strokeWidth="2" strokeLinecap="round" />
          <path d="M42 121h24" stroke="#FFD783" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" />
          <path d="M34 75h52" stroke="#D3ECFA" strokeOpacity=".55" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200"><Fuel className="size-4 text-amber-300" /> بيانات المنتجات والمخزون</div>
        <p className="mt-3 text-2xl font-bold text-white tabular-nums">{products === null ? "—" : products.toLocaleString("en-US")}</p>
        <p className="text-[11px] text-slate-300">منتج مسجل في الكتالوج</p>
        <div className="mt-3 rounded-xl border border-amber-300/15 bg-amber-400/[.07] p-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-amber-200"><AlertTriangle className="size-3.5" /> كمية اللترات غير متاحة</div>
          <p className="mt-1 text-[10px] leading-5 text-slate-300">لم يتم اعتماد حقل كمية/وحدة مخزون موثّق في نموذج البيانات الذي فُحص. لا نعرض نسبة تعبئة تقديرية.</p>
        </div>
        <Link to="/products" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-sky-300 hover:text-sky-200">فتح كتالوج المنتجات <ArrowLeft className="size-3.5" /></Link>
      </div>
    </div>
  );
}

function CommandCenterContent() {
  const { online } = useSession();
  const [fieldMode, setFieldMode] = useState(false);
  const query = useQuery({
    queryKey: ["volta", "command-center", "verified-metrics"],
    queryFn: loadCommandMetrics,
    staleTime: 30_000,
    refetchInterval: online ? 60_000 : false,
    retry: 1,
  });
  const data = query.data;

  return (
    <div className={"volta-command-center space-y-4 rounded-3xl p-3 text-white sm:p-4 lg:p-5 " + (fieldMode ? "field-mode" : "")}>
      {!online && (
        <div className="flex items-center gap-2 rounded-xl border border-slate-400/20 bg-slate-500/15 px-3 py-2.5 text-xs text-slate-200">
          <WifiOff className="size-4" /> وضع دون اتصال — البيانات المعروضة هي آخر نسخة مخزنة من جلسة التطبيق، ولن تُنفذ عمليات خادمية حتى يعود الاتصال.
        </div>
      )}
      <section className="vc-hero relative overflow-hidden rounded-3xl border p-5 md:p-7">
        <div className="vc-hero-orb" />
        <div className="relative z-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-3 py-1.5 text-[10px] text-slate-200">
              <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_#34d399]" />
              VOLTA · مركز العمليات الميدانية
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">مركز القيادة والتحكم</h1>
            <p className="mt-2 max-w-xl text-xs leading-7 text-slate-300 md:text-sm">متابعة الميدان والزيارات والمبيعات والكتالوج من واجهة تشغيل موحدة، مع إبقاء المؤشرات مرتبطة ببيانات قاعدة النظام.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[.06] px-3 py-2 text-[11px]">
              {online ? <Wifi className="size-4 text-emerald-300" /> : <WifiOff className="size-4 text-amber-300" />}
              {online ? "الاتصال متاح" : "غير متصل"}
            </span>
            <button type="button" onClick={() => setFieldMode((value) => !value)} aria-pressed={fieldMode} className={"inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-semibold transition " + (fieldMode ? "border-amber-300/50 bg-amber-300/15 text-amber-100" : "border-white/15 bg-white/[.06] text-slate-200 hover:bg-white/10")}>
              <Sun className="size-4" /> {fieldMode ? "إيقاف الوضع الميداني" : "الوضع الميداني"}
            </button>
            <button type="button" onClick={() => void query.refetch()} disabled={query.isFetching || !online} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50">
              <RefreshCw className={"size-4 " + (query.isFetching ? "animate-spin" : "")} /> تحديث
            </button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-[.17]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.13) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.13) 1px,transparent 1px)", backgroundSize: "32px 32px", maskImage: "linear-gradient(90deg,transparent,#000)" }} />
      </section>

      {query.isError && <StateNotice kind="error" title="تعذر تحديث بيانات مركز القيادة">{query.error instanceof Error ? query.error.message : "تحقق من اتصال قاعدة البيانات والصلاحيات ثم أعد المحاولة."}</StateNotice>}
      {query.isPending && <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="vc-panel h-36 animate-pulse rounded-2xl" />)}</div>}

      {data && (
        <>
          <section aria-label="المؤشرات التشغيلية" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <MetricCard title="المنشآت المسجلة" value={data.establishments} note="إجمالي المنشآت" icon={Building2} tone="blue" />
            <MetricCard title="المندوبون المسجلون" value={data.representatives} note="حسابات المندوبين في النظام" icon={Users} tone="gold" />
            <MetricCard title="زيارات آخر 7 أيام" value={data.visitsWeek} note="حسب وقت تسجيل الزيارة" icon={MapPinned} tone="green" />
            <MetricCard title="المبيعات هذا الشهر" value={data.salesMonth} note="عدد العمليات المسجلة" icon={Gauge} tone="blue" />
            <MetricCard title="الفرص البيعية" value={data.opportunities} note="إجمالي الفرص المسجلة" icon={Activity} tone="gold" />
            <MetricCard title="المنتجات المسجلة" value={data.products} note="عدد عناصر الكتالوج" icon={Package} tone="green" />
          </section>

          {data.overdue !== null && data.overdue > 0 && (
            <Link to="/visits" className="flex items-center gap-3 rounded-xl border border-amber-300/25 bg-amber-400/[.08] px-4 py-3 text-amber-100 transition hover:bg-amber-400/[.13]">
              <CalendarClock className="size-5 shrink-0 text-amber-300" />
              <span className="flex-1 text-xs font-semibold">هناك {data.overdue.toLocaleString("en-US")} متابعة متأخرة تتطلب المراجعة.</span>
              <ArrowLeft className="size-4" />
            </Link>
          )}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(18rem,.85fr)]">
            <Panel title="خريطة العمليات الميدانية" subtitle="لا تُعرض مواقع الفرق إلا بعد توفير إحداثيات موثقة ومفتاح خريطة صالح." action={<span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[9px] text-amber-200">بانتظار GPS</span>}>
              <MapPlaceholder />
            </Panel>
            <Panel title="حالة الزيت والمخزون" subtitle="عرض الكتالوج الحالي، دون اختلاق أرصدة أو كميات باللتر.">
              <InventoryStatus products={data.products} />
            </Panel>
          </div>

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,.8fr)]">
            <Panel title="نشاط الزيارات" subtitle="مخطط مبني على أوقات الزيارات والمبيعات المسجلة فعلياً في آخر سبعة أيام." action={<span className="text-[10px] text-slate-400">آخر تحديث {new Intl.DateTimeFormat("ar-YE", { hour: "2-digit", minute: "2-digit" }).format(new Date(data.updatedAt))}</span>}>
              <div className="h-60 min-w-0">
                {data.trendAvailable ? <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.trend} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="vc-visits-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00AEEF" stopOpacity=".35" /><stop offset="100%" stopColor="#00AEEF" stopOpacity=".02" /></linearGradient>
                      <linearGradient id="vc-sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#F59E0B" stopOpacity=".30" /><stop offset="100%" stopColor="#F59E0B" stopOpacity=".02" /></linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,.09)" strokeDasharray="4 4" vertical={false} />
                    <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "#B8C7D9", fontSize: 10 }} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: "#B8C7D9", fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, borderColor: "rgba(255,255,255,.15)", background: "#132A43", color: "#fff", fontSize: 11 }} />
                    <Area type="monotone" dataKey="visits" name="الزيارات" stroke="#00AEEF" strokeWidth={2.5} fill="url(#vc-visits-fill)" />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#F59E0B" strokeWidth={2.5} fill="url(#vc-sales-fill)" />
                  </AreaChart>
                </ResponsiveContainer> : <StateNotice kind="error" title="تعذر تحميل بيانات الرسم">تحقق من أذونات الوصول إلى سجلات الزيارات والمبيعات.</StateNotice>}
              </div>
            </Panel>
            <Panel title="آخر النشاطات" subtitle="آخر خمس زيارات مسجلة، دون إظهار بيانات شخصية غير لازمة." action={<Link to="/visits" className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-300">كل الزيارات <ArrowLeft className="size-3" /></Link>}>
              {data.activityAvailable ? <ActivityFeed rows={data.activity} /> : <StateNotice kind="error" title="تعذر تحميل سجل الزيارات">تحقق من أذونات الجدول ثم أعد المحاولة.</StateNotice>}
            </Panel>
          </div>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="اختصارات العمل">
            <Link to="/visits" className="vc-action"><ClipboardList className="size-5" /><span><b>تسجيل زيارة</b><small>إضافة زيارة ميدانية</small></span><ArrowLeft className="ms-auto size-4" /></Link>
            <Link to="/sales" className="vc-action"><Fuel className="size-5" /><span><b>المبيعات</b><small>متابعة عمليات البيع</small></span><ArrowLeft className="ms-auto size-4" /></Link>
            <Link to="/products" className="vc-action"><Boxes className="size-5" /><span><b>المنتجات</b><small>كتالوج الزيوت</small></span><ArrowLeft className="ms-auto size-4" /></Link>
            <Link to="/sync" className="vc-action"><RefreshCw className="size-5" /><span><b>مركز المزامنة</b><small>مراجعة حالة التزامن</small></span><ArrowLeft className="ms-auto size-4" /></Link>
          </section>
        </>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-emerald-300" /> الصلاحيات والبيانات تخضع لـ Supabase RLS</span>
        <span>VOLTA · Field Operations</span>
      </footer>
    </div>
  );
}

function CommandCenterRoute() {
  return <AccessGate><CommandCenterContent /></AccessGate>;
}
