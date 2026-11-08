import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { useSession } from "@/data/session";
import { probeTables, type ProbeResult } from "@/data/client";
import { FIELD_SALES_URL, FIELD_SALES_SCHEMA, KEY_REASON_TEXT } from "@/lib/config";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "الإعداد والاتصال | VOLTA" },
      { name: "description", content: "الدخول الآمن وحالة اتصال نظام VOLTA" },
      { property: "og:title", content: "الإعداد والاتصال | VOLTA" },
      { property: "og:description", content: "الدخول الآمن وحالة اتصال نظام VOLTA" },
    ],
  }),
  component: Setup,
});

function Setup() {
  const { keyCheck, user, signIn, signOut } = useSession();
  const [identifier, setIdentifier] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [probe, setProbe] = useState<ProbeResult[] | null>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      const error = await signIn(identifier, pw);
      setMsg(error);
      if (!error) setPw("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="الدخول والإعداد" en="Secure access" description="دخول موحّد للموقع وتطبيق VOLTA على الهاتف." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <section className="glass-panel space-y-4 p-5">
          <div>
            <div className="text-sm font-semibold">تسجيل الدخول</div>
            <p className="mt-1 text-xs text-muted-foreground">استخدم رقم الهاتف اليمني أو البريد الإلكتروني وكلمة المرور الخاصة بحسابك.</p>
          </div>
          {keyCheck.ok && !user && (
            <form className="max-w-md space-y-3" onSubmit={submit}>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">رقم الهاتف أو البريد الإلكتروني</span>
                <input
                  type="text"
                  required
                  inputMode="tel"
                  autoComplete="username"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  placeholder="مثال: +9677XXXXXXXX"
                  className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
                  dir="ltr"
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium">كلمة المرور</span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={pw}
                  onChange={(event) => setPw(event.target.value)}
                  placeholder="أدخل كلمة المرور"
                  className="h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition focus:ring-2 focus:ring-ring/30"
                  dir="ltr"
                />
              </label>
              <button disabled={busy} className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-95 disabled:cursor-wait disabled:opacity-60">
                {busy ? "جارٍ التحقق…" : "تسجيل الدخول"}
              </button>
              {msg && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{msg}</p>}
              <p className="text-[11px] leading-5 text-muted-foreground">يلزم تفعيل Phone Auth في Supabase وإنشاء الحساب وتأكيد رقم الهاتف قبل استخدام الدخول بالهاتف.</p>
            </form>
          )}
          {keyCheck.ok && user && (
            <div className="space-y-3">
              <div className="rounded-xl border border-success/30 bg-success/5 p-3">
                <div className="text-xs text-muted-foreground">الجلسة الحالية</div>
                <div className="mt-1 font-semibold" dir="ltr">{user.phone ?? user.email ?? user.id}</div>
                <div className="mt-1 text-xs text-success">تم التحقق من جلسة المصادقة.</div>
              </div>
              <button onClick={() => void signOut()} className="rounded-xl border px-3 py-2 text-sm transition hover:bg-muted">تسجيل الخروج</button>
              <button onClick={async () => setProbe(await probeTables())} className="ms-2 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">فحص الجداول</button>
              {probe && <ul className="mt-3 space-y-1 text-xs">{probe.map((p) => <li key={p.table} className={p.ok ? "text-success" : "text-destructive"}><span className="num">{p.table}</span>: {p.message}</li>)}</ul>}
            </div>
          )}
          {!keyCheck.ok && <p className="rounded-lg bg-amber/10 p-3 text-sm text-amber-foreground">{KEY_REASON_TEXT[keyCheck.reason]}</p>}
        </section>

        <aside className="glass-panel space-y-3 p-5">
          <div className="text-sm font-semibold">اتصال النظام</div>
          <div className="rounded-xl border bg-card/70 p-3">
            <div className="text-xs text-muted-foreground">مشروع قاعدة البيانات</div>
            <div className="mt-1 break-all text-sm font-medium" dir="ltr">{FIELD_SALES_URL}</div>
            <div className="mt-1 text-xs text-muted-foreground">المخطط: <span className="num">{FIELD_SALES_SCHEMA}</span></div>
          </div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span>المفتاح العام</span>
            <span className={keyCheck.ok ? "text-success" : "text-destructive"}>{keyCheck.ok ? "مُعدّ" : "غير مُعدّ"}</span>
          </div>
          <p className="text-xs leading-5 text-muted-foreground">المتصفح يستخدم مفتاح Supabase العام فقط. لا تُحفظ مفاتيح الإدارة أو أسرار الخادم داخل الموقع أو APK.</p>
        </aside>
      </div>
    </div>
  );
}
