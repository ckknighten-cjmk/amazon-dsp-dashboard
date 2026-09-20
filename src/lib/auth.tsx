/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEMO_USERS } from "../data/seed";
import type { SessionUser } from "../types/database";
import { getSupabase, isSupabaseConfigured } from "./supabase";

const STORAGE_KEY = "dsp-session";

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  demoMode: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readSession());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const demoMode = !isSupabaseConfigured();

  const persist = (next: SessionUser | null) => {
    setUser(next);
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const login = useCallback(async (email: string, password: string): Promise<SessionUser> => {
    setLoading(true);
    setError(null);
    try {
      const sb = getSupabase();
      if (sb) {
        const { data, error: authError } = await sb.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        const { data: profile, error: profileError } = await sb
          .from("profiles")
          .select("email, full_name, role, station_id, driver_id, avatar_initials")
          .eq("auth_user_id", data.user?.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (!profile) throw new Error("Profile not found for this account.");
        const session = {
          email: profile.email,
          fullName: profile.full_name,
          role: profile.role,
          initials: profile.avatar_initials || profile.full_name.slice(0, 2).toUpperCase(),
          stationId: profile.station_id,
          driverId: profile.driver_id ?? undefined,
        };
        persist(session);
        return session;
      }

      const demo = DEMO_USERS.find(
        (account) => account.email.toLowerCase() === email.toLowerCase() && account.password === password,
      );
      if (!demo) throw new Error("Invalid email or password.");
      const session = {
        email: demo.email,
        fullName: demo.fullName,
        role: demo.role,
        initials: demo.initials,
        stationId: demo.stationId,
        driverId: demo.driverId,
      };
      persist(session);
      return session;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in.";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    const sb = getSupabase();
    if (sb) await sb.auth.signOut();
    persist(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, error, demoMode, login, logout }),
    [user, loading, error, demoMode, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
