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

        // ─── STEP 1: Read initial session from localStorage (no network call).
        //
        // @supabase/ssr persists the session in localStorage under a fixed key.
        // getSession() reads from that cache synchronously in the same microtask:
        //   • If the token is still valid → returns immediately, zero requests.
        //   • If the token is expired    → autoRefreshToken fires ONE /token call.
        //     That call is coordinated via a browser Storage Lock (Web Locks API)
        //     so even multiple tabs calling getSession() simultaneously will only
        //     produce a single network request — the others wait on the lock and
        //     read the refreshed value written to localStorage by the winner.
        //
        // We call this ONCE on mount, purely to hydrate React state from the
        // already-in-storage session so the UI doesn't flicker.
        async function readInitialSession() {
            try {
                const {
                    data: { session: initial },
                } = await supabase.auth.getSession();
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
        //
        // This is the ONLY place in the entire app where auth state is observed.
        // It fires for:
        //   • INITIAL_SESSION    — immediately on registration with cached session
        //   • SIGNED_IN          — after a successful login
        //   • TOKEN_REFRESHED    — autoRefreshToken silently renewed the access token
        //   • SIGNED_OUT         — explicit signOut(), or unrecoverable expiry
        //   • USER_UPDATED       — user metadata changed
        //
        // Multi-tab token refresh guarantee:
        //   1. All tabs share the same localStorage key (same origin, same Supabase URL).
        //   2. When a token nears expiry, the first tab to trigger autoRefreshToken
        //      acquires a Web Lock ("sb-refresh-token") exclusive to that lock name.
        //   3. Only the lock-holder makes the POST /token?grant_type=refresh_token call.
        //   4. On success it writes the new session to localStorage and releases the lock.
        //   5. Other tabs receive a native `storage` event, which @supabase/ssr
        //      translates into a TOKEN_REFRESHED onAuthStateChange event — without
        //      making any network call of their own.
        //
        // Result: exactly ONE /token request per expiry cycle, regardless of how many
        // tabs are open. No 429s, no lock errors, no AbortErrors.
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
                // routerRef is always fresh — never a stale closure.
                routerRef.current.push("/auth/login");
            }
        });

        // ─── STEP 3: Cleanup — runs on component unmount (or HMR hot-reload).
        //
        // subscription.unsubscribe() deregisters the listener from Supabase's
        // internal emitter. Because the dep array is [], this cleanup only fires
        // once: when AuthProvider is removed from the tree, which in practice
        // only happens when the app is closed or during HMR. It is NOT called
        // between renders.
        return () => {
            subscription.unsubscribe();
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
