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
    c.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setUser(error ? null : data.user ?? null);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setUser(null);
        setLoading(false);
      }
    });

    const { data: sub } = c.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        // The auth event session is authoritative for the current browser session.
        setUser(session?.user ?? null);
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
        if (error) return "تعذر تسجيل الدخول. تحقق من كلمة المرور، ومن تفعيل Phone Auth وتأكيد رقم الهاتف.";
        return null;
      }

      if (!identifier.includes("@")) return "أدخل رقم هاتف يمنياً أو بريداً إلكترونياً صحيحاً.";
      const { error } = await c.auth.signInWithPassword({ email: identifier.trim(), password });
      return error ? "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور." : null;
    },
    signOut: async () => {
      await getClient()?.auth.signOut();
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
