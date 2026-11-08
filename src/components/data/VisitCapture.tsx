import { useCallback, useEffect, useRef, useState } from "react";
import { getClient } from "@/data/client";
import { useSession } from "@/data/session";
import { getQueue, newIdempotencyKey, type QueuedMutation } from "@/lib/offline/queue";

type Establishment = { id: string; code: string; name: string };
type Representative = { id: string; employee_code: string; full_name: string };
type GpsPoint = { latitude: number; longitude: number; accuracy: number };

const ESTABLISHMENTS_CACHE = "volta.offline.establishments.v1";
const REPRESENTATIVES_CACHE = "volta.offline.representatives.v1";
const DEVICE_ID_KEY = "volta.device.id.v1";

const OUTCOMES = [
  { value: "completed", label: "تمت الزيارة" },
  { value: "no_contact", label: "لم يتم التواصل" },
  { value: "closed", label: "المنشأة مغلقة" },
  { value: "follow_up", label: "تحتاج متابعة" },
  { value: "not_interested", label: "غير مهتم" },
] as const;

function readCache<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

function deviceId(): string {
  let value = localStorage.getItem(DEVICE_ID_KEY);
  if (!value) {
    value = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, value);
  }
  return value;
}

function isPermanentSyncError(error: { code?: string; message?: string }): boolean {
  return ["42501", "23503", "23514", "22023", "22P02"].includes(error.code ?? "");
}

export function VisitCapture() {
  const { access, online } = useSession();
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [establishmentId, setEstablishmentId] = useState("");
  const [representativeId, setRepresentativeId] = useState("");
  const [outcome, setOutcome] = useState<(typeof OUTCOMES)[number]["value"]>("completed");
  const [contactPerson, setContactPerson] = useState("");
  const [notes, setNotes] = useState("");
  const [gps, setGps] = useState<GpsPoint | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [lookupMessage, setLookupMessage] = useState("");
  const syncLock = useRef(false);

  const isManager = access.status === "granted" && access.role !== "representative";
  const ownRepresentativeId =
    access.status === "granted" && access.role === "representative"
      ? access.representativeId
      : null;

  const refreshQueueCounts = useCallback(async () => {
    try {
      const rows = await getQueue().list();
      const visits = rows.filter((item) => item.table === "visits");
      setPendingCount(visits.filter((item) => item.status === "pending").length);
      setConflictCount(visits.filter((item) => item.status === "conflict" || item.status === "failed").length);
    } catch {
      setLookupMessage("تعذر فتح مخزن العمليات المحلية على هذا الجهاز.");
    }
  }, []);

  const loadLookups = useCallback(async () => {
    const cachedEstablishments = readCache<Establishment>(ESTABLISHMENTS_CACHE);
    const cachedRepresentatives = readCache<Representative>(REPRESENTATIVES_CACHE);
    setEstablishments(cachedEstablishments);
    if (isManager) setRepresentatives(cachedRepresentatives);

    const client = getClient();
    if (!client || !navigator.onLine) {
      setLookupMessage(cachedEstablishments.length ? "تُستخدم قائمة المنشآت المحفوظة على هذا الجهاز." : "اتصل بالإنترنت مرة واحدة لتحميل قائمة المنشآت قبل تسجيل الزيارة دون اتصال.");
      return;
    }

    const establishmentQuery = client
      .from("establishments")
      .select("id,code,name")
      .order("name", { ascending: true })
      .limit(1000);

    const representativeQuery = isManager
      ? client.from("representatives").select("id,employee_code,full_name").eq("is_active", true).order("full_name")
      : Promise.resolve({ data: null, error: null });

    const [establishmentResult, representativeResult] = await Promise.all([
      establishmentQuery,
      representativeQuery,
    ]);

    if (!establishmentResult.error && establishmentResult.data) {
      const rows = establishmentResult.data as Establishment[];
      setEstablishments(rows);
      localStorage.setItem(ESTABLISHMENTS_CACHE, JSON.stringify(rows));
      setLookupMessage("");
    } else {
      setLookupMessage("تعذر تحديث المنشآت؛ ستظل القائمة المحلية متاحة عند وجودها.");
    }

    if (isManager && !representativeResult.error && representativeResult.data) {
      const rows = representativeResult.data as Representative[];
      setRepresentatives(rows);
      localStorage.setItem(REPRESENTATIVES_CACHE, JSON.stringify(rows));
    }
  }, [isManager]);

  const syncPending = useCallback(async () => {
    if (!navigator.onLine || syncLock.current) return;
    const client = getClient();
    if (!client) return;

    syncLock.current = true;
    try {
      const items = await getQueue().list();
      const pending = items.filter((item) => item.table === "visits" && item.op === "insert" && item.status === "pending");
      for (const item of pending) {
        const payload = item.payload;
        const { error } = await client.from("visits").insert(payload);
        if (!error) {
          await getQueue().discard(item.idempotencyKey);
          continue;
        }

        // A unique-key retry may mean the server accepted the first attempt.
        if (error.code === "23505") {
          const { data } = await client
            .from("visits")
            .select("id")
            .eq("device_id", String(payload.device_id))
            .eq("idempotency_key", String(payload.idempotency_key))
            .maybeSingle();
          if (data) {
            await getQueue().discard(item.idempotencyKey);
            continue;
          }
          await getQueue().markConflict(item.idempotencyKey, "تعذر التحقق من العملية المكررة على الخادم.");
          continue;
        }

        if (isPermanentSyncError(error)) {
          await getQueue().markConflict(item.idempotencyKey, error.message);
          continue;
        }

        // Network, timeout, and transient server errors remain pending for retry.
        break;
      }
    } finally {
      syncLock.current = false;
      await refreshQueueCounts();
    }
  }, [refreshQueueCounts]);

  useEffect(() => {
    void loadLookups();
    void refreshQueueCounts();
    void syncPending();

    const onOnline = () => { void syncPending(); void loadLookups(); };
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncPending();
    };
    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadLookups, refreshQueueCounts, syncPending]);

  useEffect(() => {
    if (ownRepresentativeId) setRepresentativeId(ownRepresentativeId);
  }, [ownRepresentativeId]);

  const captureLocation = () => {
    setMessage("");
    if (!("geolocation" in navigator)) {
      setMessage("تحديد الموقع غير مدعوم في هذا المتصفح.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setMessage("تم التقاط الموقع بعد منح الإذن. سيُرسل مع الزيارة.");
      },
      (error) => setMessage(error.message || "تعذر تحديد الموقع؛ يمكنك تسجيل الزيارة دون إحداثيات."),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const saveVisit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");

    const repId = ownRepresentativeId ?? (isManager ? representativeId : "");
    if (!establishmentId || !repId) {
      setMessage("اختر المنشأة والمندوب قبل الحفظ.");
      return;
    }

    setBusy(true);
    try {
      const now = new Date().toISOString();
      const key = newIdempotencyKey();
      const payload: Record<string, unknown> = {
        establishment_id: establishmentId,
        representative_id: repId,
        visited_at: now,
        outcome,
        contact_person: contactPerson.trim() || null,
        notes: notes.trim() || null,
        device_id: deviceId(),
        idempotency_key: key,
        device_created_at: now,
        gps_capture_consent: Boolean(gps),
        photo_consent: false,
      };

      if (gps) {
        payload.latitude = gps.latitude;
        payload.longitude = gps.longitude;
        payload.gps_accuracy_m = gps.accuracy;
      }

      const accepted = await getQueue().enqueue({
        idempotencyKey: key,
        table: "visits",
        op: "insert",
        payload,
      });

      if (!accepted) {
        setMessage("هذه العملية موجودة بالفعل في قائمة الانتظار.");
        return;
      }

      setContactPerson("");
      setNotes("");
      setGps(null);
      setMessage(navigator.onLine
        ? "حُفظت الزيارة محلياً، وجارٍ إرسالها وفق صلاحيات قاعدة البيانات."
        : "حُفظت الزيارة على الجهاز. ستتم محاولة المزامنة عند عودة الاتصال وفتح التطبيق.");
      await refreshQueueCounts();
      if (navigator.onLine) await syncPending();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر حفظ الزيارة محلياً.");
    } finally {
      setBusy(false);
    }
  };

  if (access.status !== "granted") return null;

  return (
    <section className="glass-panel space-y-3 p-4" aria-labelledby="visit-capture-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="visit-capture-title" className="text-base font-semibold">تسجيل زيارة ميدانية</h2>
          <p className="text-xs text-muted-foreground">تُحفظ العملية محلياً أولاً ثم تُرسل مع مفتاح منع التكرار.</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border px-2 py-1">{online ? "متصل" : "دون اتصال"}</span>
          <span className="rounded-full border px-2 py-1">بانتظار المزامنة: {pendingCount}</span>
          {conflictCount > 0 && <span className="rounded-full border px-2 py-1 text-destructive">تحتاج مراجعة: {conflictCount}</span>}
        </div>
      </div>

      {isManager && (
        <label className="block space-y-1 text-sm">
          <span>المندوب</span>
          <select value={representativeId} onChange={(event) => setRepresentativeId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" required>
            <option value="">اختر المندوب</option>
            {representatives.map((rep) => <option key={rep.id} value={rep.id}>{rep.full_name} — {rep.employee_code}</option>)}
          </select>
        </label>
      )}

      <form onSubmit={saveVisit} className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-1 text-sm md:col-span-2">
          <span>المنشأة</span>
          <select value={establishmentId} onChange={(event) => setEstablishmentId(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3" required>
            <option value="">اختر المنشأة</option>
            {establishments.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.code}</option>)}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span>نتيجة الزيارة</span>
          <select value={outcome} onChange={(event) => setOutcome(event.target.value as (typeof OUTCOMES)[number]["value"])} className="h-10 w-full rounded-md border bg-background px-3">
            {OUTCOMES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>

        <label className="block space-y-1 text-sm">
          <span>الشخص الذي تم التواصل معه</span>
          <input value={contactPerson} onChange={(event) => setContactPerson(event.target.value)} maxLength={160} className="h-10 w-full rounded-md border bg-background px-3" />
        </label>

        <label className="block space-y-1 text-sm md:col-span-2">
          <span>ملاحظات الزيارة</span>
          <textarea value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={4000} rows={3} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>

        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button type="button" onClick={captureLocation} className="rounded-md border px-3 py-2 text-sm">
            {gps ? "تم إرفاق الموقع" : "إرفاق موقعي بموافقتي"}
          </button>
          {gps && <span className="text-xs text-muted-foreground">دقة تقريبية: {Math.round(gps.accuracy)} متر</span>}
          <button type="submit" disabled={busy || !establishmentId || !(ownRepresentativeId || representativeId)} className="ms-auto rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">
            {busy ? "جارٍ الحفظ…" : "حفظ الزيارة"}
          </button>
        </div>
      </form>

      {lookupMessage && <p className="text-xs text-muted-foreground" role="status">{lookupMessage}</p>}
      {message && <p className="text-sm" role="status">{message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void syncPending()} disabled={!online || busy || pendingCount === 0} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">
          مزامنة الآن
        </button>
        <button type="button" onClick={() => void loadLookups()} disabled={!online} className="rounded-md border px-3 py-1.5 text-xs disabled:opacity-50">
          تحديث القوائم
        </button>
      </div>
      {conflictCount > 0 && (
        <p className="text-xs text-destructive">توجد عمليات رفضتها قاعدة البيانات أو تعذر التحقق منها. لم نحذفها؛ راجع سجل المزامنة قبل إعادة المحاولة.</p>
      )}
    </section>
  );
}
