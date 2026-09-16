"use client";

import {
  ReactNode,
  useEffect,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AuthGateProps = {
  children: ReactNode;
};

const publicRoutes = ["/login", "/signup"];

export default function AuthGate({
  children,
}: AuthGateProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [error, setError] = useState("");

  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    let mounted = true;

    async function prepareSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!session) {
        setIsLoggedIn(false);
        setWorkspaceReady(false);
        setCheckingAuth(false);

        if (!publicRoutes.includes(pathname)) {
          router.replace("/login");
        }

        return;
      }

      setIsLoggedIn(true);

      const { error: workspaceError } = await supabase.rpc(
        "ensure_my_workspace",
      );

      if (!mounted) {
        return;
      }

      if (workspaceError) {
        console.error(
          "Workspace setup error:",
          workspaceError,
        );

        setError(
          "Your account is logged in, but workspace setup failed.",
        );
        setCheckingAuth(false);
        return;
      }

      setWorkspaceReady(true);
      setCheckingAuth(false);

      if (publicRoutes.includes(pathname)) {
        router.replace("/");
      }
    }

    prepareSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) {
          return;
        }

        if (event === "SIGNED_OUT" || !session) {
          setIsLoggedIn(false);
          setWorkspaceReady(false);
          setCheckingAuth(false);

          if (!publicRoutes.includes(pathname)) {
            router.replace("/login");
          }

          return;
        }

        if (event === "SIGNED_IN") {
          prepareSession();
        }
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  if (checkingAuth) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-lg font-semibold text-cyan-400">
            BusinessPilot AI
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Preparing your private workspace...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 text-center">
          <h1 className="text-xl font-bold text-red-300">
            Workspace Error
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            {error}
          </p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-5 rounded-xl bg-cyan-400 px-4 py-2 font-semibold text-slate-950"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!isLoggedIn && !isPublicRoute) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Redirecting to login...
        </p>
      </main>
    );
  }

  if (isLoggedIn && !workspaceReady && !isPublicRoute) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <p className="text-slate-400">
          Loading workspace...
        </p>
      </main>
    );
  }

  return (
    <>
      {isLoggedIn && !isPublicRoute && (
        <button
          type="button"
          onClick={logout}
          className="fixed right-4 top-4 z-50 rounded-lg border border-red-500/40 bg-slate-900 px-3 py-2 text-sm text-red-300 shadow-lg hover:bg-red-500/10"
        >
          Logout
        </button>
      )}

      {children}
    </>
  );
}
