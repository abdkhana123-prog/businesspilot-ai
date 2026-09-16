"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function InvitePage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const inviteToken = params.get("token") || "";
    const inviteEmail = params.get("email") || "";

    setToken(inviteToken);
    setEmail(inviteEmail);

    checkLogin();
  }, []);

  async function checkLogin() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    setLoggedIn(Boolean(session));
    setLoading(false);
  }

  async function acceptInvitation() {
    if (!token) {
      setMessage("The invitation link is missing its token.");
      return;
    }

    setAccepting(true);
    setMessage("");
    setSuccess(false);

    try {
      const { data, error } = await supabase.rpc(
        "accept_team_invitation",
        {
          invitation_token: token,
        },
      );

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(
          data?.message || "Could not accept invitation.",
        );
      }

      setSuccess(true);
      setMessage(
        data.message || "Invitation accepted successfully.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not accept invitation.",
      );
    } finally {
      setAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <p className="text-slate-400">
          Checking invitation...
        </p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-widest text-cyan-400">
          BusinessPilot AI
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Workspace Invitation
        </h1>

        {email && (
          <p className="mt-4 rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
            This invitation was created for:
              

            <strong className="text-cyan-300">{email}</strong>
          </p>
        )}

        {!token && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
            This invitation link is incomplete or invalid.
          </div>
        )}

        {message && (
          <div
            className={`mt-6 rounded-xl p-4 ${
              success
                ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300"
            }`}
          >
            {message}
          </div>
        )}

        {success ? (
          <a
            href="/dashboard"
            className="mt-6 block rounded-xl bg-cyan-400 px-5 py-3 text-center font-bold text-slate-950 hover:bg-cyan-300"
          >
            Open Dashboard
          </a>
        ) : !loggedIn ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm leading-6 text-slate-400">
              Pehle usi email se account banao ya login karo jiske
              liye invitation bheji gayi hai. Login ke baad yeh link
              dobara open karo.
            </p>

            <div className="flex gap-3">
              <a
                href="/login"
                className="flex-1 rounded-xl bg-cyan-400 px-4 py-3 text-center font-bold text-slate-950 hover:bg-cyan-300"
              >
                Login
              </a>

              <a
                href="/signup"
                className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-center text-slate-300 hover:border-cyan-400"
              >
                Sign Up
              </a>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={acceptInvitation}
            disabled={!token || accepting}
            className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-3 font-bold text-slate-950 disabled:opacity-50"
          >
            {accepting
              ? "Accepting invitation..."
              : "Accept Invitation"}
          </button>
        )}

        <a
          href="/"
          className="mt-6 block text-center text-sm text-slate-500 hover:text-cyan-300"
        >
          Back to BusinessPilot
        </a>
      </section>
    </main>
  );
}
