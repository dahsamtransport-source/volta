import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { useSession } from "@/data/session";
import { probeTables, type ProbeResult } from "@/data/client";
import { FIELD_SALES_URL, FIELD_SALES_SCHEMA, KEY_REASON_TEXT } from "@/lib/config";

export const Route = createFileRoute("/setup")({
  head: () => ({
    meta: [
      { title: "الإعداد والاتصال | لحج زيوت" },
      { name: "description", content: "حالة الاتصال والأمان" },
      { property: "og:title", content: "الإعداد والاتصال | لحج زيوت" },
      { property: "og:description", content: "حالة الاتصال والأمان" },
    ],
  }),
  component: Setup,
});

function Setup() {
  const { keyCheck, user, signIn } = useSession();
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [probe, setProbe] = useState<ProbeResult[] | null>(null);
  return (
    <div className="space-y-4">
      <PageHeader title="الإعداد والاتصال" en="Setup" />
      <div className="glass-panel space-y-1 p-4 text-sm">
        <div>
          المشروع: <span className="num">{FIELD_SALES_URL}</span> — المخطط:{" "}
          <span className="num">{FIELD_SALES_SCHEMA}</span>
        </div>
        <div>المفتاح العام: {keyCheck.ok ? "مُعَدّ" : KEY_REASON_TEXT[keyCheck.reason]}</div>
        <div className="text-xs text-muted-foreground">
          يُضبط عبر المتغير VITE_FIELD_SALES_PUBLISHABLE_KEY (مفتاح عام فقط).
        </div>
      </div>
      {keyCheck.ok && !user && (
        <form
          className="glass-panel max-w-sm space-y-2 p-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setMsg(await signIn(email, pw));
          }}
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="h-9 w-full rounded-md border bg-card px-2 text-sm"
          />
          <input
            type="password"
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="كلمة المرور"
            className="h-9 w-full rounded-md border bg-card px-2 text-sm"
          />
          <button className="h-9 w-full rounded-md bg-primary text-sm text-primary-foreground">
            تسجيل الدخول
          </button>
          {msg && (
            <p role="alert" className="text-xs text-destructive">
              {msg}
            </p>
          )}
        </form>
      )}
      {keyCheck.ok && user && (
        <div className="glass-panel p-4">
          <button
            onClick={async () => setProbe(await probeTables())}
            className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
          >
            فحص الجداول
          </button>
          {probe && (
            <ul className="mt-3 space-y-1 text-xs">
              {probe.map((p) => (
                <li key={p.table} className={p.ok ? "text-success" : "text-destructive"}>
                  <span className="num">{p.table}</span>: {p.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
