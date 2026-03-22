"use client";

import {
    createContext,
    useContext,
    useEffect,
    useRef,
    useState,
    ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    // Capture router in a stable ref so the effect below can always access the
    // latest router without listing it as a dependency (which would cause the
    // listener to be torn down and re-registered on every router instance change).
    const routerRef = useRef(router);
    useEffect(() => {
        routerRef.current = router;
    });

    useEffect(() => {
        const supabase = createClient();

        // ─── STEP 1: Read initial session with Staggered Initialization ───
        //
        // On mount (especially multi-tab startup), we add a small random delay
        // (0-300ms) to stagger the network calls if a refresh is needed.
        // This spreads out the "thundering herd" and prevents 429s.
        async function readInitialSession(retryCount = 0) {
            try {
                // Stagger only on the first attempt
                if (retryCount === 0) {
                    const stagger = Math.floor(Math.random() * 300);
                    await new Promise(resolve => setTimeout(resolve, stagger));
                }

                const {
                    data: { session: initial },
                    error
                } = await supabase.auth.getSession();

                // Handle Auth errors (429 or Lock timeouts)
                if (error) {
                    console.warn(`→ [AUTH] Session Read Error (Attempt ${retryCount + 1}):`, error.message);

                    // Report to health monitor
                    await fetch('/api/auth/health', {
                        method: 'POST',
                        body: JSON.stringify({
                            action: error.status === 429 ? 'auth:429' : 'auth:lock_fail',
                            error: error.message,
                            path: window.location.pathname,
                            metadata: { retryCount }
                        })
                    }).catch(() => { }); // Silence reporting errors

                    // Retry once after 2 seconds if it's a lock or rate limit issue
                    if (retryCount < 1 && (error.status === 429 || error.message.includes('lock'))) {
                        setTimeout(() => readInitialSession(retryCount + 1), 2000);
                        return;
                    }
                }

                setSession(initial);
                setUser(initial?.user ?? null);
            } catch (err) {
                console.error("→ [AUTH] Initial session read failed:", err);
            } finally {
                setLoading(false);
            }
        }

        readInitialSession();

        // ─── STEP 2: Register the ONE global auth state listener.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, currentSession) => {
            console.log(
                "→ [AUTH] Global State Change:",
                event,
                currentSession?.user?.email ?? "no user"
            );

            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (event === "SIGNED_OUT") {
                routerRef.current.push("/auth/login");
            }
        });

        // ─── STEP 3: Resume-from-Sleep / Long Idle Check ───
        //
        // If the user tab has been idle for a long time (PC sleep), we gently 
        // validate the session when focus returns. We only do this every 30 mins
        // to avoid spamming the Auth server during active tab switching.
        let lastCheck = Date.now();
        const handleFocus = async () => {
            const now = Date.now();
            if (now - lastCheck > 1000 * 60 * 30) { // 30 minutes
                console.log("→ [AUTH] Resuming after idle, validating session...");
                lastCheck = now;
                await readInitialSession(0);
            }
        };
        window.addEventListener('focus', handleFocus);

        // ─── STEP 4: Cleanup
        return () => {
            subscription.unsubscribe();
            window.removeEventListener('focus', handleFocus);
        };

        // ─── CRITICAL: Empty dependency array.
        //
        // This guarantees:
        //   1. The listener is registered on EXACTLY ONE mount.
        //   2. Re-renders of AuthProvider (e.g. because a child caused a context
        //      update) do NOT re-run this effect, do NOT re-register the listener,
        //      and do NOT call unsubscribe prematurely.
        //   3. There is no dependency on router, supabase, or any changing value —
        //      all are accessed via stable refs or are module-level singletons.
        //
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const signOut = async () => {
        const supabase = createClient();
        // signOut() clears the localStorage key → fires SIGNED_OUT in ALL tabs
        // via the native storage event, handled by onAuthStateChange above.
        await supabase.auth.signOut();
        routerRef.current.push("/auth/login");
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
