import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { getClient } from "./client";
import { getKeyCheck, type KeyCheck } from "@/lib/config";
import { resolveAccess, type AccessState } from "@/lib/auth/roles";

export interface SessionValue {
  keyCheck: KeyCheck;
  loading: boolean;
  user: User | null;
  access: AccessState;
  online: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
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
    if (!c) { setLoading(false); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }
    // getUser re-validates with the auth server (trusted app_metadata).
    c.auth.getUser().then(({ data }) => { setUser(data.user ?? null); setLoading(false); });
    const { data: sub } = c.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED")
        c.auth.getUser().then(({ data }) => setUser(data.user ?? null));
    });
    return () => { sub.subscription.unsubscribe(); window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const value = useMemo<SessionValue>(() => ({
    keyCheck, loading, user, online,
    access: resolveAccess(user),
    signIn: async (email, password) => {
      const c = getClient();
      if (!c) return "غير متصل بقاعدة البيانات";
      const { error } = await c.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    signOut: async () => { await getClient()?.auth.signOut(); },
  }), [keyCheck, loading, user, online]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSession outside SessionProvider");
  return v;
}

export { Ctx as SessionContext };