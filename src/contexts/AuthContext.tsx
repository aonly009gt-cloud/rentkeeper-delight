import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import liff from '@line/liff';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithLine: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Auto-verify LIFF if coming back from redirect
    const initLiff = async () => {
      try {
        const liffId = import.meta.env.VITE_LINE_LIFF_ID;
        if (liffId) {
          await liff.init({ liffId });
          if (liff.isLoggedIn() && !session) {
            // We are logged into LIFF but not Supabase, call the verification
            await signInWithLine();
          }
        }
      } catch (e) {
        console.error("LIFF Init Error:", e);
      }
    };
    initLiff();

    return () => subscription.unsubscribe();
  }, [session]);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithLine = async () => {
    try {
      const liffId = import.meta.env.VITE_LINE_LIFF_ID;
      if (!liffId) throw new Error("VITE_LINE_LIFF_ID is not set in .env");

      await liff.init({ liffId });

      if (!liff.isLoggedIn()) {
        liff.login();
        return { error: null }; // Will redirect
      }

      const accessToken = liff.getAccessToken();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Need anon key for CORS if enforced, though Edge Functions default to accepting all

      let res;
      try {
        res = await fetch(`${supabaseUrl}/functions/v1/login-line-admin`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify({ accessToken }),
        });
      } catch (e: any) {
        throw new Error(`ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${e.message}`);
      }

      let data;
      try {
        data = await res.json();
      } catch (e: any) {
        throw new Error(`รูปแบบข้อมูลจากเซิร์ฟเวอร์ไม่ถูกต้อง: ${res.statusText}`);
      }

      if (data.success && data.session) {
        const { error: sessionError } = await supabase.auth.setSession(data.session);
        if (sessionError) throw sessionError;
        return { error: null };
      } else {
        if (data.error === "ADMIN_SECRETS_MISSING" || data.error === "UNAUTHORIZED") {
          throw new Error(`${data.message}\nYour LINE ID: ${data.yourLineId}`);
        }
        throw new Error(data.error || data.message || `Login failed (HTTP ${res.status}): ${JSON.stringify(data)}`);
      }
    } catch (err: any) {
      return { error: err as Error };
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithLine, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
