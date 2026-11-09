import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getClient } from "./client";
import { getKeyCheck, type KeyCheck } from "@/lib/config";
import { resolveAccess, type AccessState } from "@/lib/auth/roles";
import { isPhoneLike, normalizeYemenPhone } from "@/lib/auth/phone";

export interface SessionValue {
  keyCheck: KeyCheck;
  loading: boolean;
  user: User | null;
  access: AccessState;
  online: boolean;
  signIn: (identifier: string, password: string) => Promise<string | null>;
  requestWhatsAppOtp: (phone: string) => Promise<string | null>;
  verifyWhatsAppOtp: (phone: string, token: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [keyCheck] = useState<KeyCheck>(() => getKeyCheck());
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    const c = getClient();
    if (!c) {
      setLoading(false);
      return () => {
        window.removeEventListener("online", on);
        window.removeEventListener("offline", off);
      };
    }

    let active = true;
    let authEventReceived = false;

    // Subscribe before the one-off lookup. A slow getUser() response must not
    // overwrite a newer SIGNED_OUT/SIGNED_IN event.
    const { data: sub } = c.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      // INITIAL_SESSION is only the cached browser session; getUser() still
      // validates it with Auth. Later events must win over that lookup.
      if (event !== "INITIAL_SESSION") authEventReceived = true;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    c.auth.getUser().then(({ data, error }) => {
      if (!active || authEventReceived) return;
      setUser(error ? null : data.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (active && !authEventReceived) {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const value = useMemo<SessionValue>(() => ({
    keyCheck,
    loading,
    user,
    online,
    access: resolveAccess(user),
    signIn: async (identifier, password) => {
      const c = getClient();
      if (!c) return "الاتصال بقاعدة البيانات غير مُعدّ حالياً.";

      const normalizedPhone = normalizeYemenPhone(identifier);
      if (isPhoneLike(identifier)) {
        if (!normalizedPhone) return "رقم الهاتف غير صحيح. أدخل رقم يمنياً يبدأ بـ 7 أو بصيغة +967.";
        const { error } = await c.auth.signInWithPassword({ phone: normalizedPhone, password });
        if (error) return "تعذر تسجيل الدخول. تحقق من بيانات الحساب.";
        return null;
      }

      if (!identifier.includes("@")) return "أدخل رقم هاتف يمنياً أو بريداً إلكترونياً صحيحاً.";
      const { error } = await c.auth.signInWithPassword({ email: identifier.trim(), password });
      return error ? "تعذر تسجيل الدخول. تحقق من بيانات الحساب." : null;
    },
    requestWhatsAppOtp: async (phone) => {
      const c = getClient();
      if (!c) return "الاتصال بقاعدة البيانات غير مُعدّ حالياً.";
      const normalizedPhone = normalizeYemenPhone(phone);
      if (!normalizedPhone) return "رقم الهاتف اليمني غير صحيح.";
      try {
        const { error } = await c.auth.signInWithOtp({
          phone: normalizedPhone,
          options: {
            channel: "whatsapp",
            // New staff must be provisioned by an administrator first.
            // This prevents public self-registration and unassigned accounts.
            shouldCreateUser: false,
          },
        });
        return error
          ? "تعذر إرسال رمز WhatsApp. تأكد أن الحساب أُنشئ مسبقاً وأن قناة WhatsApp مهيأة."
          : null;
      } catch {
        return "تعذر الاتصال بخدمة WhatsApp. تحقق من الإنترنت ثم أعد المحاولة.";
      }
    },
    verifyWhatsAppOtp: async (phone, token) => {
      const c = getClient();
      if (!c) return "الاتصال بقاعدة البيانات غير مُعدّ حالياً.";
      const normalizedPhone = normalizeYemenPhone(phone);
      if (!normalizedPhone) return "رقم الهاتف اليمني غير صحيح.";
      const cleanToken = token.replace(/\D/g, "");
      if (!/^\d{6}$/.test(cleanToken)) return "أدخل رمز التحقق المكوّن من 6 أرقام.";
      try {
        const { error } = await c.auth.verifyOtp({
          phone: normalizedPhone,
          token: cleanToken,
          // Supabase verifies WhatsApp-delivered phone OTPs using type "sms".
          type: "sms",
        });
        return error ? "رمز التحقق غير صحيح أو انتهت صلاحيته. اطلب رمزاً جديداً." : null;
      } catch {
        return "تعذر الاتصال بخدمة التحقق. تحقق من الإنترنت ثم أعد المحاولة.";
      }
    },
    signOut: async () => {
      try {
        await getClient()?.auth.signOut();
      } catch {
        // Keep the UI responsive if the network is unavailable.
      }
    },
  }), [keyCheck, loading, user, online]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}

export { Ctx as SessionContext };
