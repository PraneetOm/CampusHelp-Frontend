import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase";

const AuthContext = createContext(null);

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
).replace(/\/$/, "");

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading");
  const [authError, setAuthError] = useState(null);

  const requestVersion = useRef(0);

  const loadProfile = useCallback(async (nextSession) => {
    const version = ++requestVersion.current;

    if (!nextSession?.access_token) {
      setSession(null);
      setUser(null);
      setAuthError(null);
      setStatus("unauthenticated");
      return;
    }

    setSession(nextSession);
    setUser(null);
    setAuthError(null);
    setStatus("loading");

    try {
      const response = await fetch(`${API_BASE}/api/users/me`, {
        headers: {
          Authorization: `Bearer ${nextSession.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            "Your campus profile was not found. Please contact your administrator."
          );
        }

        if (response.status === 401) {
          throw new Error(
            "Your session could not be verified. Please sign in again."
          );
        }

        throw new Error(
          `Unable to load your campus profile (${response.status}).`
        );
      }

      const profile = await response.json();

      // Ignore an old response if another auth event has happened.
      if (version !== requestVersion.current) return;

      setUser(profile);
      setStatus("authenticated");
    } catch (error) {
      if (version !== requestVersion.current) return;

      setUser(null);
      setAuthError(error.message);
      setStatus("profile_error");
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setStatus("configuration_error");
      setAuthError(
        "Supabase is not configured. Check your frontend .env file."
      );
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void loadProfile(nextSession);
    });

    return () => {
      requestVersion.current += 1;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) throw error;

    return data;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;

    const { error } = await supabase.auth.signOut();

    if (error) throw error;
  }, []);

  const resetPassword = useCallback(async (email) => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/login`,
      }
    );

    if (error) throw error;
  }, []);

  const value = useMemo(() => {
    const role = user?.roleName?.toUpperCase() ?? null;

    return {
      session,
      user,
      status,
      authError,
      loading: status === "loading",
      isAuthenticated: status === "authenticated",
      role,
      collegeId: user?.collegeId ?? null,
      departmentId: user?.departmentId ?? null,
      signIn,
      signOut,
      resetPassword,
    };
  }, [
    session,
    user,
    status,
    authError,
    signIn,
    signOut,
    resetPassword,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;